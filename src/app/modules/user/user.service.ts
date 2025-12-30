import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import AppError from "../../errorHelper/AppError";
import { AuthProviderType, IAuthProvider, IUser, Role } from "./user.interface";

import { QueryBuilder } from "../../utils/QueryBuilder";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import { getPlaceName } from "../../utils/getLocation";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, profile_picture, ...rest } = payload;

  // Check if the user already exists
  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  // Hash the password if provided
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  // If a profile picture is uploaded, handle the file upload to Cloudinary
  let profilePictureUrl = undefined;
  if (profile_picture) {
    try {
      // Assuming the profile_picture passed is the Cloudinary URL (req.file.path)
      profilePictureUrl = profile_picture; // Cloudinary URL will be saved here
    } catch (error) {
      throw new AppError(500, "Error saving profile picture");
    }
  }

  // Define the auth provider
  const authUser: IAuthProvider = {
    provider: AuthProviderType.CREDENTIAL,
    providerID: AuthProviderType.GOOGLE,
  };

  // Create the new user with profile picture URL
  const newUser = new User({
    email,
    password: hashedPassword,
    profile_picture: profilePictureUrl, // Store the Cloudinary URL here
    auth_providers: [authUser],
    ...rest,
  });

  // Save the new user
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
  // Check if decodedToken and role exist
  if (!decodedToken || !decodedToken.role) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Invalid or missing role in token"
    );
  }

  // Find the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
  }

  // Ensure user can only update their own profile (if role is USER)
  if (decodedToken.role === Role.USER && decodedToken.userId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only update your own profile"
    );
  }

  // Prevent password update from this route
  if (payload.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't update your password from this route!"
    );
  }

  // Prevent role update (only Admins can update roles)
  if (payload.role) {
    if (decodedToken.role === Role.USER) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not allowed to update roles!"
      );
    }
  }

  // Prevent certain fields update by non-Admin users
  // if (
  //   payload?.UserStatus !== undefined ||
  //   payload?.isDeleted !== undefined ||
  //   payload?.isVerified !== undefined
  // ) {
  //   if (decodedToken.role !== Role.ADMIN) {
  //     // Only allow ADMIN to update these fields
  //     throw new AppError(
  //       StatusCodes.FORBIDDEN,
  //       "You are not allowed to update account status fields (isActive, isDeleted, isVerified)!"
  //     );
  //   }
  // }

  // Allowed updates based on user role
  if (decodedToken.role === Role.USER || decodedToken.role === Role.ADMIN) {
    const allowedUpdates = [
      "name",
      "phone",
      "picture",
      "address",
      "profileImage",
      "isVerified",
      "userStatus",
      "approved",
      "commissionRate",
    ];

    // Check for invalid keys in the payload
    Object.keys(payload).forEach((key) => {
      if (!allowedUpdates.includes(key)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          `You are not allowed to update: ${key}`
        );
      }
    });
  }

  // Update the user data
  const updatedUser = await User.findByIdAndUpdate(
    new Types.ObjectId(userId),
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedUser) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update user"
    );
  }

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

export const userServices = {
  createUser,
  getMeService,
  getProfileService,
  getAllUserService,
  userUpdateService,
  userDeleteService,
};
