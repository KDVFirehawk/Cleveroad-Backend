const validateUpdateItemRequest = (title, price) => {
	if (!price && !title)
		return [
			{
				field: 'title',
				message: 'Title should contain at least 3 characters',
			},
			{
				field: 'price',
				message: 'Price should be a positive number',
			},
		]
	if (!!title && title.length < 3) {
		return [
			{
				field: 'title',
				message: 'Title should contain at least 3 characters',
			},
		]
	}
	if (!!price && (Number.isNaN(+price) || price < 0)) {
		return [
			{
				field: 'price',
				message: 'Price should be a positive number',
			},
		]
	}
	return { ok: true }
}

const validateCreateItemRequest = (title, price) => {
	if (!!title && !!price) {
		if (title.length < 3) {
			return [
				{
					field: 'title',
					message: 'Title should contain at least 3 characters',
				},
			]
		}
		if (Number.isNaN(+price) || price < 0) {
			return [
				{
					field: 'price',
					message: 'Price should be a positive number',
				},
			]
		}
		return { ok: true }
	}
	return [
		{
			field: 'title',
			message: 'Title is required',
		},
		{
			field: 'price',
			message: 'Price is required',
		},
	]
}
module.exports = { validateUpdateItemRequest, validateCreateItemRequest }
