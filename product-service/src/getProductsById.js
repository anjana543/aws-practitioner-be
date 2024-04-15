const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME_PRODUCTS = process.env.TABLE_NAME_PRODUCTS;
const TABLE_NAME_STOCKS = process.env.TABLE_NAME_STOCKS;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event) => {
    try {
        const { productId } = event.pathParameters;
        
        const product = await dynamoDB.get({ 
            TableName: TABLE_NAME_PRODUCTS,
            Key: { id: productId }
        }).promise();

        // Implement logic to fetch stock data for the product
        const stock = await dynamoDB.get({ 
            TableName: TABLE_NAME_STOCKS,
            Key: { product_id: productId }
        }).promise();
        
        // Combine product data with stock count
        const productWithStock = {
            ...product.Item,
            count: stock.Item ? stock.Item.count : 0
        };

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(productWithStock),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error fetching product', error }),
        };
    }
};
