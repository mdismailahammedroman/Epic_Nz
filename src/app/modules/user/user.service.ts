import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import AppError from "../../errorHelper/AppError";
import { AuthProviderType, IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import { QueryBuilder } from "../../utils/QueryBuilder";

// Creating a user service function
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, profileImage, ...rest } = payload;

  // Check if the user already exists
  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }
  const hashedPassword = password
    ? await bcrypt.hash(password, 10) // 10 salt rounds
    : undefined;
  // Create user authentication details
  const authUser: IAuthProvider = {
    provider: AuthProviderType.CREDENTIAL,
    providerID: AuthProviderType.GOOGLE,
  };

  // Create new user instance
  const newUser = new User({
    email,
    password: hashedPassword,
    profileImage,
    auths: [authUser],
    ...rest,
  });

  // Save the user to the database
  await newUser.save();

  return newUser;
};

// GET ALL USERS
const getMeService = async (userId: string) => {
  const user = await User.aggregate([
    // Stage 1: Matching
    { $match: { _id: new Types.ObjectId(userId) } },

    // Stage 2: Join with interests
    {
      $lookup: {
        from: "categories",
        localField: "interests",
        foreignField: "_id",
        as: "interest",
      },
    },

    // Projection
    {
      $project: {
        password: 0,
        interests: 0,
      },
    },
  ]);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const getProfileService = async (userId: string) => {
  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  const user = await User.findById(userId).select("-password -auths");

  if (!user) {
    throw new AppError(404, "User not found");
  }
  return {};
};

const getAllUserService = async (query: Record<string, string>) => {
  console.log("Incoming Query:", query);

  const queryBuilder = new QueryBuilder(User.find(), query);

  // Build the query dynamically based on query parameters
  console.log("Built Query:", queryBuilder.queryModel.getQuery());

  const users = await queryBuilder
    .filter()
    .textSearch()
    .select()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();

  return {
    meta,
    users,
  };
};

export const userServices = {
  createUser,
  getMeService,
  getProfileService,
  getAllUserService,
};
