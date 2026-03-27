import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <user-email>");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  console.log(`Updated ${user.email} to admin`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Failed to update admin role", error);
  process.exit(1);
});
