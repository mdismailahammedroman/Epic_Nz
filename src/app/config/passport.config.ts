/* eslint-disable @typescript-eslint/no-explicit-any */
import passport, { Profile } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import bcrypt from "bcryptjs";
import User from "../modules/user/user.model";
import { envVar } from "./envVar";
import { AuthProviderType, Role } from "../modules/user/user.interface";

// ✅ Local strategy (BLOCK oauth accounts)
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select("+password");
        if (!user)
          return done(null, false, { message: "Incorrect email or password" });

        if (!user.is_verified)
          return done(null, false, { message: "User is not verified" });
        if (user.isDeleted)
          return done(null, false, { message: "User is deleted" });

        const isGoogleUser = user.auth_providers.some(b => b.provider === AuthProviderType.GOOGLE);
        const isAppleUser = user.auth_providers.some(b => b.provider === AuthProviderType.APPLE);


        if (isGoogleUser) {
          // ✅ critical security fix
          return done(null, false, {
            message:
              "This account uses Google login. Please continue with Google.",
          });
        }
        if (isAppleUser) {
          // ✅ critical security fix
          return done(null, false, {
            message:
              "This account uses Apple login. Please continue with Apple.",
          });
        }

        if (!user.password)
          return done(null, false, {
            message: "Password not set. Please set your password.",
          });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return done(null, false, { message: "Incorrect email or password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// ✅ Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: envVar.GOOGLE_AUTH.GOOGLE_CLIENT_ID,
      clientSecret: envVar.GOOGLE_AUTH.GOOGLE_CLIENT_SECRET,
      callbackURL: envVar.GOOGLE_AUTH.GOOGLE_CALLBACK_URL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email)
          return done(null, false, { message: "No email found from Google" });

        let user = await User.findOne({ email });

        if (user && !user.is_verified)
          return done(null, false, { message: "User is not verified" });
        if (user && user.isDeleted)
          return done(null, false, { message: "User is deleted" });

        if (!user) {
          user = await User.create({
            email,
            full_name: profile.displayName,
            profile_picture: profile.photos?.[0]?.value,
            role: Role.USER,
            is_verified: true,
            auth_providers: [
              { provider: AuthProviderType.GOOGLE, providerID: profile.id },
            ],
          });
        } else {
          // optional: keep provider list updated
          const hasGoogle = user.auth_providers?.some(
            (p: any) => p.provider === AuthProviderType.GOOGLE,
          );
          if (!hasGoogle) {
            await User.updateOne(
              { _id: user._id },
              {
                $addToSet: {
                  auth_providers: {
                    provider: AuthProviderType.GOOGLE,
                    providerID: profile.id,
                  },
                },
              },
            );
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new AppleStrategy(
    {
      clientID: envVar.APPLE_AUTH.APPLE_CLIENT_ID, // Service ID
      teamID: envVar.APPLE_AUTH.APPLE_TEAM_ID,
      keyID: envVar.APPLE_AUTH.APPLE_KEY_ID,
      privateKeyString: envVar.APPLE_AUTH.APPLE_PRIVATE_KEY_PATH,
      callbackURL: envVar.APPLE_AUTH.APPLE_CALLBACK_URL,
      scope: ["name", "email"],
      passReqToCallback: false, // 👈 REQUIRED for TS
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      idToken: any,
      profile: any,
      done: any,
    ) => {
      try {
        // Apple unique id => idToken.sub
        const appleId = idToken?.sub || profile?.id;
        const email = profile?.email; // often only first time
        const fullName = profile?.name
          ? `${profile.name.firstName ?? ""} ${profile.name.lastName ?? ""}`.trim()
          : undefined;

        if (!appleId)
          return done(null, false, { message: "No Apple user id found" });

        // ✅ Find by provider first
        let user = await User.findOne({
          "auth_providers.provider": AuthProviderType.APPLE,
          "auth_providers.providerID": appleId,
        });

        // fallback by email (only if present)
        if (!user && email) user = await User.findOne({ email });

        if (user && !user.is_verified)
          return done(null, false, { message: "User is not verified" });
        if (user && user.isDeleted)
          return done(null, false, { message: "User is deleted" });

        if (!user) {
          user = await User.create({
            email: email ?? undefined,
            full_name: fullName ?? "Apple User",
            role: Role.USER,
            is_verified: true,
            auth_providers: [
              { provider: AuthProviderType.APPLE, providerID: appleId },
            ],
          });
        } else {
          const hasApple = user.auth_providers?.some(
            (p: any) => p.provider === AuthProviderType.APPLE,
          );

          if (!hasApple) {
            await User.updateOne(
              { _id: user._id },
              {
                $addToSet: {
                  auth_providers: {
                    provider: AuthProviderType.APPLE,
                    providerID: appleId,
                  },
                },
              },
            );
          }

          // store email/name if missing (first-time only issue)
          const update: any = {};
          if (!user.email && email) update.email = email;
          if (
            (!user.full_name || user.full_name === "Apple User") &&
            fullName
          ) {
            update.full_name = fullName;
          }
          if (Object.keys(update).length) {
            await User.updateOne({ _id: user._id }, update);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
