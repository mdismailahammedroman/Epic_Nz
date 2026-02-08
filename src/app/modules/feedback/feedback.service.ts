import { QueryBuilder } from "../../utils/QueryBuilder";
import { Feedback } from "./feedback.model";
import { IFeedback } from "./feedback.interface";
import User from "../user/user.model";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import { NotificationService } from "../notification/notification.service";

const createFeedback = async (userId: string, payload: Partial<IFeedback>) => {
  // 1. Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Create feedback with the user ID
  const doc = await Feedback.create({
    user: userId, // Must include this so the schema 'required' constraint is met
    title: payload.title,
    message: payload.message,
  });
  await NotificationService.notifyAdminsFeedbackSubmitted(doc);
  return doc;
};

const getAllFeedbacks = async (query: Record<string, string>) => {
  const qb = new QueryBuilder(
    Feedback.find().populate("user", "full_name email profile_picture"),
    query, // Now the types match
  )
    .filter()
    .sort()
    .paginate();

  const data = await qb.build();
  const meta = await qb.getMeta();

  return { data, meta };
};

const getMyFeedbacks = async (
  userId: string,
  query: Record<string, string>, // Change this as well
) => {
  const qb = new QueryBuilder(Feedback.find({ user: userId }), query)
    .filter()
    .sort()
    .paginate();

  const data = await qb.build();
  const meta = await qb.getMeta();

  return { data, meta };
};
export const feedbackService = {
  createFeedback,
  getAllFeedbacks,
  getMyFeedbacks,
};
