// prisma/seed.cjs — BONDING EVENT 2026 Manufacturing (v2)
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// Seksi-seksi dalam manufacturing
const SECTIONS = [
  { name: "Seksi Produksi A",     color: "#0891B2", order: 1 },
  { name: "Seksi Produksi B",     color: "#10B981", order: 2 },
  { name: "Seksi Quality Control",color: "#F97316", order: 3 },
  { name: "Seksi Maintenance",    color: "#8B5CF6", order: 4 },
  { name: "Seksi Engineering",    color: "#F59E0B", order: 5 },
  { name: "Seksi Logistics",      color: "#EC4899", order: 6 },
  { name: "Seksi PPIC",           color: "#14B8A6", order: 7 },
  { name: "Seksi HR & GA",        color: "#6366F1", order: 8 },
];

const COMPETITIONS = [
  { name: "Futsal Putra",     category: "Olahraga",    type: "TEAM",       format: "GROUP_STAGE", order: 1,
    config: JSON.stringify({ numGroups: 2, teamsPerGroup: 4, advanceCount: 2, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 }) },
  { name: "Badminton Ganda",  category: "Olahraga",    type: "DUO",        format: "BRACKET",     order: 2,
    config: JSON.stringify({ bracketSize: 8, thirdPlace: true, bestOf: 1 }) },
  { name: "Mobile Legends",   category: "Esports",     type: "TEAM",       format: "GROUP_STAGE", order: 3,
    config: JSON.stringify({ numGroups: 2, teamsPerGroup: 4, advanceCount: 2, pointsWin: 3, pointsDraw: 0, pointsLoss: 0 }) },
  { name: "Tenis Meja",       category: "Olahraga",    type: "INDIVIDUAL", format: "BRACKET",     order: 4,
    config: JSON.stringify({ bracketSize: 8, thirdPlace: true, bestOf: 3 }) },
  { name: "Cerdas Cermat",    category: "Akademik",    type: "TEAM",       format: "GROUP_STAGE", order: 5,
    config: JSON.stringify({ numGroups: 2, teamsPerGroup: 4, advanceCount: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 }) },
  { name: "Memasak",          category: "Kreativitas", type: "DUO",        format: "TIME_TRIAL",  order: 6,
    config: JSON.stringify({ scoreUnit: "nilai", sortOrder: "DESC", bestOf: 1 }) },
  { name: "Tari Kreasi",      category: "Seni",        type: "TEAM",       format: "TIME_TRIAL",  order: 7,
    config: JSON.stringify({ scoreUnit: "nilai", sortOrder: "DESC", bestOf: 1 }) },
  { name: "Lari 5K",          category: "Olahraga",    type: "INDIVIDUAL", format: "TIME_TRIAL",  order: 8,
    config: JSON.stringify({ scoreUnit: "detik", sortOrder: "ASC", bestOf: 1 }) },
];

const ptSystem = { first: 100, second: 70, third: 40 };

async function main() {
  console.log("🌱 Seeding BONDING EVENT 2026 Manufacturing v2...");

  // Clean
  await prisma.overallStanding.deleteMany();
  await prisma.champion.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.matchParticipant.deleteMany();
  await prisma.match.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.team.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.section.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.event.deleteMany();

  // Admin
  const hashedPw = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.create({ data: { name: "Super Admin", email: "admin@bonding.com", passwordHash: hashedPw, role: "SUPER_ADMIN" } });
  console.log("✅ Admin: admin@bonding.com / admin123");

  // Event
  const event = await prisma.event.create({
    data: {
      name: "BONDING EVENT 2026",
      slug: "bonding-event-2026",
      description: "Event olahraga dan kesenian tahunan antar seksi se-Manufacturing.",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-20"),
      location: "Area Manufacturing Plant, Jakarta",
      status: "UPCOMING",
      themeColor: "#0891B2",
      pointSystem: JSON.stringify(ptSystem),
    },
  });

  // Sections
  const sections = await Promise.all(
    SECTIONS.map(s => prisma.section.create({ data: { ...s, eventId: event.id } }))
  );
  console.log(`✅ ${sections.length} seksi dibuat`);

  // Participants (5 per seksi)
  const FIRST_NAMES = ["Ahmad", "Budi", "Citra", "Deni", "Eka", "Fajar", "Gita", "Hendra"];
  const LAST_NAMES  = ["Santoso", "Dewi", "Rahman", "Putri", "Fauzi", "Wijaya", "Kusuma", "Setiawan"];
  const participants = await Promise.all(
    sections.flatMap((sec, si) =>
      [0,1,2,3,4].map(pi =>
        prisma.participant.create({
          data: {
            eventId: event.id,
            name: `${FIRST_NAMES[(si*5+pi) % 8]} ${LAST_NAMES[(si+pi) % 8]}`,
            npk: `NPK${String(si+1).padStart(2,"0")}${String(pi+1).padStart(3,"0")}`,
            section: sec.name,
          },
        })
      )
    )
  );
  console.log(`✅ ${participants.length} peserta dibuat`);

  // Competitions
  const competitions = await Promise.all(
    COMPETITIONS.map(c => prisma.competition.create({
      data: {
        eventId: event.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        status: "UPCOMING",
        type: c.type,
        format: c.format,
        category: c.category,
        config: c.config,
        order: c.order,
        description: `Lomba ${c.name} antar seksi se-Manufacturing BONDING EVENT 2026`,
      },
    }))
  );
  console.log(`✅ ${competitions.length} lomba dibuat`);

  // Futsal teams (1 tim per seksi)
  const futsalComp = competitions.find(c => c.name === "Futsal Putra");
  if (!futsalComp) throw new Error("Futsal not found");

  const futsalTeams = await Promise.all(
    sections.map(async (sec, i) => {
      const team = await prisma.team.create({
        data: {
          competitionId: futsalComp.id,
          name: `Tim Futsal ${sec.name.replace("Seksi ", "")}`,
          section: sec.name,
          status: "ACTIVE",
          groupName: i < 4 ? "Grup A" : "Grup B",
        },
      });
      const secParts = participants.filter(p => p.section === sec.name).slice(0, 5);
      await Promise.all(secParts.map((p, idx) =>
        prisma.teamMember.create({ data: { teamId: team.id, participantId: p.id, role: idx === 0 ? "CAPTAIN" : "MEMBER" } })
      ));
      return team;
    })
  );
  console.log("✅ Tim Futsal + anggota dibuat");

  // Futsal matches (Grup A: 6 matches, Grup B: 6 matches)
  let matchOrder = 0;
  const groups = [
    { label: "Grup A", teams: futsalTeams.slice(0, 4) },
    { label: "Grup B", teams: futsalTeams.slice(4, 8) },
  ];
  for (const grp of groups) {
    for (let a = 0; a < grp.teams.length; a++) {
      for (let b = a + 1; b < grp.teams.length; b++) {
        const teamA = grp.teams[a];
        const teamB = grp.teams[b];
        const hourStr = String(8 + (matchOrder % 10)).padStart(2, "0");
        const isCompleted = matchOrder < 4;
        const match = await prisma.match.create({
          data: {
            competitionId: futsalComp.id,
            name: `${teamA.name} vs ${teamB.name}`,
            round: "Fase Grup",
            stage: "REGULAR",
            groupName: grp.label,
            scheduledAt: new Date(`2026-07-15T${hourStr}:00:00`),
            venue: "Lapangan Futsal Plant",
            status: isCompleted ? "COMPLETED" : "SCHEDULED",
            completedAt: isCompleted ? new Date() : null,
          },
        });
        if (isCompleted) {
          const sA = Math.floor(Math.random() * 5) + 1;
          const sB = Math.floor(Math.random() * 4);
          await prisma.matchParticipant.createMany({
            data: [
              { matchId: match.id, teamId: teamA.id, score: sA, result: sA > sB ? "WIN" : sA === sB ? "DRAW" : "LOSE" },
              { matchId: match.id, teamId: teamB.id, score: sB, result: sA > sB ? "LOSE" : sA === sB ? "DRAW" : "WIN" },
            ],
          });
        }
        matchOrder++;
      }
    }
  }
  console.log("✅ Jadwal Futsal dibuat");

  // Completed competitions with champions
  const champData = [
    { comp: "Tenis Meja",  winners: [
      { sec: "Seksi Produksi A", pos: 1 },
      { sec: "Seksi Quality Control", pos: 2 },
      { sec: "Seksi Engineering", pos: 3 },
    ]},
    { comp: "Memasak", winners: [
      { sec: "Seksi HR & GA", pos: 1 },
      { sec: "Seksi Produksi B", pos: 2 },
      { sec: "Seksi Logistics", pos: 3 },
    ]},
    { comp: "Tari Kreasi", winners: [
      { sec: "Seksi PPIC", pos: 1 },
      { sec: "Seksi Maintenance", pos: 2 },
      { sec: "Seksi Produksi A", pos: 3 },
    ]},
    { comp: "Lari 5K", winners: [
      { sec: "Seksi Engineering", pos: 1 },
      { sec: "Seksi Produksi B", pos: 2 },
      { sec: "Seksi Quality Control", pos: 3 },
    ]},
  ];

  for (const cd of champData) {
    const comp = competitions.find(c => c.name === cd.comp);
    if (!comp) continue;
    await prisma.competition.update({ where: { id: comp.id }, data: { status: "COMPLETED" } });
    for (const w of cd.winners) {
      const p = participants.find(p => p.section === w.sec);
      if (!p) continue;
      await prisma.champion.create({
        data: {
          competitionId: comp.id,
          participantId: p.id,
          position: w.pos,
          section: w.sec,
          awardPoints: w.pos === 1 ? ptSystem.first : w.pos === 2 ? ptSystem.second : ptSystem.third,
        },
      });
    }
  }
  console.log("✅ Juara per lomba dibuat");

  // Overall standings
  const allChamps = await prisma.champion.findMany({
    where: { competition: { eventId: event.id } },
    include: { team: true },
  });

  const standMap = new Map();
  const medalMap = new Map(); // {sec: {gold,silver,bronze}}

  for (const ch of allChamps) {
    let awardPts = ch.awardPoints;
    let sectionsToAward = [];

    if (ch.team && ch.team.isCollaboration && ch.team.sections) {
      const secs = JSON.parse(ch.team.sections);
      const weights = ch.team.sectionWeights ? JSON.parse(ch.team.sectionWeights) : null;
      for (const s of secs) {
        const w = weights ? (weights[s] || (100 / secs.length)) : (100 / secs.length);
        sectionsToAward.push({ sec: s, pts: awardPts * w / 100 });
      }
    } else {
      const sec = ch.section || (ch.team && ch.team.section) || "Lainnya";
      sectionsToAward.push({ sec, pts: awardPts });
    }

    for (const { sec, pts } of sectionsToAward) {
      standMap.set(sec, (standMap.get(sec) || 0) + pts);
      if (!medalMap.has(sec)) medalMap.set(sec, { gold: 0, silver: 0, bronze: 0 });
      const med = medalMap.get(sec);
      if (ch.position === 1) med.gold++;
      else if (ch.position === 2) med.silver++;
      else if (ch.position === 3) med.bronze++;
    }
  }

  const sorted = Array.from(standMap.entries()).sort(([,a],[,b]) => b - a);
  for (let r = 0; r < sorted.length; r++) {
    const [sec, pts] = sorted[r];
    const med = medalMap.get(sec) || { gold: 0, silver: 0, bronze: 0 };
    await prisma.overallStanding.create({
      data: {
        eventId: event.id,
        section: sec,
        totalPoints: Math.round(pts * 10) / 10,
        goldCount: med.gold,
        silverCount: med.silver,
        bronzeCount: med.bronze,
        rank: r + 1,
      },
    });
  }
  console.log("✅ Klasemen juara umum dihitung");

  // Announcements
  await prisma.announcement.createMany({
    data: [
      { eventId: event.id, title: "Pendaftaran Dibuka!", content: "Pendaftaran BONDING EVENT 2026 resmi dibuka. Batas pendaftaran 10 Juli 2026.", type: "SUCCESS", isPinned: true, isRunningText: true, priority: "HIGH" },
      { eventId: event.id, title: "Jadwal Technical Meeting", content: "Technical meeting Jumat 11 Juli 2026 pukul 15:00 di Aula Utama.", type: "INFO", isPinned: true, priority: "NORMAL" },
      { eventId: event.id, title: "🏆 Juara Lari 5K!", content: "Selamat Seksi Engineering juara Lari 5K!", type: "SUCCESS", priority: "HIGH" },
      { eventId: event.id, title: "Peraturan Futsal Update", content: "Setiap tim maks 7 pemain, semua dari seksi yang sama.", type: "WARNING", priority: "NORMAL" },
      { eventId: event.id, title: "Venue Memasak", content: "Lomba Memasak di Kantin Utama Lantai 1.", type: "INFO", priority: "NORMAL" },
    ],
  });

  await prisma.sponsor.createMany({
    data: [
      { eventId: event.id, name: "PT Manufacturing Utama", tier: "PLATINUM", order: 1 },
      { eventId: event.id, name: "Koperasi Karyawan",       tier: "GOLD",     order: 2 },
      { eventId: event.id, name: "HR & GA Department",      tier: "GOLD",     order: 3 },
    ],
  });

  console.log("\n🎉 Seeding selesai!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Admin : admin@bonding.com / admin123");
  console.log("🌐 URL   : http://localhost:3001");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
