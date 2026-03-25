export const statusOptions = ["Pending", "Interviewed", "Accepted", "Rejected", "Offer"];

export const roleTypeOptions = ["SE", "PM", "Data", "Design", "QA", "Other"];

export const interviewRoundOptions = [
  "First round",
  "Technical round",
  "PM round",
  "HR round",
  "Offer",
  "Rejected"
];

export const interviewResultOptions = ["Pending", "Scheduled", "Passed", "Failed"];

export const emptyApplication = {
  companyName: "",
  role: "",
  roleType: "SE",
  appliedDate: "",
  status: "Pending",
  notes: "",
  feedback: "",
  portfolioLink: "",
  portfolioViewed: false,
  rejectionReason: "",
  followUpDate: "",
  interviewStages: []
};
