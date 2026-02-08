
import dotenv from "dotenv";
import Stripe from "stripe";
import path from 'path';
import fs from 'fs';

// Specify path to .env file since this script is in a subdirectory
dotenv.config({ path: path.join(__dirname, '../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

async function listPrices() {
  let output = "";
  output += "Checking Stripe Configuration...\n";
  output += `Using Secret Key starting with: ${process.env.STRIPE_SECRET_KEY?.substring(0, 8)}...\n`;
  
  try {
    const prices = await stripe.prices.list({
      limit: 10,
      active: true,
      expand: ['data.product']
    });

    if (prices.data.length === 0) {
      output += "\n❌ No active prices found in this Stripe account.\n";
      output += "Please create a Product and Price in your Stripe Dashboard.\n";
    } else {
      output += `\n✅ Found ${prices.data.length} active prices:\n\n`;
      prices.data.forEach((p) => {
        const product = p.product as Stripe.Product;
        output += `Product: ${product.name}\n`;
        output += `  Price ID: ${p.id}\n`;
        output += `  Amount: ${(p.unit_amount || 0) / 100} ${p.currency.toUpperCase()}\n`;
        output += `  Interval: ${p.recurring?.interval}\n\n`;
      });
      output += "👉 Please copy one of the 'Price ID' values above into your .env file as PRICE_MONTHLY or PRICE_YEARLY.\n";
    }
  } catch (error: any) {
    output += `\n❌ Error connecting to Stripe: ${error.message}\n`;
    if (error.type === 'StripeAuthenticationError') {
      output += "Hint: Check your STRIPE_SECRET_KEY in the .env file.\n";
    }
  }
  
  fs.writeFileSync('stripe_debug_output.txt', output);
  console.log("Done. Check stripe_debug_output.txt");
}

listPrices();
