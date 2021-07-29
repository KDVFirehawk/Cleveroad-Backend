const mysql = require('mysql2')
const sqlPool = mysql
	.createPool({
		connectionLimit: 5,
		host: 'localhost',
		user: 'kdvfirehawk',
		database: 'cleveroadtesttask',
		password: 'kdvfirehawk',
	})
	.promise()

module.exports = { sqlPool }
