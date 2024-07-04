import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: String,
    // required: [true],
  },
  planName: {
    type: String,
  },
  customer_id: {
    type: String,
  },
  total: {
    type: Number,
  },
  payment_status: {
    type: String,
  },
  tokensOnPurchase: {
    type: String,
  },
  plan_id: {
    type: String,
    // required: [true],
  },
});

export default mongoose.model("Payment", paymentSchema);
