import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        type: z.enum([
          "problem_answer",
          "answer_mention",
          "solution_selected",
          "circle_join_accepted",
          "circle_invite",
          "circle_meeting",
          "cooperation_offer",
          "cooperation_message",
          "cooperation_complete",
          "appeal_decision",
        ]),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(50),
});