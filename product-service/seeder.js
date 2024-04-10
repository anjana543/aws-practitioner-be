const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-1'
});

const docClient = new AWS.DynamoDB.DocumentClient();

const productData = [
    { 
        id: '4', 
        title: 'Awesome Product 4',
        description: 'This is a great product you need!', 
        price: 19.99 
    },
    { 
        id: '5', 
        title: 'Awesome Product 5',
        description: 'This is a great product you need!', 
        price: 19.99 
    },
    { 
        id: '6', 
        title: 'Amazing Product 6',
        description: 'Another fantastic product!', 
        price: 29.99 
    }
];

const stockData = [
    { 
        product_id: '4', 
        count: 100 
    },
    { 
        product_id: '5', 
        count: 50 
    },
    { 
        product_id: '6', 
        count: 75 
    }
];

const productTableName = 'Products'; 
const stockTableName = 'Stocks'; 


async function createTables() {
    const dynamoDB = new AWS.DynamoDB();

    const params = {
      TableName: productTableName, 
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' } 
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' } 
      ],
      BillingMode: 'PAY_PER_REQUEST' // Use on-demand capacity mode
    };
  
    try {
      await dynamoDB.createTable(params).promise();
      console.log('Products table created successfully!');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.warn('Products table already exists. Skipping creation.');
      } else {
        console.error('Error creating Products table:', error);
      }
    }
  
    const stockParams = {
      TableName: stockTableName,
      AttributeDefinitions: [
        { AttributeName: 'product_id', AttributeType: 'S' } 
      ],
      KeySchema: [
        { AttributeName: 'product_id', KeyType: 'HASH' } 
      ],
      BillingMode: 'PAY_PER_REQUEST' // Use on-demand capacity mode
    };
  
    try {
      await dynamoDB.createTable(stockParams).promise();
      console.log('Stocks table created successfully!');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.warn('Stocks table already exists. Skipping creation.');
      } else {
        console.error('Error creating Stocks table:', error);
      }
    }
}


async function populateTables() {
    try {
        await createTables(); // Create tables if they don't exist
        
        // Add a delay to ensure tables are ready
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        for (const product of productData) {
            await docClient.put({ TableName: productTableName, Item: product }).promise();
        }

        for (const stock of stockData) {
            await docClient.put({ TableName: stockTableName, Item: stock }).promise();
        }

        console.log('Tables populated successfully!');
    } catch (error) {
        console.error('Error populating tables:', error);
    }
}


populateTables();
