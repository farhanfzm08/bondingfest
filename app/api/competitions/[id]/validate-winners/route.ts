import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: parse HH:MM:SS.mmm to ms
function timeStrToMs(s: string): number {
  if (!s) return Infinity;
  const parts = s.replace(",", ".").split(":");
  if (parts.length === 3) {
    const [h, m, secMs] = parts;
    const [sec, ms = "0"] = secMs.split(".");
    return (Number(h) * 3600 + Number(m) * 60 + Number(sec)) * 1000 + Number(ms.padEnd(3, "0").slice(0, 3));
  }
  if (parts.length === 2) {
    const [m, secMs] = parts;
    const [sec, ms = "0"] = secMs.split(".");
    return (Number(m) * 60 + Number(sec)) * 1000 + Number(ms.padEnd(3, "0").slice(0, 3));
  }
  return parseFloat(s) * 1000;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        event: true,
        matches: { include: { participants: { include: { team: true, participant: true } } } },
      },
    });

    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const isTeam = competition.type === "TEAM" || competition.type === "DUO";
    const cfg = competition.config ? JSON.parse(competition.config) : {};
    
    const pointSystem = competition.event.pointSystem ? JSON.parse(competition.event.pointSystem) : { first: 100, second: 75, third: 50 };
    const getPoints = (pos: number) => {
      if (pos === 1) return pointSystem.first || 100;
      if (pos === 2) return pointSystem.second || 75;
      if (pos === 3) return pointSystem.third || 50;
      return 0;
    };

    // Prepare list of champions to insert
    const championsToInsert: Array<{ position: number, teamId: string | null, participantId: string | null, section: string | null }> = [];

    if (competition.format === "TIME_TRIAL") {
      // TIME TRIAL LOGIC
      const sortFastest = cfg.sortOrder === "ASC" || cfg.sortOrder === "FASTEST";
      
      const entries: Array<{ id: string, teamId: string | null, participantId: string | null, section: string | null, val: number }> = [];
      
      for (const m of competition.matches) {
        if (m.status !== "COMPLETED") continue;
        for (const p of m.participants) {
          const id = p.teamId || p.participantId;
          if (!id) continue;
          
          let val = 0;
          if (cfg.scoreUnit === "waktu" || sortFastest) {
            val = p.timeResult ? timeStrToMs(p.timeResult) : Infinity;
          } else {
            val = p.score || 0;
          }
          
          if (val !== Infinity && val !== 0) {
            entries.push({
              id,
              teamId: p.teamId,
              participantId: p.participantId,
              section: p.team?.section || p.participant?.section || null,
              val,
            });
          }
        }
      }

      entries.sort((a, b) => sortFastest ? a.val - b.val : b.val - a.val);

      // Only take top 3
      const top3 = entries.slice(0, 3);
      top3.forEach((e, idx) => {
        championsToInsert.push({
          position: idx + 1,
          teamId: e.teamId,
          participantId: e.participantId,
          section: e.section,
        });
      });

    } else {
      // BRACKET / GROUP_STAGE LOGIC
      const bracketSize = cfg.bracketSize || 8;
      const finalMatch = competition.matches.find(m => m.bracketSlot === bracketSize - 1);
      const thirdPlaceMatch = competition.matches.find(m => m.bracketSlot === bracketSize);

      if (!finalMatch || finalMatch.status !== "COMPLETED") {
        return NextResponse.json({ error: "Pertandingan Final belum selesai." }, { status: 400 });
      }

      const p1 = finalMatch.participants[0];
      const p2 = finalMatch.participants[1];

      let winner = null;
      let runnerUp = null;

      if (p1?.result === "WIN" || (p1 && p2 && p1.score > p2.score)) {
        winner = p1; runnerUp = p2;
      } else if (p2?.result === "WIN" || (p1 && p2 && p2.score > p1.score)) {
        winner = p2; runnerUp = p1;
      }

      if (winner) {
        championsToInsert.push({
          position: 1,
          teamId: winner.teamId,
          participantId: winner.participantId,
          section: winner.team?.section || winner.participant?.section || null,
        });
      }
      if (runnerUp) {
        championsToInsert.push({
          position: 2,
          teamId: runnerUp.teamId,
          participantId: runnerUp.participantId,
          section: runnerUp.team?.section || runnerUp.participant?.section || null,
        });
      }

      if (thirdPlaceMatch && thirdPlaceMatch.status === "COMPLETED") {
        const tp1 = thirdPlaceMatch.participants[0];
        const tp2 = thirdPlaceMatch.participants[1];
        let third = null;
        if (tp1?.result === "WIN" || (tp1 && tp2 && tp1.score > tp2.score)) third = tp1;
        else if (tp2?.result === "WIN" || (tp1 && tp2 && tp2.score > tp1.score)) third = tp2;

        if (third) {
          championsToInsert.push({
            position: 3,
            teamId: third.teamId,
            participantId: third.participantId,
            section: third.team?.section || third.participant?.section || null,
          });
        }
      }
    }

    if (championsToInsert.length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang valid untuk menentukan juara." }, { status: 400 });
    }

    // Clear existing champions
    await prisma.champion.deleteMany({ where: { competitionId } });

    // Insert new champions
    await Promise.all(championsToInsert.map(c => 
      prisma.champion.create({
        data: {
          competitionId,
          position: c.position,
          teamId: c.teamId,
          participantId: c.participantId,
          section: c.section,
          awardPoints: getPoints(c.position),
        }
      })
    ));

    // After updating champions, recalculate overall standings
    // Delete all current overall standings for this event to rebuild
    await prisma.overallStanding.deleteMany({ where: { eventId: competition.eventId } });
    
    // Get all champions for the event
    const allEventChampions = await prisma.champion.findMany({
      where: { competition: { eventId: competition.eventId } },
      include: { team: true, participant: true }
    });

    const standingMap = new Map<string, { pts: number, gold: number, silver: number, bronze: number }>();
    
    for (const c of allEventChampions) {
      const sectionStr = c.section;
      if (!sectionStr) continue;

      const pts = c.awardPoints;
      
      // Handle collaboration logic
      if (c.team?.isCollaboration && c.team.sections && c.team.sectionWeights) {
        try {
          const sections = JSON.parse(c.team.sections);
          const weights = JSON.parse(c.team.sectionWeights);
          for (const s of sections) {
            const w = weights[s] || 0;
            if (w > 0) {
              const share = pts * (w / 100);
              const curr = standingMap.get(s) || { pts: 0, gold: 0, silver: 0, bronze: 0 };
              curr.pts += share;
              if (c.position === 1) curr.gold++;
              if (c.position === 2) curr.silver++;
              if (c.position === 3) curr.bronze++;
              standingMap.set(s, curr);
            }
          }
        } catch { /* ignore parse error */ }
      } else {
        const curr = standingMap.get(sectionStr) || { pts: 0, gold: 0, silver: 0, bronze: 0 };
        curr.pts += pts;
        if (c.position === 1) curr.gold++;
        if (c.position === 2) curr.silver++;
        if (c.position === 3) curr.bronze++;
        standingMap.set(sectionStr, curr);
      }
    }

    const standingsArr = Array.from(standingMap.entries()).sort((a, b) => {
      if (b[1].pts !== a[1].pts) return b[1].pts - a[1].pts;
      if (b[1].gold !== a[1].gold) return b[1].gold - a[1].gold;
      if (b[1].silver !== a[1].silver) return b[1].silver - a[1].silver;
      return b[1].bronze - a[1].bronze;
    });

    await Promise.all(standingsArr.map(([sec, st], idx) => 
      prisma.overallStanding.create({
        data: {
          eventId: competition.eventId,
          section: sec,
          totalPoints: st.pts,
          goldCount: st.gold,
          silverCount: st.silver,
          bronzeCount: st.bronze,
          rank: idx + 1
        }
      })
    ));

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menetapkan ${championsToInsert.length} juara dan memperbarui Klasemen Umum!`,
      champions: championsToInsert
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
