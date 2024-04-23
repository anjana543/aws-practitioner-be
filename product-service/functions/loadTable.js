const AWS = require('aws-sdk');
const fs = require('fs').promises;

AWS.config.update({
    region: 'ap-south-1' 
});

const docClient = new AWS.DynamoDB.DocumentClient();

const productTableName = 'products';
const stockTableName = 'stocks';

async function createTables() {
    const dynamoDB = new AWS.DynamoDB();

    // Define table creation parameters
    const productParams = {
        TableName: productTableName,
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' } 
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' } 
        ],
        BillingMode: 'PAY_PER_REQUEST' 
    };

    const stockParams = {
        TableName: stockTableName,
        AttributeDefinitions: [
            { AttributeName: 'product_id', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'product_id', KeyType: 'HASH' } 
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        // Create tables if they don't exist
        await dynamoDB.createTable(productParams).promise();
        await dynamoDB.createTable(stockParams).promise();
        console.log('Tables created successfully!');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.warn('Tables already exist. Skipping creation.');
        } else {
            console.error('Error creating tables:', error);
        }
    }
}

async function populateTables() {
    try {
        await createTables(); // Create tables if they don't exist

        // Read mock data from JSON files
        const productsData = await fs.readFile('mocks/products.json', 'utf8');
        const stocksData = await fs.readFile('mocks/stocks.json', 'utf8');

        const products = JSON.parse(productsData);
        const stocks = JSON.parse(stocksData);

        // Add a delay to ensure tables are ready
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Populate Products table
        for (const product of products) {
            await docClient.put({ TableName: productTableName, Item: product }).promise();
        }

        // Populate Stocks table
        for (const stock of stocks) {
            await docClient.put({ TableName: stockTableName, Item: stock }).promise();
        }

        console.log('Tables populated successfully!');
    } catch (error) {
        console.error('Error populating tables:', error);
    }
}

populateTables();
