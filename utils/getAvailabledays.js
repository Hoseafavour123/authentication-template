import moment from 'moment'

function parseTime(timeStr) {
  return moment(timeStr, 'h a')
}

const startDay = moment().add(1, 'day').startOf('day')
const numDays = startDay.clone().add(5, 'days').diff(startDay, 'days')




function generateDaysAndDates() {
  const days = []
  let currentDay = startDay.clone()

  while (days.length < numDays) {
    if (currentDay.day() !== 0 && currentDay.day() !== 6) {
      days.push({
        dayName: currentDay.format('dddd').toLowerCase(),
        date: currentDay.format('YYYY-MM-DD'),
      })
    }
    currentDay.add(1, 'day')
  }

  return days
}

function generateBookingTimes(startTimeStr, endTimeStr, interval) {
  const availableTimes = []

  const currentTime = moment(parseTime(startTimeStr))
  const endTimeObj = moment(parseTime(endTimeStr))

  while (currentTime.isBefore(endTimeObj)) {
    availableTimes.push(currentTime.format('h:mm a'))
    currentTime.add(interval, 'minutes')
  }

  return availableTimes
}

export { parseTime, generateDaysAndDates, generateBookingTimes }
