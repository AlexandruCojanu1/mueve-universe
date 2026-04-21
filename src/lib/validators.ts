import { z } from "zod";

export const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL invalid (trebuie http(s))" },
  );

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().trim().toLowerCase().email().max(200);

export const partnerCreateSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(120).optional(),
  companyName: z.string().trim().min(1).max(120),
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountDescription: z.string().trim().max(200).optional(),
  logoUrl: safeUrl.optional(),
});

export const partnerPatchSchema = z.object({
  id: uuidSchema,
  companyName: z.string().trim().min(1).max(120).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountDescription: z.string().trim().max(200).optional(),
  logoUrl: safeUrl.nullable().optional(),
  active: z.boolean().optional(),
});

export const partnerProfileSchema = z.object({
  companyName: z.string().trim().min(1).max(120).optional(),
  discountDescription: z.string().trim().max(200).optional(),
  logoUrl: safeUrl.nullable().optional(),
});

export const slotCreateSchema = z.object({
  coachId: uuidSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "HH:MM"),
  durationMin: z.number().int().min(15).max(600).optional(),
  classType: z.string().trim().max(80).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
});

export const slotPatchSchema = z.object({
  id: uuidSchema,
  coachId: uuidSchema.optional(),
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  durationMin: z.number().int().min(15).max(600).optional(),
  classType: z.string().trim().max(80).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  active: z.boolean().optional(),
});

export const userPatchSchema = z.object({
  id: uuidSchema,
  role: z.enum(["user", "coach", "admin", "partner"]),
});

export const reservationCreateSchema = z.object({
  slotId: uuidSchema,
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
});

export const verifyTokenSchema = z.object({
  token: z.string().trim().min(1).max(500),
});

export type PartnerCreateInput = z.infer<typeof partnerCreateSchema>;
export type PartnerPatchInput = z.infer<typeof partnerPatchSchema>;
export type SlotCreateInput = z.infer<typeof slotCreateSchema>;
export type SlotPatchInput = z.infer<typeof slotPatchSchema>;
