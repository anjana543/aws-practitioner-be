import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const getProductById = async (event) => {
	console.log('Event pathParameters', event.pathParameters);

	const { id } = event.pathParameters;

	const productParams = {
		TableName: process.env.PRODUCTS_TABLE_NAME,
		Key: {
			id: id,
		},
	};

	const stockParams = {
		TableName: process.env.STOCKS_TABLE_NAME,
		Key: {
			product_id: id,
		},
	};

	try {
		const productData = await dynamoDB.get(productParams).promise();
		const stockData = await dynamoDB.get(stockParams).promise();

		if (!productData.Item || !stockData.Item) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: 'Product not found' }),
			};
		}

		const resultData = {
			...productData.Item,
			count: stockData.Item.count,
		};

		return {
			statusCode: 200,
			body: JSON.stringify(resultData),
		};
	} catch (error) {
		console.error(`Error retrieving product from DynamoDB: ${error}`);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: `Error retrieving product from DynamoDB: ${error}` }),
		};
	}
};
