import dotenv from "dotenv";
import { Issuer, Strategy } from "openid-client";
import User from "../models/User.js";

dotenv.config();

export const isAsgardeoConfigured = Boolean(
  process.env.ASGARDEO_CLIENT_ID &&
    process.env.ASGARDEO_CLIENT_SECRET &&
    process.env.ASGARDEO_BASE_URL &&
    process.env.ASGARDEO_CALLBACK_URL
);

export const setupAsgardeoStrategy = async (passport) => {
  if (!isAsgardeoConfigured) {
    console.warn("WARNING: Asgardeo OIDC variables are missing. Asgardeo login is DISABLED, but the server will continue to run with local authentication.");
    return;
  }

  try {
    const asgardeoIssuer = await Issuer.discover(process.env.ASGARDEO_BASE_URL);
    
    const client = new asgardeoIssuer.Client({
      client_id: process.env.ASGARDEO_CLIENT_ID,
      client_secret: process.env.ASGARDEO_CLIENT_SECRET,
      redirect_uris: [process.env.ASGARDEO_CALLBACK_URL],
      response_types: ["code"],
    });

    passport.use(
      "asgardeo",
      new Strategy(
        {
          client,
          params: {
            scope: "openid profile email groups",
          },
        },
        async (tokenSet, userinfo, done) => {
          try {
            const email = userinfo.email || (tokenSet.claims() && tokenSet.claims().email);
            const sub = userinfo.sub || (tokenSet.claims() && tokenSet.claims().sub);
            const displayName = userinfo.name || userinfo.given_name || email?.split("@")[0] || "Asgardeo User";
            const groups = userinfo.groups || (tokenSet.claims() && tokenSet.claims().groups) || [];

            if (!email) {
              return done(new Error("Email not provided by Asgardeo"), null);
            }

            let role = "student";
            if (groups.includes("admin") || groups.includes("Admin")) {
              role = "admin";
            } else if (groups.includes("reviewer") || groups.includes("Reviewer")) {
              role = "reviewer";
            }

            let user = await User.findOne({
              $or: [{ asgardeoId: sub }, { email }]
            });

            if (!user) {
              user = await User.create({
                name: displayName,
                email,
                asgardeoId: sub,
                role,
                groups
              });
            } else {
              user.asgardeoId = user.asgardeoId || sub;
              user.name = user.name || displayName;
              // Ensure role and groups are updated on every login
              user.role = role;
              user.groups = groups;
              await user.save();
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );

    console.log("Asgardeo OIDC Strategy initialized successfully.");
  } catch (error) {
    console.error("Failed to discover Asgardeo issuer or initialize strategy", error);
  }
};
