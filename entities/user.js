const { sqlPool } = require('../database/databaseConnection')

const getUserByEmail = async (email) => {
	const user = await sqlPool.execute(
		`SELECT * FROM user WHERE email = '${email}'`,
	)

	return user[0].length ? user[0][0] : {}
}

const isUserExists = async (email) => {
	const user = await getUserByEmail(email)
	return !!user.user_id
}

const addUser = async (name, email, password, phone) => {
	const result = await sqlPool.execute(
		`INSERT user(name,email,password,phone) ` +
			`VALUES ('${name}','${email}','${password}','${phone}')`,
	)
	return result
}
module.exports = { getUserByEmail, addUser, isUserExists }
