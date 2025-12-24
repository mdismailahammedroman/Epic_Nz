import mongoose, { Schema } from "mongoose";
import { IUser, Role, IsActive } from "./user.interface";

// Create the User Schema
const userSchema: Schema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    default: Role.USER,
  },
  isActive: {
    type: String,
    enum: [IsActive.ACTIVE, IsActive.BLOCKED, IsActive.INACTIVE],
    default: IsActive.ACTIVE,
  },
  isDeleted: { type: Boolean, default: false },
});

// Create the User Model
const User = mongoose.model<IUser>("User", userSchema);

export default User;
