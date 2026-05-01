import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const oauthId = profile.id;

        let user = await User.findOne({
          $or: [{ email }, { oauthId }]
        });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            oauthId,
            authProvider: "google",
            role: "student"
          });
        } else if (!user.oauthId) {
          user.oauthId = oauthId;
          user.authProvider = "google";
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export default passport;
