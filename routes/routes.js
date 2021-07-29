const { Router } = require('express')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
require('dotenv').config()

const router = Router()

const jwtSecretKey = process.env.JWT_SECRET_KEY

const { getUserByEmail, addUser, isUserExists } = require('../entities/user')
const {
	getItemsWithUsers,
	getItemWithUserById,
	updateItemById,
	deleteItemById,
	createItem,
	uploadFileImage,
} = require('../entities/item')
const {
	validateUpdateItemRequest,
	validateCreateItemRequest,
} = require('../validation/itemValidation')

//  /api/register	REGISTER
router.post(
	'/register',
	[
		check('email', 'Wrong email').isEmail(),
		check('password', 'Minimal length for password is 5 symbols').isLength({
			min: 5,
		}),
	],
	async (req, res) => {
		try {
			const errorFormatter = ({ msg, param }) => {
				return {
					field: param,
					message: msg,
				}
			}
			const result = validationResult(req).formatWith(errorFormatter)
			if (!result.isEmpty) {
				return res.status(422).json({ errors: result.array() })
			}

			const { name, email, password, phone } = req.body

			const exist = await isUserExists(email)
			if (exist) {
				return res.status(400).json({ message: 'User already exists!' })
			}

			const hashedPassword = await bcryptjs.hash(password, 13)

			await addUser(name, email, hashedPassword, phone)

			const token = jwt.sign({ email: email }, jwtSecretKey, {
				expiresIn: '3h',
			})

			res.status(200).json({ token })
		} catch (e) {
			res.status(500).json({
				message: 'Server error, try again',
			})
		}
	},
)

//  /api/login	LOGIN
router.post(
	'/login',
	[
		check('email', 'Wrong email or password').isEmail(),
		check('password', 'Wrong email or password').isLength({ min: 5 }),
	],
	async (req, res) => {
		try {
			const errorFormatter = ({ msg, param }) => {
				return {
					field: param,
					message: msg,
				}
			}
			const result = validationResult(req).formatWith(errorFormatter)
			if (!result.isEmpty) {
				return res.status(422).json({ errors: result.array() })
			}

			const { email, password } = req.body

			const exist = await isUserExists(email)
			if (!exist) {
				return res.status(400).json({ message: 'User not found!' })
			}
			const user = await getUserByEmail(email)

			const isMatch = await bcryptjs.compare(password, user.password)
			if (!isMatch) {
				return res
					.status(422)
					.json({ message: 'Wrong email or password' })
			}

			const token = jwt.sign({ email: email }, jwtSecretKey, {
				expiresIn: '3h',
			})

			res.status(200).json({
				token,
			})
		} catch (e) {
			res.status(500).json({ message: 'Server error, try again' })
		}
	},
)

//	/api/me	GET CURRENT USER
router.get('/me', async (req, res) => {
	try {
		const auth = req.headers.authorization

		const verifiedToken = jwt.verify(auth, jwtSecretKey)
		if (!verifiedToken.email) {
			return res.status(401).end()
		}
		const user = await getUserByEmail(verifiedToken.email)

		return res.status(200).json({
			id: user.user_id,
			phone: user.phone,
			name: user.name,
			email: user.email,
		})
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

//	/api/items GET ALL ITEMS
router.get('/items', async (req, res) => {
	try {
		const response = await getItemsWithUsers()
		res.status(200).json(response)
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

//	/api/items/:id GET ITEM BY ID
router.get('/items/:id', async (req, res) => {
	try {
		const itemId = req.params.id
		const response = await getItemWithUserById(itemId)
		if (response) {
			res.status(200).json(response)
		}
		res.status(404).end()
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

//	/api/items/:id UPDATE ITEM
router.put('/items/:id', async (req, res) => {
	try {
		const authToken = req.headers.authorization
		const id = req.params.id
		const { title, price } = req.body

		const check = validateUpdateItemRequest(title, price)
		if (!check.ok) {
			return res.status(422).json(check)
		}

		const verifiedToken = jwt.verify(authToken, jwtSecretKey)
		if (!verifiedToken.email) {
			return res.status(401).end()
		}

		const response = await updateItemById(
			verifiedToken.email,
			id,
			title,
			price,
		)

		if (response.err === 404) {
			return res.status(404).end()
		} else if (response.err === 403) {
			return res.status(403).end()
		}
		res.status(200).json(response)
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

//	/api/items/:id DELETE ITEM
router.delete('/items/:id', async (req, res) => {
	try {
		const authToken = req.headers.authorization
		const id = req.params.id

		const verifiedToken = jwt.verify(authToken, jwtSecretKey)
		if (!verifiedToken.email) {
			return res.status(401).end()
		}

		const response = await deleteItemById(id, verifiedToken.email)
		if (response.err === 404) {
			return res.status(404).end()
		} else if (response.err === 403) {
			return res.status(403).end()
		}
		res.status(200).end()
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

// /api/items CREATE ITEM
router.post('/items', async (req, res) => {
	try {
		const authToken = req.headers.authorization
		const verifiedToken = jwt.verify(authToken, jwtSecretKey)
		if (!verifiedToken.email) return res.status(401).end()

		const { title, price } = req.body

		const check = validateCreateItemRequest(title, price)
		if (!check.ok) return res.status(422).json(check)

		const response = await createItem(verifiedToken.email, title, price)

		if (!!response.id) {
			return res.status(200).json(response)
		}
		res.status(500).json({ message: 'Server error, try again' })
	} catch (e) {
		res.status(500).json({ message: 'Server error, try again' })
	}
})

//	/api/items/id/image UPLOAD ITEM IMAGE
router.post('/items/:id/images', async (req, res) => {
	try {
		const authToken = req.headers.authorization
		const verifiedToken = jwt.verify(authToken, jwtSecretKey)
		if (!verifiedToken.email) {
			return res.status(401).end()
		}
		if (!req.files) {
			return res.status(422).send([
				{
					field: 'image',
					message: 'No file uploaded',
				},
			])
		}

		let image = req.files.file
		const id = req.params.id
		const imagePath = `../images/${verifiedToken.email}/${image.name}`
		image.mv(imagePath)

		const response = uploadFileImage(imagePath, id, verifiedToken.email)

		if (response.err === 404) {
			return res.status(404).end()
		} else if (response.err === 403) {
			return res.status(403).end()
		}
		res.status(200).json(response)
	} catch (err) {
		res.status(500).send(err)
	}
})

module.exports = router
