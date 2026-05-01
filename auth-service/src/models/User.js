import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    role: {
      type: String,
      enum: ["student", "admin", "reviewer"],
      default: "student",
      index: true
    },
    oauthId: {
      type: String,
      index: true,
      sparse: true
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    password: {
      type: String,
      minlength: 8
    },
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
