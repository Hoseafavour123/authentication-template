import mongoose from "mongoose"

const availabilitySchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: [true, 'please provide staff ID']
  },
  dayName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: false
  },
  startHour: {
    type: String,
    default: '9 am'
  },
  endHour: {
    type: String,
    default: '4 pm'
  },
  interval: {
    type: Number,
    default: 30
  },
  availableTimes: {
    type: Array,
    default: [],
    required: false
  }
})

export default mongoose.model('Availability', availabilitySchema)