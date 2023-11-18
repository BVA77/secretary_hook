const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Bangkok')

const currentDate = () => {
	return dayjs.tz().format('DD/MM/YYYY, HH:mm')
}

module.exports = {
	currentDate
}