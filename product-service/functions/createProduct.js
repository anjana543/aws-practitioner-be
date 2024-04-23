import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

const dynamoDB = new DynamoDB.DocumentClient();

const schema = Joi.object({
	title: Joi.string().required(),
	description: Joi.string().allow(''),
	price: Joi.number().integer().required(),
	image: Joi.string(),
}).required();

// validate and insert data into the database
export const addProduct = async (productData) => {
	const { title, description, image, price } = productData;

	const params = {
		TableName: process.env.PRODUCTS_TABLE_NAME,
		Item: {
			id: uuidv4(),
			title,
			description,
			image,
			price,
		},
	};

	await dynamoDB.put(params).promise();

	return params.Item;
};

export const createProduct = async (event) => {
	console.info('Request body', event.body);

	const parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

	const { error } = schema.validate(parsedBody);

	if (error) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: error.details[0].message }),
		};
	}

	try {
		const createdProduct = await addProduct(parsedBody);

		return {
			statusCode: 200,
			body: JSON.stringify(createdProduct),
		};
	} catch (error) {
		console.error(`Error inserting into products table: ${error}`);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: `Could not create product: ${error.message}` }),
		};
	}
};
