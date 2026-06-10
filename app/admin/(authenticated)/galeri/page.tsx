import { prisma } from "@/lib/prisma";
import GaleriAdminClient from "./galeri-admin-client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminGaleriPage() {
  const event = await prisma.event.findFirst();
  if (!event) return <div>Event belum diatur</div>;

  const media = await prisma.media.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    include: { competition: { select: { name: true } } }
  });

  const competitions = await prisma.competition.findMany({
    where: { eventId: event.id },
    select: { id: true, name: true }
  });

  async function addMedia(data: FormData) {
    "use server";
    const title = data.get("title") as string;
    const url = data.get("url") as string;
    const thumbnailUrl = data.get("thumbnailUrl") as string;
    const type = data.get("type") as string;
    const compId = data.get("competitionId") as string;

    const event = await prisma.event.findFirst();
    if (!event) return;

    await prisma.media.create({
      data: {
        eventId: event.id,
        title: title || null,
        url,
        thumbnailUrl: thumbnailUrl || null,
        type: type || "IMAGE",
        competitionId: compId || null,
      }
    });

    revalidatePath("/admin/galeri");
    revalidatePath("/galeri");
  }

  async function deleteMedia(id: string) {
    "use server";
    await prisma.media.delete({ where: { id } });
    revalidatePath("/admin/galeri");
    revalidatePath("/galeri");
  }

  return (
    <GaleriAdminClient 
      media={media} 
      competitions={competitions} 
      addMedia={addMedia}
      deleteMedia={deleteMedia}
    />
  );
}
