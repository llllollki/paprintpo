// Stripe server-side client.
// Import this only in server-side code (Route Handlers, Server Actions).
// Never import in Client Components — STRIPE_SECRET_KEY must not reach the browser.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});
