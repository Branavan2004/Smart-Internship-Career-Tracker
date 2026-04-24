import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const TIERS = ["free", "premium", "enterprise"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    asgardeoId: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["student", "admin", "reviewer"],
      default: "student",
      required: true
    },
    // Multi-tenancy — logical tenant isolation
    tenantId: {
      type: String,
      index: true,
      default: "default"
    },
    // API Monetization tier
    tier: {
      type: String,
      enum: TIERS,
      default: "free"
    },
    // Daily write quota tracking (resets each UTC day)
    quotaUsed: {
      type: Number,
      default: 0
    },
    quotaResetAt: {
      type: Date,
      default: null
    },
    profilePicture: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      minlength: 6
    },
    phone: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    resumeUrl: {
      type: String,
      default: ""
    },
    resumeFilename: {
      type: String,
      default: ""
    },
    weeklyDigestEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password") || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
