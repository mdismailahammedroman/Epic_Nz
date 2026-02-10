/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import AppError from "../../errorHelper/AppError";
import {
  AuthProviderType,
  IAuthProvider,
  IUser,
  IUserPreferences,
  Role,
} from "./user.interface";
import Subscription from "../../modules/subscription/Subscription.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import { getPlaceName } from "../../utils/getLocation";
import { OTPService } from "../otp/otp.service";
import { CategoryEnum } from "../location/location.interface";
import { normalizeTokens } from "../../utils/normalizeTokens";
import {
  Plan,
  SubscriptionStatus,
} from "../subscription/subscription.interface";

const createUser = async (payload: Partial<IUser>) => {
  const {
    email,
    password,
    profile_picture,
    preferences,
    fcmToken,
    fcmTokens,
    ...rest
  } = payload;

  if (!email) throw new AppError(400, "Email is required");
  if (!rest.full_name) throw new AppError(400, "Full name is required");

  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  const authProvider: IAuthProvider = {
    provider: AuthProviderType.CREDENTIAL,
    providerID: email,
  };

  const normalizedFcmTokens = normalizeTokens(fcmTokens ?? fcmToken);

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
    auth_providers: [authProvider],
    fcmTokens: normalizedFcmTokens,
    ...rest,
  });

  // ✅ Save user first
  await newUser.save();

  // ✅ AUTO-CREATE 30-DAY TRIAL
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Subscription.create({
    userId: newUser._id,
    plan_type: Plan.TRIAL,
    stripeSubscriptionId: "TRIAL",
    stripeCustomerId: "TRIAL",
    start_date: startDate,
    end_date: endDate,
    status: SubscriptionStatus.ACTIVE,
    ai_features_access: true,
    ads_free: false,
    auto_renew: false,
    total_spent: 0,
  });

  // OTP stays the same
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

    // Lookup for notification preferences
    {
      $lookup: {
        from: "notificationpreferences", // Ensure this collection name is correct
        localField: "_id",
        foreignField: "user",
        as: "notificationPreferences",
      },
    },

    // Project required fields, including help_support, offline_maps, and notification preferences
    {
      $project: {
        email: 1,
        full_name: 1,
        profile_picture: 1,
        coverPicture: 1,
        location: 1, // Ensure location is included here
        preferences: 1,
        help_support: 1, // Include helpl_support
        offline_maps: 1, // Include offline_maps
        interest: 1,
        role: 1,
        fcmTokens: 1,
        savedLocationDetails: {
          _id: 1,
          name: 1,
          description: 1,
          address: 1,
          coordinates: 1,
          imageUrl: 1,
        },
        avgRating: 1,
        notificationPreferences: {
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
      userData.location.coordinates[0],
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
  userId: JwtPayload,
  payload: Partial<IUser>,
) => {
  const { profile_picture, coverPicture } = payload;

  // Handle update of the profile picture separately from cover picture
  if (profile_picture) {
    payload.profile_picture = profile_picture; // You may save the image URL or path here
  }

  if (coverPicture) {
    payload.coverPicture = coverPicture; // Similarly, save the cover picture URL/path here
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
  }).populate("savedLocations");
  return updatedUser;
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
  prefs: Partial<IUserPreferences>,
  fcmTokens?: string[],
) => {
  const updates: any = {};
  const setOps: any = {};

  // ===============================
  // Preferences update
  // ===============================
  if (prefs.language !== undefined)
    setOps["preferences.language"] = prefs.language;

  if (prefs.app_notifications !== undefined)
    setOps["preferences.app_notifications"] = prefs.app_notifications;

  if (prefs.notifications_enabled !== undefined)
    setOps["preferences.notifications_enabled"] = prefs.notifications_enabled;

  if (prefs.location_access !== undefined)
    setOps["preferences.location_access"] = prefs.location_access;

  if (Object.keys(setOps).length) {
    updates.$set = setOps;
  }

  // ===============================
  // FCM token logic (SAFE)
  // ===============================

  // ✅ Add tokens if provided
  if (fcmTokens && fcmTokens.length > 0) {
    updates.$addToSet = {
      fcmTokens: { $each: fcmTokens }, // no duplicates
    };
  }

  // ✅ Clear tokens only if notifications turned OFF
  if (prefs.notifications_enabled === false) {
    updates.$set = {
      ...(updates.$set ?? {}),
      fcmTokens: [],
    };
  }

  // ===============================
  // DB update
  // ===============================
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("preferences fcmTokens");

  if (!updatedUser) {
    throw new AppError(404, "User not found");
  }

  return {
    preferences: updatedUser.preferences,
    fcmTokens: updatedUser.fcmTokens,
  };
};

const getMyFcmTokens = async (userId: string) => {
  const user = await User.findById(userId).select("fcmTokens");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return {
    fcmTokens: user.fcmTokens || [],
    latestFcmToken:
      user.fcmTokens && user.fcmTokens.length > 0
        ? user.fcmTokens[user.fcmTokens.length - 1]
        : null,
  };
};

const fcmTokenUpdate = async (
  userId: string,
  fcmToken?: string,
  fcmTokens?: string[],
) => {
  const tokens: string[] = [];

  if (fcmToken) tokens.push(fcmToken);
  if (Array.isArray(fcmTokens)) tokens.push(...fcmTokens);

  if (tokens.length === 0) {
    return null;
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        fcmTokens: { $each: tokens }, // ✅ no duplicates
      },
    },
    { new: false },
  );

  return { fcmTokens: tokens };
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
  getMyFcmTokens,
  fcmTokenUpdate,
};
