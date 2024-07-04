import express from "express";
import Stripe from "stripe";
import Payment from "../../model/payment.js";
import User from "../../model/user.js";
import ErrorHandler from "../../utils/ErrorHandler.js";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import { client_url } from "../../utils/urls.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();


router.post("/create-payment", async (req, res, next) => {
  const price = req.body.plan;
  const userId = req.body.user_id;
  const planName = req.body.planName;
  const tokensOnPurchase = req.body.tokens;

  const customer = await stripe.customers.create({
    metadata: {
      price: price,
      userId: userId,
      tokensOnPurchase: tokensOnPurchase,
      planName: planName,
    },
  });
  try {
    const session = await stripe.checkout.sessions.create({
     
      // payment_method_types: ["card"],
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      success_url: `${client_url}/image`,
      cancel_url: `${client_url}/pricing`,
    });
    res.json({
      id: session.id,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const createOrder = async (customer, data) => {
  const newOrder = new Payment({
    user_id: customer.metadata.userId,
    customer_id: data.customer,
    tokensOnPurchase: customer.metadata.tokensOnPurchase,
    // paymentIntentId: data.payment_intent,
    plan_id: customer.metadata.price,
    planName: customer.metadata.planName,
    total: data.amount_total,
    payment_status: data.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();
    console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }

  const tokensOnPurchase = parseInt(customer.metadata.tokensOnPurchase);

  const user = await User.findOne({ _id: customer.metadata.userId });
  if (!user) {
    console.log("User not found");
    return;
  }

  const token = user.credit + tokensOnPurchase;
  console.log(token);
  await User.updateOne(
    { _id: customer.metadata.userId },
    { $set: { credit: token } }
  );

  console.log("Token amount updated:", User);
};

// const endpointSecret =
//   // "whsec_DSLh43WJ7u2f5EWWn5vDsbXBrJKcyg7O";

router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    let data;
    let event;

    // Check if webhook signing is configured.
    let endpointSecret;
    //webhookSecret = process.env.STRIPE_WEB_HOOK;

    if (endpointSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.

      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed:  ${err}`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data.object;
      event = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      event = req.body.type;
      // console.log(data.customer);
    }

    switch (event) {
      case "checkout.session.async_payment_failed":
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;

      case "payment_intent.payment_failed":
        const handleIntentFailed = data;
        console.log(handleIntentFailed);
        break;
      case "checkout.session.async_payment_succeeded":
        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case "checkout.session.completed":
        // Then define and call a function to handle the event checkout.session.completed
        stripe.customers
          .retrieve(data.customer)
          .then(async (customer) => {
            try {
              // CREATE ORDER
              createOrder(customer, data);
              console.log(customer);
            } catch (err) {
              // console.log(typeof createOrder);
              console.log(err);
            }
          })
          .catch((err) => console.log(err.message));

        break;
      case "checkout.session.expired":
        // Then define and call a function to handle the event checkout.session.expired
        break;
      case "customer.created":
        // Then define and call a function to handle the event customer.created
        break;
      case "customer.deleted":
        // Then define and call a function to handle the event customer.deleted
        break;
      case "customer.updated":
        // Then define and call a function to handle the event customer.updated
        break;
      case "invoice.created":
        // Then define and call a function to handle the event invoice.created
        break;
      case "invoice.deleted":
        // Then define and call a function to handle the event invoice.deleted
        break;
      case "invoice.finalization_failed":
        // Then define and call a function to handle the event invoice.finalization_failed
        break;
      case "invoice.finalized":
        // Then define and call a function to handle the event invoice.finalized
        break;
      case "invoice.marked_uncollectible":
        // Then define and call a function to handle the event invoice.marked_uncollectible
        break;
      case "invoice.paid":
        // Then define and call a function to handle the event invoice.paid
        break;
      case "invoice.payment_action_required":
        // Then define and call a function to handle the event invoice.payment_action_required
        break;
      case "invoice.payment_failed":
        // Then define and call a function to handle the event invoice.payment_failed
        break;
      case "invoice.payment_succeeded":
        // Then define and call a function to handle the event invoice.payment_succeeded
        break;
      case "invoice.sent":
        // Then define and call a function to handle the event invoice.sent
        break;
      case "invoice.upcoming":
        // Then define and call a function to handle the event invoice.upcoming
        break;
      case "invoice.updated":
        // Then define and call a function to handle the event invoice.updated
        break;
      case "invoice.voided":
        // Then define and call a function to handle the event invoice.voided
        break;
      case "invoiceitem.created":
        // Then define and call a function to handle the event invoiceitem.created
        break;
      case "invoiceitem.deleted":
        // Then define and call a function to handle the event invoiceitem.deleted
        break;
      case "payment_intent.amount_capturable_updated":
        // Then define and call a function to handle the event payment_intent.amount_capturable_updated
        break;
      case "payment_intent.canceled":
        // Then define and call a function to handle the event payment_intent.canceled
        break;
      case "payment_intent.created":
        // Then define and call a function to handle the event payment_intent.created
        break;
      case "payment_intent.partially_funded":
        // Then define and call a function to handle the event payment_intent.partially_funded
        break;
      case "payment_intent.payment_failed":
        // Then define and call a function to handle the event payment_intent.payment_failed
        break;
      case "payment_intent.processing":
        // Then define and call a function to handle the event payment_intent.processing
        break;
      case "payment_intent.requires_action":
        // Then define and call a function to handle the event payment_intent.requires_action
        break;
      case "payment_intent.succeeded":
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.status(200).end();
  }
);

router.get(
  "/get-transactions",
  // isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: "Please login to continue" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      const userId = decoded.id;
      if (!userId) {
        console.log("No user Found!");
        res.status(404).json({ error: "Invalid quary" });
        return;
      }
      // console.log(userId);
      const myPayments = await Payment.find({ user_id: userId });

      if (myPayments.length === 0) {
        console.log("No transaction history found for the user");
        res
          .status(404)
          .json({ error: "No transaction history found for the user" });
        return;
      }

      res.status(200).json({
        success: true,
        myPayments,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

export default router;
