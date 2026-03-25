import mongoose from "mongoose";

const interviewStageSchema = new mongoose.Schema(
  {
    round: {
      type: String,
      enum: ["First round", "Technical round", "PM round", "HR round", "Offer", "Rejected"],
      required: true
    },
    date: {
      type: Date
    },
    result: {
      type: String,
      enum: ["Pending", "Passed", "Failed", "Scheduled"],
      default: "Pending"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    roleType: {
      type: String,
      enum: ["SE", "PM", "Data", "Design", "QA", "Other"],
      default: "SE"
    },
    appliedDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Interviewed", "Accepted", "Rejected", "Offer"],
      default: "Pending"
    },
    notes: {
      type: String,
      default: ""
    },
    feedback: {
      type: String,
      default: ""
    },
    portfolioLink: {
      type: String,
      default: ""
    },
    portfolioViewed: {
      type: Boolean,
      default: false
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    followUpDate: {
      type: Date
    },
    interviewStages: {
      type: [interviewStageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
