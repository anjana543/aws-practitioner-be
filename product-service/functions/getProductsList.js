import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const getProductsList = async () => {
	const params = {
		TableName: process.env.PRODUCTS_TABLE_NAME,
	};

	try {
		const data = await dynamoDB.scan(params).promise();

		const productData = data.Items;

		const fullProductData = await Promise.all(
			productData.map(async (product) => {
				const stockParams = {
					TableName: process.env.STOCKS_TABLE_NAME,
					Key: {
						product_id: product.id,
					},
				};

				const stockData = await dynamoDB.get(stockParams).promise();

				return {
					...product,
					count: stockData.Item ? stockData.Item.count : 0,
				};
			})
		);

		return {
			statusCode: 200,
			body: JSON.stringify(fullProductData),
		};
	} catch (error) {
		console.error(`Error retrieving products from DynamoDB: ${error}`);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: `Error retrieving products from DynamoDB: ${error}` }),
		};
	}
};
