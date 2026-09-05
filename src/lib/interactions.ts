import { prisma } from "@/lib/db";

export interface InteractionState {
  savedSet: Set<string>;
  followedTags: Set<string>;
  followedProblems: Set<string>;
  followedExperiences: Set<string>;
  followedUsers: Set<string>;
}

export async function getInteractionState(
  userId: string,
): Promise<InteractionState> {
  const [saved, follows] = await Promise.all([
    prisma.savedItem.findMany({
      where: { userId },
      select: { targetType: true, targetId: true },
    }),
    prisma.follow.findMany({
      where: { userId },
      select: { targetType: true, targetId: true },
    }),
  ]);

  const state: InteractionState = {
    savedSet: new Set(),
    followedTags: new Set(),
    followedProblems: new Set(),
    followedExperiences: new Set(),
    followedUsers: new Set(),
  };

  for (const item of saved) {
    state.savedSet.add(item.targetId);
  }
  for (const item of follows) {
    if (item.targetType === "tag") state.followedTags.add(item.targetId);
    else if (item.targetType === "problem")
      state.followedProblems.add(item.targetId);
    else if (item.targetType === "experience")
      state.followedExperiences.add(item.targetId);
    else if (item.targetType === "user")
      state.followedUsers.add(item.targetId);
  }

  return state;
}