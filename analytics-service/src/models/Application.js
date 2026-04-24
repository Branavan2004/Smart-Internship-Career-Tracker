import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    companyName: String,
    roleTitle: String,
    status: String,
    interviewStages: [
      {
        stageName: String,
        date: Date,
        result: String
      }
    ]
  },
  {
    strict: false
  }
);

const Application = mongoose.model("AnalyticsApplication", applicationSchema, "applications");

export default Application;
