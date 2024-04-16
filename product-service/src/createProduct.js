const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME_PRODUCTS = process.env.TABLE_NAME_PRODUCTS;
const TABLE_NAME_STOCKS = process.env.TABLE_NAME_STOCKS;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': true,
};

exports.handler = async (event) => {
    try {
        console.log('Incoming request:', JSON.stringify(event));

        const requestBody = JSON.parse(event.body);
        const { title, description, price } = requestBody;

        // Check if all required product data is provided
        if (!title || !description || !price) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing required product data' }),
            };
        }

        if (typeof title !== 'string' || typeof description !== 'string' || isNaN(price) || price <= 0) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid product data (title, description, price)' }),
            };
        }

        const productId = uuid.v4();
        const stockId = uuid.v4();

        // Prepare the transaction request
        const transactParams = {
            TransactItems: [
                {
                    Put: {
                        TableName: TABLE_NAME_PRODUCTS,
                        Item: {
                            id: productId,
                            title: title,
                            description: description,
                            price: price,
                        },
                    },
                },
                {
                    Put: {
                        TableName: TABLE_NAME_STOCKS,
                        Item: {
                            id: stockId,
                            product_id: productId,
                            quantity: 0, 
                        },
                        ConditionExpression: 'attribute_not_exists(id)', // Ensure stock item doesn't already exist
                    },
                },
            ],
        };

        // Execute the transaction
        await dynamoDB.transactWrite(transactParams).promise();

        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({ id: productId }),
        };
    } catch (error) {
        console.error('Error creating product:', error);
        let errorMessage = 'Internal server error';

        // Provide more specific error messages based on error codes
        if (error.code === 'ValidationError') {
            errorMessage = 'Invalid product data. Please check your input.';
        } else if (error.code === 'ResourceNotFoundException') {
            errorMessage = 'Table not found. Please verify table names.';
        } else if (error.code === 'TransactionCanceledException') {
            errorMessage = 'Transaction failed: ' + JSON.stringify(error.cancellationReasons);
        } else if (error.requestId) {
            errorMessage = `Error creating product (requestId: ${error.requestId}).`;
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: errorMessage }),
        };
    }
};
