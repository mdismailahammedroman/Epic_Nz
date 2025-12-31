import Stripe from "stripe";
import { envVar } from "../config/envVar";

export const stripe = new Stripe(envVar.STRIPE_SECRET_KEY as string);
