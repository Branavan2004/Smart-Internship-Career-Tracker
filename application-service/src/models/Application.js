import mongoose from "mongoose";

const interviewStageSchema = new mongoose.Schema(
  {
    stageName: {
      type: String,
      required: true,
      trim: true
    },
    date: Date,
    result: {
      type: String,
      enum: ["pending", "scheduled", "passed", "failed"],
      default: "pending"
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "applied", "review", "interview", "accepted", "rejected"],
      default: "applied",
      index: true
    },
    interviewStages: {
      type: [interviewStageSchema],
      default: []
    },
    followUpDate: Date,
    notes: {
      type: String,
      default: ""
    },
    resumeUrl: {
      type: String,
      default: ""
    },
    portfolioUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

applicationSchema.index({ userId: 1, companyName: 1, roleTitle: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
