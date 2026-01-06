import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import AppError from "../../errorHelper/AppError";
import { IUser, Role } from "./user.interface";

import { QueryBuilder } from "../../utils/QueryBuilder";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import { getPlaceName } from "../../utils/getLocation";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, profile_picture, preferences, fcmTokens, ...rest } =
    payload;

  if (!email) throw new AppError(400, "Email is required");
  if (!password) throw new AppError(400, "Password is required");
  if (!rest.full_name) throw new AppError(400, "Full name is required");

  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    password: hashedPassword,
    profile_picture,
    preferences: preferences ?? {
      language: "en",
      theme: "light",
      app_notifications: true,
      email_notifications: true,
      notifications_enabled: true,
      location_access: false,
    },
    fcmTokens: fcmTokens ?? [],
    ...rest,
  });

  await newUser.save();
  return newUser;
};

const getMeService = async (userId: string) => {
  const user = await User.aggregate([
    { $match: { _id: new Types.ObjectId(userId) } },

    {
      $lookup: {
        from: "categories",
        localField: "interests",
        foreignField: "_id",
        as: "interest",
      },
    },

    {
      $lookup: {
        from: "locations", // Assuming 'locations' is the collection name for your locations
        localField: "savedLocations",
        foreignField: "_id",
        as: "savedLocationDetails",
      },
    },

    {
      $project: {
        email: 1,
        full_name: 1,
        location: 1,
        profile_picture: 1, // Include profile picture
        interest: 1,
        role: 1,
        savedLocationDetails: {
          placeName: 1,
          coordinates: 1,
          description: 1,
          imageUrl: 1,
        },
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new AppError(404, "User not found");
  }

  const userData = user[0]; // Extract the first user (since it's an array)

  // If the user has a location, fetch the place name
  if (userData.location && userData.location.lat && userData.location.long) {
    const placeName = await getPlaceName(
      userData.location.lat,
      userData.location.long
    );
    userData.location.placeName = placeName;
  }

  return userData;
};

const getProfileService = async (userId: string) => {
  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  // Fetch user from the database, excluding password and auths for security
  const user = await User.findById(userId).select("-password -auths");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return {
    email: user.email,
    full_name: user.full_name,
    location: user.location?.placeName || "No place name available",
  };
};

const getAllUserService = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);

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

const userUpdateService = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (!decodedToken || !decodedToken.role) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Invalid or missing role in token"
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }

  if (decodedToken.role === Role.USER && decodedToken.userId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only update your own profile"
    );
  }

  if (payload.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't update your password from this route!"
    );
  }

  if (payload.role && decodedToken.role === Role.USER) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to update roles!"
    );
  }

  /** =======================
   *  FIELD WHITELIST
   * ======================= */
  const allowedTopLevel = [
    "name",
    "phone",
    "picture",
    "address",
    "profileImage",
    "isVerified",
    "userStatus",
    "approved",
    "commissionRate",
    "preferences", // ✅ allow preferences object
  ];

  Object.keys(payload).forEach((key) => {
    if (!allowedTopLevel.includes(key)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        `You are not allowed to update: ${key}`
      );
    }
  });

  /** =======================
   *  PREFERENCES MERGE
   * ======================= */
  if (payload.preferences) {
    if (!user.preferences) {
      user.preferences = {
        language: "en",
        theme: "light",
        app_notifications: true,
        email_notifications: true,
        notifications_enabled: true,
        location_access: false,
      };
    }

    user.preferences = {
      ...user.preferences,
      ...payload.preferences,
    };
  }

  /** =======================
   *  TOP-LEVEL UPDATE
   * ======================= */
  Object.assign(user, payload);
  await user.save();

  return user;
};

const userDeleteService = async (userId: string, decodedToken: JwtPayload) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }

  if (user.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already deleted!");
  }

  const allowedRoles = [Role.ADMIN];

  if (!allowedRoles.includes(decodedToken.role)) {
    if (decodedToken.userId !== userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "You can't delete others!");
    }
  }

  user.isDeleted = true;
  await user.save();

  return null;
};

// Service to fetch user preferences
const getUserPreferencesService = async (userId: string) => {
  // Ensure the userId is passed as a valid ObjectId
  console.log(await User.findById(userId));
  const user = await User.findById(userId).select("preferences");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user.preferences;
};

export const userServices = {
  createUser,
  getMeService,
  getProfileService,
  getAllUserService,
  userUpdateService,
  userDeleteService,
  getUserPreferencesService,
};
