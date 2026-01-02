import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../modules/user/user.model";

// Configure the local strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
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

        // For non-OAuth users, compare the password
        if (!user.password || typeof user.password !== "string") {
          return done(null, false, { message: "Password not set for user." });
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
