import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import AppError from "../../errorHelper/AppError";
import { IUser, IUserPreferences, Role } from "./user.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import { getPlaceName } from "../../utils/getLocation";
import { OTPService } from "../otp/otp.service";
import { CategoryEnum } from "../location/location.interface";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, profile_picture, preferences, fcmTokens, ...rest } =
    payload;

  if (!email) throw new AppError(400, "Email is required");
  if (!rest.full_name) throw new AppError(400, "Full name is required");

  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  const newUser = new User({
    email,
    password: password ? await bcrypt.hash(password, 10) : undefined,
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

  await OTPService.sendOTP(email);

  return newUser;
};

const getMeService = async (userId: string) => {
  const user = await User.aggregate([
    { $match: { _id: new Types.ObjectId(userId) } },

    // Lookup for interests (categories)
    {
      $lookup: {
        from: "categories",
        localField: "interests",
        foreignField: "_id",
        as: "interest",
      },
    },

    // Lookup for saved locations
    {
      $lookup: {
        from: "locations",
        localField: "savedLocations",
        foreignField: "_id",
        as: "savedLocationDetails",
      },
    },

    // Lookup to calculate average ratings from saved locations
    {
      $addFields: {
        avgRating: {
          $avg: {
            $map: {
              input: "$savedLocationDetails.ratings", // The ratings array in each saved location
              as: "rating",
              in: "$$rating.rating", // Get the rating value
            },
          },
        },
      },
    },

    // Lookup for notification preferences (ensure this collection exists)
    {
      $lookup: {
        from: "notificationpreferences", // Correct this if the collection name is different
        localField: "_id",
        foreignField: "user",
        as: "notificationPreferences",
      },
    },

    // Project required fields, including helpl_support, offline_maps, and notification preferences
    {
      $project: {
        email: 1,
        full_name: 1,
        profile_picture: 1,
        location: 1,
        preferences: 1,
        help_support: 1, // Include helpl_support
        offline_maps: 1, // Include offline_maps
        interest: 1,
        role: 1,
        savedLocationDetails: {
          placeName: 1,
          coordinates: 1,
          description: 1,
          imageUrl: 1,
        },
        avgRating: 1,
        notificationPreferences: {
          // Include notification preferences
          channel: 1,
          direct_sms: 1,
          app: 1,
        },
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new AppError(404, "User not found");
  }

  const userData = user[0];

  // Fetch the place name for location using lat/long
  if (
    userData.location &&
    userData.location.coordinates &&
    userData.location.coordinates.length === 2 &&
    (userData.location.coordinates[0] !== 0 ||
      userData.location.coordinates[1] !== 0)
  ) {
    const placeName = await getPlaceName(
      userData.location.coordinates[1],
      userData.location.coordinates[0]
    );
    userData.location.placeName = placeName;
  } else {
    userData.location.placeName = "No valid location data";
  }

  return userData;
};

const getProfileService = async (userId: string) => {
  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  const user = await User.findById(userId).select("-password -auths");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return {
    email: user.email,
    full_name: user.full_name,
    profile_picture: user.profile_picture,
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
    "preferences",
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
        app_notifications: true,
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

const getUserPreferencesService = async (userId: string) => {
  const user = await User.findById(userId).select("preferences");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return {
    preferences: user.preferences,
    availableCategories: Object.values(CategoryEnum),
  };
};

const updateUserPreferences = async (
  userId: string,
  payload: Partial<IUserPreferences>
) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true }
  ).select("preferences");

  if (!updatedUser) {
    throw new AppError(404, "User not found");
  }

  return updatedUser.preferences;
};

export const userServices = {
  createUser,
  getMeService,
  getProfileService,
  getAllUserService,
  userUpdateService,
  userDeleteService,
  getUserPreferencesService,
  updateUserPreferences,
};
