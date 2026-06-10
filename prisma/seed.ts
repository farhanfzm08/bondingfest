import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Admin
  const hashedPassword = await bcrypt.hash("ftm2026farhan", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "multimedia@ftm26" },
    update: {},
    create: { name: "Super Admin", email: "multimedia@ftm26", passwordHash: hashedPassword, role: "SUPER_ADMIN" },
  });
  console.log("✅ Admin:", admin.email);

  // 2. Event
  const event = await prisma.event.upsert({
    where: { slug: "bonding-event-2026" },
    update: {},
    create: {
      name: "BONDING FEST 2026",
      slug: "bonding-event-2026",
      description: "Event tahunan terbesar yang mempertemukan seluruh peserta dalam berbagai cabang perlombaan bergengsi.",
      startDate: new Date("2026-07-15T08:00:00Z"),
      endDate: new Date("2026-07-20T17:00:00Z"),
      location: "Gedung Serba Guna, Jakarta",
      status: "UPCOMING",
      themeColor: "#6366f1",
      pointSystem: JSON.stringify({ first: 100, second: 75, third: 50 }),
    },
  });
  console.log("✅ Event:", event.name);

  // 3. Competitions
  const competitionDefs = [
    { name: "Futsal", slug: "futsal", description: "Turnamen futsal beregu mempertemukan tim-tim terbaik.", status: "ONGOING", type: "TEAM", category: "Olahraga", venue: "Lapangan Futsal Indoor Lt.2", order: 1 },
    { name: "Badminton", slug: "badminton", description: "Kejuaraan bulu tangkis ganda campuran dan tunggal.", status: "UPCOMING", type: "INDIVIDUAL", category: "Olahraga", venue: "Gedung Badminton Utama", order: 2 },
    { name: "Mobile Legends", slug: "mobile-legends", description: "Turnamen esports Mobile Legends: Bang Bang 5v5.", status: "ONGOING", type: "TEAM", category: "Esports", venue: "Gaming Zone Hall A", order: 3 },
    { name: "Cerdas Cermat", slug: "cerdas-cermat", description: "Lomba adu pengetahuan umum, sains, dan teknologi.", status: "COMPLETED", type: "TEAM", category: "Akademik", venue: "Aula Utama Lt.1", order: 4 },
    { name: "Mewarnai", slug: "mewarnai", description: "Lomba mewarnai kreatif untuk menampilkan bakat seni.", status: "UPCOMING", type: "INDIVIDUAL", category: "Seni", venue: "Ruang Seni Kreatif", order: 5 },
    { name: "Memasak", slug: "memasak", description: "Kompetisi memasak menu khas nusantara.", status: "UPCOMING", type: "TEAM", category: "Kuliner", venue: "Dapur Kompetisi Lt.1", order: 6 },
    { name: "Tari Tradisional", slug: "tari-tradisional", description: "Pertunjukan tari tradisional nusantara.", status: "COMPLETED", type: "TEAM", category: "Seni Budaya", venue: "Panggung Utama Outdoor", order: 7 },
    { name: "Fotografi", slug: "fotografi", description: "Lomba fotografi bertema event.", status: "ONGOING", type: "INDIVIDUAL", category: "Kreatif", venue: "Seluruh Area Event", order: 8 },
  ];

  const competitions: { id: string; slug: string; name: string }[] = [];
  for (const comp of competitionDefs) {
    const c = await prisma.competition.upsert({
      where: { eventId_slug: { eventId: event.id, slug: comp.slug } },
      update: {},
      create: { ...comp, eventId: event.id },
    });
    competitions.push(c);
  }
  console.log(`✅ ${competitions.length} competitions`);

  // 4. Participants
  const sections = [
    "SMA Negeri 1 Jakarta", "SMA Negeri 2 Bandung", "SMK Teknologi Surabaya", "SMA Al-Azhar Jakarta",
    "SMA Negeri 3 Yogyakarta", "SMK Kesehatan Bali", "SMA Negeri 5 Medan", "SMA Islam Terpadu Bogor",
  ];
  const names = [
    "Ahmad Fauzi", "Budi Santoso", "Citra Dewi", "Dian Pratama", "Eko Saputra", "Fany Rahayu",
    "Gunawan Wibowo", "Hana Sari", "Indra Kusuma", "Joko Widodo", "Kartika Sari", "Lina Permata",
    "Muhamad Rizki", "Nadia Cahyani", "Okta Putra", "Putri Anggraeni", "Qodir Maulana", "Rina Wulandari",
    "Slamet Riyadi", "Tina Agustina", "Umar Faruk", "Vera Handayani", "Wahyu Setiawan", "Xenia Pratiwi",
    "Yusuf Ibrahim", "Zahra Nabila", "Agus Budiman", "Bella Sanjaya", "Candra Wijaya", "Dika Setiawan",
    "Ella Puspita", "Farhan Maulana",
  ];

  const participants: { id: string; name: string }[] = [];
  for (let i = 0; i < names.length; i++) {
    const p = await prisma.participant.create({
      data: {
        eventId: event.id, name: names[i],
        section: sections[i % sections.length],
      },
    });
    participants.push(p);
  }
  console.log(`✅ ${participants.length} participants`);

  // 5. Teams
  const futsalComp = competitions.find((c) => c.slug === "futsal")!;
  const ccComp = competitions.find((c) => c.slug === "cerdas-cermat")!;
  const tariComp = competitions.find((c) => c.slug === "tari-tradisional")!;

  const futsalTeams: { id: string; section: string }[] = [];
  for (let i = 0; i < sections.length; i++) {
    const t = await prisma.team.create({
      data: { competitionId: futsalComp.id, name: `Tim Futsal ${sections[i].split(" ").slice(-1)[0]}`, section: sections[i], seedNumber: i + 1, status: i < 4 ? "ACTIVE" : "ELIMINATED" },
    });
    futsalTeams.push({ id: t.id, section: sections[i] });
  }

  const ccTeams: { id: string; section: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const t = await prisma.team.create({ data: { competitionId: ccComp.id, name: `Tim CC ${sections[i].split(" ").slice(-1)[0]}`, section: sections[i], seedNumber: i + 1 } });
    ccTeams.push({ id: t.id, section: sections[i] });
  }

  const tariTeams: { id: string; section: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const t = await prisma.team.create({ data: { competitionId: tariComp.id, name: `Tim Tari ${sections[i].split(" ").slice(-1)[0]}`, section: sections[i], seedNumber: i + 1 } });
    tariTeams.push({ id: t.id, section: sections[i] });
  }
  console.log("✅ Teams created");

  // 6. Matches
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futsalMatchDefs = [
    { name: "Grup A - Match 1", round: "Babak Penyisihan", status: "COMPLETED", dO: -2, h: 8, t1: 0, t2: 1, s1: 3, s2: 1 },
    { name: "Grup A - Match 2", round: "Babak Penyisihan", status: "COMPLETED", dO: -2, h: 10, t1: 2, t2: 3, s1: 2, s2: 2 },
    { name: "Grup B - Match 1", round: "Babak Penyisihan", status: "COMPLETED", dO: -1, h: 8, t1: 4, t2: 5, s1: 1, s2: 3 },
    { name: "Grup B - Match 2", round: "Babak Penyisihan", status: "COMPLETED", dO: -1, h: 10, t1: 6, t2: 7, s1: 4, s2: 0 },
    { name: "Semifinal 1", round: "Semifinal", status: "ONGOING", dO: 0, h: 14, t1: 0, t2: 5, s1: 1, s2: 0 },
    { name: "Semifinal 2", round: "Semifinal", status: "SCHEDULED", dO: 0, h: 16, t1: 2, t2: 6, s1: 0, s2: 0 },
    { name: "Final", round: "Final", status: "SCHEDULED", dO: 2, h: 15, t1: 0, t2: 2, s1: 0, s2: 0 },
  ];

  for (const m of futsalMatchDefs) {
    const scheduledAt = new Date(today);
    scheduledAt.setDate(today.getDate() + m.dO);
    scheduledAt.setHours(m.h, 0, 0, 0);
    const match = await prisma.match.create({
      data: {
        competitionId: futsalComp.id, name: m.name, round: m.round,
        stage: m.round === "Final" ? "FINAL" : m.round === "Semifinal" ? "KNOCKOUT" : "REGULAR",
        scheduledAt, status: m.status, venue: "Lapangan Futsal Indoor Lt.2",
      },
    });
    if (futsalTeams[m.t1] && futsalTeams[m.t2]) {
      const isPlayed = ["COMPLETED", "ONGOING"].includes(m.status);
      await prisma.matchParticipant.createMany({
        data: [
          { matchId: match.id, teamId: futsalTeams[m.t1].id, score: m.s1, result: isPlayed ? (m.s1 > m.s2 ? "WIN" : m.s1 < m.s2 ? "LOSE" : "DRAW") : null },
          { matchId: match.id, teamId: futsalTeams[m.t2].id, score: m.s2, result: isPlayed ? (m.s2 > m.s1 ? "WIN" : m.s2 < m.s1 ? "LOSE" : "DRAW") : null },
        ],
      });
    }
  }
  console.log("✅ Matches created");

  // 7. Champions
  const pointSystem = { first: 100, second: 75, third: 50 };
  for (const [pos, idx, pts] of [[1, 0, pointSystem.first], [2, 1, pointSystem.second], [3, 2, pointSystem.third]]) {
    await prisma.champion.create({ data: { competitionId: ccComp.id, teamId: ccTeams[idx as number].id, position: pos as number, awardPoints: pts as number, section: ccTeams[idx as number].section } });
    await prisma.champion.create({ data: { competitionId: tariComp.id, teamId: tariTeams[idx as number].id, position: pos as number, awardPoints: pts as number, section: tariTeams[idx as number].section } });
  }
  console.log("✅ Champions created");

  // 8. Overall Standings
  const allChampions = await prisma.champion.findMany({ where: { competition: { eventId: event.id } } });
  const standingsMap = new Map<string, { totalPoints: number; goldCount: number; silverCount: number; bronzeCount: number }>();
  for (const champ of allChampions) {
    const inst = champ.section || "Unknown";
    const cur = standingsMap.get(inst) || { totalPoints: 0, goldCount: 0, silverCount: 0, bronzeCount: 0 };
    cur.totalPoints += champ.awardPoints;
    if (champ.position === 1) cur.goldCount++;
    else if (champ.position === 2) cur.silverCount++;
    else if (champ.position === 3) cur.bronzeCount++;
    standingsMap.set(inst, cur);
  }
  let rank = 1;
  for (const [section, data] of [...standingsMap.entries()].sort(([, a], [, b]) => b.totalPoints - a.totalPoints)) {
    await prisma.overallStanding.upsert({
      where: { eventId_section: { eventId: event.id, section } },
      update: { ...data, rank },
      create: { eventId: event.id, section, ...data, rank },
    });
    rank++;
  }
  console.log("✅ Standings calculated");

  // 9. Announcements
  const anns = [
    { title: "🎉 Selamat Datang di BONDING EVENT 2026!", content: "Kami dengan bangga membuka BONDING EVENT 2026, event tahunan terbesar yang mempertemukan seluruh peserta dalam berbagai cabang perlombaan bergengsi.", type: "SUCCESS", priority: "HIGH", isPinned: true, isRunningText: true },
    { title: "📋 Teknikal Meeting Futsal", content: "Teknikal meeting futsal dilaksanakan Senin, 13 Juli 2026 pukul 14.00 WIB di Ruang Meeting Lt.2. Semua kapten tim harap hadir.", type: "INFO", priority: "NORMAL", isPinned: false, isRunningText: false },
    { title: "⚡ Semifinal Futsal Hari Ini!", content: "Saksikan Semifinal Futsal hari ini pukul 14.00 dan 16.00 WIB di Lapangan Indoor Lt.2. Dukung tim favorit!", type: "WARNING", priority: "HIGH", isPinned: true, isRunningText: true },
    { title: "🏆 Juara Cerdas Cermat!", content: `Selamat kepada ${sections[0]} Juara 1, ${sections[1]} Juara 2, dan ${sections[2]} Juara 3 Cerdas Cermat!`, type: "SUCCESS", priority: "HIGH", isPinned: false, isRunningText: false },
    { title: "📷 Tema Lomba Fotografi", content: "Tema: 'Kebersamaan dalam Keberagaman'. Pengumpulan karya paling lambat 19 Juli 2026.", type: "INFO", priority: "NORMAL", isPinned: false, isRunningText: false },
  ];
  for (const ann of anns) {
    await prisma.announcement.create({ data: { ...ann, eventId: event.id, isPublished: true } });
  }
  console.log("✅ Announcements created");

  // 10. Sponsors
  for (const s of [
    { name: "TechCorp Indonesia", tier: "PLATINUM", order: 1 },
    { name: "Garuda Sports", tier: "GOLD", order: 2 },
    { name: "Bank Nusantara", tier: "GOLD", order: 3 },
    { name: "Indofood", tier: "SILVER", order: 4 },
    { name: "XL Axiata", tier: "SILVER", order: 5 },
    { name: "Tokopedia", tier: "REGULAR", order: 6 },
  ]) {
    await prisma.sponsor.create({ data: { ...s, eventId: event.id } });
  }
  console.log("✅ Sponsors created");

  console.log("\n🎉 Seeding selesai!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Admin ID    : multimedia@ftm26");
  console.log("🔒 Password    : ftm2026farhan");
  console.log("🌐 URL         : http://localhost:3000");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
