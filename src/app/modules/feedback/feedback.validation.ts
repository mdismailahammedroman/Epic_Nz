import { z } from "zod";

const createFeedbackValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    message: z.string().min(5).max(2000),
  }),
});

const updateStatusValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    message: z.string().min(5).max(2000),
  }),
});

export const FeedbackValidation = {
  createFeedbackValidationSchema,
  updateStatusValidationSchema,
};
