import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import products from '../mocks/products.json';

const dynamoDB = new DynamoDB.DocumentClient();

const productSchema = Joi.object({
	title: Joi.string().required(),
	description: Joi.string().allow(''),
	price: Joi.number().integer().required(),
	image: Joi.string(),
}).required();

const stockSchema = Joi.object({
	count: Joi.number().integer().required(),
}).required();

const combinedSchema = productSchema.concat(stockSchema).required();

export const loadData = async () => {
	for (const product of products) {
		const { title, description, image, price, count } = product;

		const { error } = combinedSchema.validate(product);

		if (error) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: error.details[0].message }),
			};
		}

		const id = uuidv4();

		const productParams = {
			TransactItems: [
				{
					Put: {
						TableName: process.env.PRODUCTS_TABLE_NAME,
						Item: {
							id,
							title,
							description,
							image,
							price,
						},
					},
				},
				{
					Put: {
						TableName: process.env.STOCKS_TABLE_NAME,
						Item: {
							product_id: id,
							count,
						},
					},
				},
			],
		};

		try {
			await dynamoDB.transactWrite(productParams).promise();
		} catch (error) {
			console.error(`Error inserting into products & stocks tables: ${error}`);
			return {
				statusCode: 500,
				body: JSON.stringify({ error: `Could not create product: ${error.message}` }),
			};
		}
	}

	return {
		statusCode: 200,
		body: 'Products loaded successfully',
	};
};
