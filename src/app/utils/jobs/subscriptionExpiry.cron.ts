import cron from "node-cron";
import { expireTrialSubscriptions } from "./subscriptionExpiry.job";

// ⏰ Runs every day at midnight (UTC)
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ Running trial expiration cron...");
    await expireTrialSubscriptions();
  } catch (error) {
    console.error("❌ Trial expiration cron failed:", error);
  }
});
