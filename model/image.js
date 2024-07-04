import mongoose from "mongoose";


const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // _id: {
  //   type: String,
  //   default: function () {
  //     return this.user_id;
  //   },
  // },
  user_id: {
    type: String,
    // required: [true],
  },
  prompt: {
    type: String,
    // required: [true],
  },
  img_url: {
    type: String,
    // required: [true],
  },
  is_favourite: {
    type: Boolean,
  },
  date_of_creation: {
    type: String,
    // required: [true],
  },
 
});



export default mongoose.model("Image", imageSchema);
