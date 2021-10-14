import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2020-08-27",
});

function initMiddleware(middleware: any) {
  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result: any) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET, POST and OPTIONS
    methods: ["POST"],
  })
);

const CheckoutSessionHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // Set cors
  await cors(req, res);

  if (req.method === "POST") {
    const price_id: string = req.body.price_id;
    const customer_email: string = req.body.email;
    try {
      // Create Checkout Sessions from body params.
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: price_id, quantity: 1 }],
        success_url: `${process.env.STRIPE_REDIRECT_AFTER_CHECKOUT_URL}/thank-you`,
        cancel_url: `${process.env.STRIPE_REDIRECT_AFTER_CHECKOUT_URL}/`,
        customer_email,
        subscription_data: {
          trial_period_days: 7,
        },
      };
      const checkoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create(params);

      res.status(200).json(checkoutSession);
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: err });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default CheckoutSessionHandler;
