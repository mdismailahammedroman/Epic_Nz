import Stripe from "stripe";
import { envVar } from "../config/envVar";

export const stripe = new Stripe(envVar.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});
