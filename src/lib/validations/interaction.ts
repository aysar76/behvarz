import { z } from "zod";

const idSchema = z.string().trim().min(1).max(64);

export const followSchema = z.object({
  targetType: z.enum(["tag", "problem", "experience", "user"]),
  targetId: idSchema,
});

export const saveSchema = z.object({
  targetType: z.enum(["problem", "experience"]),
  targetId: idSchema,
});

export const thanksSchema = z.object({
  targetType: z.enum(["answer", "experience"]),
  targetId: idSchema,
});
