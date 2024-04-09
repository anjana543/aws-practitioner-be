const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME_PRODUCTS = process.env.TABLE_NAME_PRODUCTS;
const TABLE_NAME_STOCKS = process.env.TABLE_NAME_STOCKS;

exports.handler = async (event) => {
    const { title, description, price, count } = JSON.parse(event.body);

    try {
        console.log('Incoming request:', JSON.stringify(event));

        // Validate product data
        if (!title || !description || !price || isNaN(price) || price <= 0 || isNaN(count) || count < 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*', 
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: 'Invalid product data' }),
            };
        }

        const productId = uuid.v4();

        // Begin a transaction
        const transactionParams = {
            TransactItems: [
                {
                    Put: {
                        TableName: TABLE_NAME_PRODUCTS,
                        Item: {
                            id: productId,
                            title: title,
                            description: description,
                            price: price
                        },
                        ConditionExpression: 'attribute_not_exists(id)' // Ensure the product ID doesn't already exist
                    }
                },
                {
                    Put: {
                        TableName: TABLE_NAME_STOCKS,
                        Item: {
                            product_id: productId,
                            count: count
                        }
                    }
                }
            ]
        };

        await dynamoDB.transactWrite(transactionParams).promise();

        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ id: productId }),
        };
    } catch (error) {
        console.error('Error:', error);

        if (error.code === 'TransactionCanceledException' && error.cancellationReasons) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*', 
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: 'Transaction failed', error }),
            };
        }

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
