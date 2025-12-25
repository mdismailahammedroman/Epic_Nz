import AppError from "../../errorHelper/AppError";
import { AuthProviderType, IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";

// Creating a user service function
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, profileImage, ...rest } = payload;

  // Check if the user already exists
  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  // Create user authentication details
  const authUser: IAuthProvider = {
    provider: AuthProviderType.CREDENTIAL,
    providerID: AuthProviderType.GOOGLE, // This could be dynamic depending on the auth provider
  };

  // Create new user instance
  const newUser = new User({
    email,
    password,
    profileImage, // Save the uploaded image URL here
    auths: [authUser],
    ...rest,
  });

  // Save the user to the database
  await newUser.save();

  return newUser;
};

export const userServices = { createUser };
