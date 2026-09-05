import type { ZodType } from "zod";

export function validateInput<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export function safeValidate<T>(
  schema: ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_root";
    (errors[key] ??= []).push(issue.message);
  }

  return { success: false, errors };
}
