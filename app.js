const express = require('express')
const fileUpload = require('express-fileupload')

const app = express()
app.use(express.json({ extended: true }))
app.use('/api', require('./routes/routes'))
app.use(
	fileUpload({
		createParentPath: true,
	}),
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	try {
		console.log(`Server started at PORT ${PORT}...`)
	} catch (e) {
		console.log('ERROR: ', e)
	}
})
