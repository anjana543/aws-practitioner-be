import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const deleteProduct = async (event) => {
	console.info('Event pathParameters', event.pathParameters);

	const { id } = event.pathParameters;

	const productParams = {
		TableName: process.env.PRODUCTS_TABLE_NAME,
		Key: {
			id,
		},
	};

	const stocksParams = {
		TableName: process.env.STOCKS_TABLE_NAME,
		Key: {
			product_id: id,
		},
	};

	try {
		await Promise.all([
			dynamoDB.delete(productParams).promise(),
			dynamoDB.delete(stocksParams).promise(),
		]);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: `Product with id: ${id} deleted` }),
		};
	} catch (error) {
		console.error('Error deleting product: ', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: `Error deleting product with id: ${id}` }),
		};
	}
};
