import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const splitSkills = (skillsValue) => {
  if (Array.isArray(skillsValue)) {
    return skillsValue.filter(Boolean);
  }

  if (typeof skillsValue !== "string") {
    return [];
  }

  return skillsValue
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
};

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const { name, email, phone, skills, resumeUrl, weeklyDigestEnabled } = req.body;

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.phone = phone ?? user.phone;
  user.skills = skills !== undefined ? splitSkills(skills) : user.skills;
  user.weeklyDigestEnabled =
    weeklyDigestEnabled !== undefined
      ? weeklyDigestEnabled === true || weeklyDigestEnabled === "true"
      : user.weeklyDigestEnabled;

  if (req.file) {
    user.resumeFilename = req.file.originalname;
    user.resumeUrl = `/uploads/${req.file.filename}`;
  } else if (resumeUrl !== undefined) {
    user.resumeUrl = resumeUrl;
  }

  await user.save();

  res.json({
    message: "Profile updated successfully.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      skills: user.skills,
      resumeUrl: user.resumeUrl,
      resumeFilename: user.resumeFilename,
      weeklyDigestEnabled: user.weeklyDigestEnabled
    }
  });
});
