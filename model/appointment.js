import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    // required: [true],
  },
  staffEmail: {
    type: String,
  },
  staffName: {
    type: String,
  },
  staffRole: {
    type: String,
  },
  staffId: {
    type: String,
  },
  desc: {
    type: String,
  },
  booking_title: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isCancelled: {
    type: Boolean,
    default: false,
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
  time: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Appointment", appointmentSchema);
