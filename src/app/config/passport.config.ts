/* eslint-disable @typescript-eslint/no-explicit-any */
import passport, { Profile } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import User from "../modules/user/user.model";
import { envVar } from "./envVar";
import { Role } from "../modules/user/user.interface";

// Configure the local strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },

    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }

        // Check if the user is authenticated via OAuth (Google, Apple, etc.)
        const isOAuthUser =
          user.auth_providers && user.auth_providers.length > 0;

        // If it's an OAuth user, skip the password check
        if (isOAuthUser) {
          return done(null, user); // OAuth users don't need a password check
        }

        // For non-OAuth users, check if the password is set
        if (!user.password || typeof user.password !== "string") {
          return done(null, false, {
            message: "Password not set for user. Please set your password.",
          });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user); // success
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: envVar.GOOGLE_AUTH.GOOGLE_CLIENT_ID,
      clientSecret: envVar.GOOGLE_AUTH.GOOGLE_CLIENT_SECRET,
      callbackURL: envVar.GOOGLE_AUTH.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "No email found" });
        }

        let user = await User.findOne({ email });

        if (user && !user.is_verified) {
          return done(null, false, { message: "User is not verified" });
        }

        if (user && user.isDeleted) {
          return done(null, false, { message: "User is deleted" });
        }

        if (!user) {
          user = await User.create({
            email,
            full_name: profile.displayName,
            profile_picture: profile.photos?.[0]?.value,
            role: Role.USER,
            is_verified: true,
            auth_providers: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("Google Strategy Error", error);
        return done(error);
      }
    }
  )
);

// Serialize user into session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
