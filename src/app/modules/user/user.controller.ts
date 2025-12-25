import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { userServices } from "./user.service";

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

export const userController = {
  userRegister,
};
