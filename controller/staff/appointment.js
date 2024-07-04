import express from 'express'
import Appointment from '../../model/appointment.js'
import Availability from '../../model/availability.js'
import catchAsyncErrors from '../../middlewares/catchAsyncErrors.js'
import {
  isAuthenticated,
  isStaffAuthenticated,
} from '../../middlewares/auth.js'
import pkg from 'jsonwebtoken'
import User from '../../model/user.js'
import Staff from '../../model/staff.js'
import sendMail from '../../utils/sendMail.js'
import {
  generateBookingTimes,
  generateDaysAndDates,
} from '../../utils/getAvailabledays.js'
const { verify } = pkg
const router = express.Router()


// create staff availability
router.post(
  '/create-availability',
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { staffId, startHour, endHour, interval, dayName } = req.body
      if (!staffId || !startHour || !endHour || !interval || !dayName) {
        return res.status(400).json({ error: 'Please input all fields' })
      }

      const daysAndDates = generateDaysAndDates()
      const findDay = daysAndDates.find(
        (day) => day.dayName === dayName.toLowerCase()
      )

      if (!findDay) {
        return res
          .status(400)
          .json({ success: false, message: 'Provide a valid working day' })
      }
      const staff = Staff.findById(staffId)
      if (!staff) {
        return res.status(404).json({ error: 'Could not find staff' })
      }
      const existingAvailabilty = await Availability.findOne({
        staffId,
        dayName: dayName.toLowerCase(),
      })

      if (existingAvailabilty) {
        return res
          .status(400)
          .json({ success: false, msg: "The day's schedule has been set" })
      }

      const getTimes = generateBookingTimes(startHour, endHour, interval)

      const availability = await Availability.create({
        ...req.body,
        dayName: findDay.dayName,
        date: findDay.date,
        availableTimes: getTimes,
      })

      return res.json({ success: true, msg: availability})
    } catch (error) {
      console.log(error)
      return res.json({ error })
    }
  })
)

// Delete staff availabilty
router.delete(
  '/delete-availability/:id',
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params

    if (!id) {
      return res
        .status(400)
        .json({ error: 'Please provide availabilty id' })
    }
    try {
      const check = await Availability.findById(id)
      if (!check) {
        return res.status(404).json({success: false, msg: "This availability does not exist"})
      }
      await Availability.findByIdAndDelete(id)
      return res.status(200).json({ sucesss: true})
    } catch (error) {
      return res.status(401).json({ success: false, error: error.message })
    }
  })
)

// activate user
router.post(
  '/create-appointment',
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, desc, date, time, service } = req.body

      if (!userId || !desc || !date || !time || !service) {
        return res.status(400).json({ error: 'Please input all fields' })
      }

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const staff = await Staff.findById(req.user._id)

      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' })
      }

      const existingAppointment = await Appointment.findOne({ date, time })

      if (existingAppointment) {
        console.log('The time slot is already booked.')
        return res.status(400).json({ error: 'Slot booked' })
      }

      const appointment = new Appointment({
        userId: user._id,
        staffId: staff._id,
        desc,
        date,
        time,
        service,
      })

      const savedAppointment = await appointment.save()

      try {
        await sendMail({
          email: staff.email,
          subject: 'Appointment Booked',
          html: `<p>You successfully booked an appointment with <strong>${user.name}</strong>. You would recieve a mail when your appointment is approved.</p>`,
        })
        await sendMail({
          email: user.email,
          subject: 'New Appointment!',
          html: `<p>You have a new appointment request from <strong>${staff.name}</strong>. Login to your dashboard to view more details and approve request.</p>`,
        })
        return res.status(201).json({
          success: true,
          savedAppointment,
        })
      } catch (error) {
        return res.status(500).json({ message: error.message })
      }
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  })
)

router.post(
  '/approve-appointment',
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { appointmentId } = req.body

      if (!appointmentId) {
        return res.status(400).json({ error: 'Please input all fields' })
      }

      const staff = await Staff.findById(req.user._id)

      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' })
      }

      let appointment = await Appointment.findById(appointmentId)

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' })
      }

      const user = await User.findById(appointment.userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      ;(appointment.isApproved = true), await appointment.save()

      try {
        await sendMail({
          email: user.email,
          subject: 'Appointment Approved',
          html: `<p>Your appointment with <strong>${staff.name}</strong> was approved.</p>`,
        })
        await sendMail({
          email: staff.email,
          subject: 'Appointment Approved!',
          html: `You successfuly approved your appointment with <p><strong>${user.name}</strong>.</p>`,
        })
        return res.status(200).json({
          success: true,
        })
      } catch (error) {
        return res.status(500).json({ message: error.message })
      }
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  })
)

router.post(
  '/cancel-appointment',
  isStaffAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { appointmentId } = req.body

      if (!appointmentId) {
        return res.status(400).json({ error: 'Please input all fields' })
      }

      const staff = await Staff.findById(req.user?._id)

      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' })
      }
      let appointment = await Appointment.findById(appointmentId)

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' })
      }
      const user = await User.findById(appointment?.userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      ;(appointment.isCancelled = true), await appointment.save()

      try {
        await sendMail({
          email: user.email,
          subject: 'Appointment Cancelled',
          html: `<p>Your appointment with <strong>${staff.name}</strong> was cancelled.</p>`,
        })
        await sendMail({
          email: staff.email,
          subject: 'Appointment Cancelled!',
          html: `<p>You successfuly cancelled your appointment with <p><strong>${user.name}</strong>.</p>`,
        })
        return res.status(200).json({
          success: true,
        })
      } catch (error) {
        return res.status(500).json({ message: error.message })
      }
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  })
)

export default router
