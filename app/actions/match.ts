"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMatch(data: {
  competitionId: string;
  name: string;
  round: string;
  stage: string;
  bracketSlot: number;
  participants: { teamId: string | null; participantId: string | null }[];
}) {
  try {
    const match = await prisma.match.create({
      data: {
        competitionId: data.competitionId,
        name: data.name,
        round: data.round,
        stage: data.stage,
        bracketSlot: data.bracketSlot,
        participants: {
          create: data.participants,
        },
      },
    });
    revalidatePath(`/admin/lomba/${data.competitionId}`);
    revalidatePath(`/lomba`);
    return { success: true, match };
  } catch (error: any) {
    console.error("createMatch error:", error);
    return { success: false, error: error.message || "Failed to create match" };
  }
}

export async function updateMatchParticipants(matchId: string, participantsData: { id: string; teamId?: string | null; participantId?: string | null }[]) {
  try {
    for (const p of participantsData) {
      await prisma.matchParticipant.update({
        where: { id: p.id },
        data: {
          teamId: p.teamId !== undefined ? p.teamId : undefined,
          participantId: p.participantId !== undefined ? p.participantId : undefined,
        },
      });
    }
    
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { competitionId: true }
    });
    
    if (match) {
      revalidatePath(`/admin/lomba/${match.competitionId}`);
      revalidatePath(`/lomba`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("updateMatchParticipants error:", error);
    return { success: false, error: error.message || "Failed to update match participants" };
  }
}

export async function deleteMatch(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { competitionId: true }
    });
    
    await prisma.match.delete({ where: { id: matchId } });
    
    if (match) {
      revalidatePath(`/admin/lomba/${match.competitionId}`);
      revalidatePath(`/lomba`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("deleteMatch error:", error);
    return { success: false, error: error.message || "Failed to delete match" };
  }
}

export async function validateWinners(competitionId: string) {
  try {
    // Calling the API route internally, or rewriting the logic here.
    // For now, we will simply do a fetch to the local API endpoint or rewrite it.
    // Rewriting it is safer for server actions.
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/competitions/${competitionId}/validate-winners`, {
      method: "POST"
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to validate winners");
    }
    
    revalidatePath(`/admin/lomba/${competitionId}`);
    revalidatePath(`/lomba`);
    return await res.json();
  } catch (error: any) {
    console.error("validateWinners error:", error);
    return { error: error.message || "Failed to validate winners" };
  }
}
