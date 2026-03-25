import { asyncHandler } from "../utils/asyncHandler.js";
import { buildReminderDigest, sendReminderDigest } from "../services/reminderService.js";

export const getReminderSummary = asyncHandler(async (req, res) => {
  const digest = await buildReminderDigest(req.user);
  res.json(digest);
});

export const sendSimulatedReminderEmail = asyncHandler(async (req, res) => {
  const result = await sendReminderDigest(req.user);
  res.json({
    message: "Simulated reminder email generated.",
    digest: result.digest,
    preview: result.message.message
  });
});
