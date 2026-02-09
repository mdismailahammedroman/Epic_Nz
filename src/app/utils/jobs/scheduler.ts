import cron from "node-cron";
import { expireTrialSubscriptions } from "./subscriptionExpiry.job";

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running trial expiration job...");
  await expireTrialSubscriptions();
});
