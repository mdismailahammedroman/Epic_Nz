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
  const { userId } = req.user as JwtPayload;
  const result = await userServices.getProfileService(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User profile fetched successful!",
    data: result,
  });
});

const getAllUser = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const query = req.query as Record<string, string>;

  query.userId = userId;

  const result = await userServices.getAllUserService(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users fetched successfully!",
    data: result,
  });
});

export const userController = {
  userRegister,
  getMe,
  getProfile,
  getAllUser,
};
