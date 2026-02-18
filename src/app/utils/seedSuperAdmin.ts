import bcrypt from "bcryptjs";
import User from "../modules/user/user.model";
import {
  AuthProviderType,
  Role,
  UserStatus,
} from "../modules/user/user.interface";
import { envVar } from "../config/envVar";

export const seedSuperAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      email: "dev.epic.nz@gmail.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists, skipping seeding.");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      envVar.SUPER_ADMIN_PASSWROD,
      Number(envVar.BCRYPT_SALT_ROUND) || 10,
    );

    const admin = await User.create({
      email: "dev.epic.nz@gmail.com",
      full_name: "Super Admin",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      is_verified: true,
      auth_providers: [
        {
          provider: AuthProviderType.CREDENTIAL,
          providerID: "dev.epic.nz@gmail.com",
        },
      ],
      preferences: {
        language: "en",
        app_notifications: true,
        notifications_enabled: true,
        location_access: true,
      },
      fcmTokens: [],
    });

    console.log("✅ Admin seeded successfully!");
    console.log("Email:", admin.email);
  } catch (error) {
    console.error("❌ Admin seeding failed:", error);
  }
};
