const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME_PRODUCTS = process.env.TABLE_NAME_PRODUCTS;
const TABLE_NAME_STOCKS = process.env.TABLE_NAME_STOCKS;

exports.handler = async (event) => {
    try {
        const params = {
            TableName: TABLE_NAME_PRODUCTS
        };
      
        const products = await dynamoDB.scan(params).promise();

        const enrichedProducts = await Promise.all(
            products.Items.map(async (product) => {
                const stockParams = {
                    TableName: TABLE_NAME_STOCKS,
                    KeyConditionExpression: '#product_id = :product_id',
                    ExpressionAttributeNames: {
                        '#product_id': 'product_id',
                    },
                    ExpressionAttributeValues: {
                        ':product_id': product.id,
                    },
                };

                const stockData = await dynamoDB.query(stockParams).promise();
                const count = stockData.Items.length > 0 ? stockData.Items[0].count : 0;

                return { ...product, count };
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify(enrichedProducts)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching products', error })
        };
    }
};