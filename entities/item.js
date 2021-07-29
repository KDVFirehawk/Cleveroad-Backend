const { sqlPool } = require('../database/databaseConnection')
const { getUserByEmail } = require('../entities/user')

const getItemsWithUsers = async () => {
	const itemsWithUsers = await sqlPool.execute(
		`SELECT * FROM items ` +
			`INNER JOIN user ON items.userId = user.user_id`,
	)
	const response = itemsWithUsers[0].map((item) => {
		return {
			id: item.item_id,
			created_at: item.created_at,
			title: item.title,
			price: item.price.toFixed(2),
			image: item.image,
			user_id: item.user_id,
			user: {
				id: item.user_id,
				phone: item.phone,
				name: item.name,
				email: item.email,
			},
		}
	})
	return response
}

const getItemWithUserById = async (itemId) => {
	const itemsWithUsers = await sqlPool.execute(
		`SELECT * FROM items ` +
			`INNER JOIN user ON items.userId = user.user_id WHERE items.item_id = ${itemId}`,
	)
	const response = (item) => {
		try {
			return {
				id: item.item_id,
				created_at: item.created_at,
				title: item.title,
				price: item.price.toFixed(2),
				image: item.image,
				user_id: item.userId,
				user: {
					id: item.user_id,
					phone: item.phone,
					name: item.name,
					email: item.email,
				},
			}
		} catch (e) {
			return false
		}
	}
	return response(itemsWithUsers[0][0])
}

const updateItemById = async (email, id, title, price) => {
	const user = await getUserByEmail(email)
	const item = await getItemWithUserById(id)

	if (!item.id) return { err: 404 }

	if (user.user_id !== item.user_id) return { err: 403 }

	let newTitle = item.title
	let newPrice = item.price
	if (title) newTitle = title
	if (price) newPrice = price

	const query =
		`UPDATE items SET items.title='${newTitle}', items.price=${newPrice}` +
		` WHERE items.item_id = ${id}`
	await sqlPool.execute(query)
	return await getItemWithUserById(id)
}

const deleteItemById = async (id, email) => {
	const user = await getUserByEmail(email)
	const item = await getItemWithUserById(id)

	if (!item.id) {
		return { err: 404 }
	}

	if (user.user_id !== item.user_id) {
		return { err: 403 }
	}

	const query = `DELETE FROM items WHERE items.item_id =${id}`
	await sqlPool.execute(query)
	return { ok: true }
}

const createItem = async (email, title, price) => {
	const user = await getUserByEmail(email)

	const date = Math.floor(Date.now() / 1000)
	const newItem = {
		title,
		price,
		created_at: date,
		user_id: user.user_id,
	}

	const query =
		`INSERT items(title, price, created_at, userId) ` +
		`VALUES ('${newItem.title}', ${newItem.price}, ${newItem.created_at}, ${newItem.user_id})`

	const result = await sqlPool.execute(query)

	return await getItemWithUserById(result[0].insertId)
}

const uploadFileImage = async (path, id, email) => {
	const user = await getUserByEmail(email)
	const item = await getItemWithUserById(id)

	if (!item.id) return { err: 404 }

	if (user.user_id !== item.user_id) return { err: 403 }

	let newImage = item.image
	if (path) newImage = path

	const query =
		`UPDATE items SET items.image='${newImage}'` +
		` WHERE items.item_id = ${id}`
	await sqlPool.execute(query)
	return await getItemWithUserById(id)
}

module.exports = {
	getItemsWithUsers,
	getItemWithUserById,
	updateItemById,
	deleteItemById,
	createItem,
	uploadFileImage,
}
