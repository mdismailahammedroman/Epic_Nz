import AppError from "../../errorHelper/AppError";
import { AuthProviderType, IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";

// Creating a user service function
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  //  if the user already exists
  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, "User already exists. Please login!");
  }

  // Create user is using email/password)
  const authUser: IAuthProvider = {
    provider: AuthProviderType.CREDENTIAL,
    providerID: AuthProviderType.GOOGLE,
  };

  const newUser = new User({
    email,
    password,
    auths: [authUser],
    ...rest,
  });

  await newUser.save();

  return newUser;
};

export const userServices = { createUser };
