/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { userServices } from "./user.service";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelper/AppError";
import { StatusCodes } from "http-status-codes";

// Controller to handle user registration
const userRegister = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;

    // Check if a profile image was uploaded
    let profileImageUrl = null;
    if (req.file) {
      // If file is uploaded, get the file path
      profileImageUrl = req.file.path; // Cloudinary URL will be here
    }

    // Add the profile image URL to the user data if available
    if (profileImageUrl) {
      userData.profile_picture = profileImageUrl; // Pass the Cloudinary URL to user data
    }

    // Call the service to create the user
    const createUser = await userServices.createUser(userData);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User created successfully!",
      data: createUser,
    });
  }
);

// get  user
const getMe = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const result = await userServices.getMeService(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User fetched successful!",
    data: result,
  });
});

const getProfile = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload; // Extract userId from the JWT payload

  // Get the profile and location data from the service
  const result = await userServices.getProfileService(userId);

  // Send the response with user data and location (including placeName)
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User profile fetched successfully!",
    data: result, // This will include email, full name, and location with placeName
  });
});

const getAllUser = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  // Assuming userId is being used for access control; otherwise, remove it.
  const result = await userServices.getAllUserService(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User profiles fetched successfully!",
    data: result,
  });
});
const userUpdate = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const result = await userServices.userUpdateService(
      userId,
      req.body,
      req.user as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User updated successfully!",
      data: result,
    });
  }
);

// USER UPDATE
const userDelete = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const decodedToken = req.user as JwtPayload;

  const result = await userServices.userDeleteService(userId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successful!",
    data: result,
  });
});

const getUserPreferences = CatchAsync(async (req: Request, res: Response) => {
  // Ensure the userId is correctly extracted from JWT
  const { userId } = req.user as JwtPayload;
  if (!userId) {
    throw new AppError(400, "User ID not found in the request.");
  }

  // Call service to get user preferences
  const preferences = await userServices.getUserPreferencesService(userId);

  if (!preferences) {
    throw new AppError(404, "User preferences not found.");
  }

  res.status(200).json({
    success: true,
    message: "User preferences fetched successfully",
    StatusCodes: StatusCodes.OK,
    data: preferences,
  });
});

const updateUserPreferences = CatchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload; // Extract user ID from the JWT token.
    const decodedToken = req.user as JwtPayload; // This is typically the decoded JWT token

    // Get new preferences from the request body
    const {
      language,
      theme,
      app_notifications,
      email_notifications,
      notifications_enabled,
      location_access,
    } = req.body;

    // Prepare the preferences object
    const preferences = {
      language,
      theme,
      app_notifications,
      email_notifications,
      notifications_enabled,
      location_access,
    };

    // Pass the decodedToken along with userId and preferences to the service
    const updatedPreferences = await userServices.updateUserPreferences(
      userId,
      preferences
    );

    // Send the updated preferences in the response
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User preferences updated successfully!",
      data: updatedPreferences,
    });
  }
);

export const userController = {
  userRegister,
  getMe,
  getProfile,
  getAllUser,
  userUpdate,
  userDelete,
  getUserPreferences,
  updateUserPreferences,
};
