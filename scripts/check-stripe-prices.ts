import dotenv from "dotenv";
import Stripe from "stripe";
import path from 'path';

// Specify path to .env file since this script is in a subdirectory
dotenv.config({ path: path.join(__dirname, '../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

async function listPrices() {
  console.log("Checking Stripe Configuration...");
  console.log(`Using Secret Key starting with: ${process.env.STRIPE_SECRET_KEY?.substring(0, 8)}...`);
  
  try {
    const prices = await stripe.prices.list({
      limit: 10,
      active: true,
      expand: ['data.product']
    });

    if (prices.data.length === 0) {
      console.log("\n❌ No active prices found in this Stripe account.");
      console.log("Please create a Product and Price in your Stripe Dashboard.");
    } else {
      console.log(`\n✅ Found ${prices.data.length} active prices:\n`);
      prices.data.forEach((p) => {
        const product = p.product as Stripe.Product;
        console.log(`Product: ${product.name}`);
        console.log(`  Price ID: ${p.id}`);
        console.log(`  Amount: ${(p.unit_amount || 0) / 100} ${p.currency.toUpperCase()}`);
        console.log(`  Interval: ${p.recurring?.interval}\n`);
      });
      console.log("👉 Please copy one of the 'Price ID' values above into your .env file as PRICE_MONTHLY or PRICE_YEARLY.");
    }
  } catch (error: any) {
    console.error("\n❌ Error connecting to Stripe:", error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log("Hint: Check your STRIPE_SECRET_KEY in the .env file.");
    }
  }
}

listPrices();
