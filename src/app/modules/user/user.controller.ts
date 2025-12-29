import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { userServices } from "./user.service";
import { JwtPayload } from "jsonwebtoken";

// Controller to handle user registration
const userRegister = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;

    // Check if a profile image was uploaded
    let profileImage = null;
    if (req.file) {
      profileImage = req.file.path; // Cloudinary URL will be saved in 'path'
    }

    // Add the profileImage to the userData if available
    if (profileImage) {
      userData.profileImage = profileImage;
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

export const userController = {
  userRegister,
  getMe,
  getProfile,
  getAllUser,
  userUpdate,
  userDelete,
};
