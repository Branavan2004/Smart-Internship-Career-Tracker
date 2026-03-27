import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

dotenv.config();

const testUsers = [
  {
    name: "Student Tester",
    email: "student@test.com",
    role: "student",
    password: "Password123!"
  },
  {
    name: "Admin Tester",
    email: "admin@test.com",
    role: "admin",
    password: "Password123!"
  },
  {
    name: "Reviewer Tester",
    email: "reviewer@test.com",
    role: "reviewer",
    password: "Password123!"
  }
];

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await User.findOneAndUpdate(
      { email: user.email },
      {
        name: user.name,
        email: user.email,
        role: user.role,
        password: hashedPassword
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  console.log("RBAC test users are ready:");
  testUsers.forEach((user) => {
    console.log(`- ${user.email} (${user.role})`);
  });

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Failed to seed RBAC test users", error);
  process.exit(1);
});
