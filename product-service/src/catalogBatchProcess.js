const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS({ region: 'us-east-1' });

async function createProduct(productData) {
  try {
    await docClient.put({
      TableName: process.env.TABLE_NAME_PRODUCTS,
      Item: productData,
    }).promise();
    console.log("Created product:", productData.id);
  } catch (error) {
    console.error("Error creating product:", productData.id, error);
    throw error;
  }
}

async function sendProductCreationNotification(message) {
  const params = {
    Message: message,
    TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
  };

  try {
    await sns.publish(params).promise();
    console.log("Sent product creation notification:", message);
  } catch (error) {
    console.error("Error sending product creation notification:", error);
    throw error;
  }
}

module.exports = {
  handler: async (event) => {
    try {
      console.log("Processing SQS messages:", event.Records.length);

      for (const record of event.Records) {
        const productData = JSON.parse(record.body);
        await createProduct(productData);
      }

      // Send notification after processing all messages (assuming successful processing)
      const message = `Successfully created ${event.Records.length} products.`;
      await sendProductCreationNotification(message);

      return {
        statusCode: 200,
        body: 'Successfully processed SQS messages.',
      };
    } catch (error) {
      console.error("Error processing SQS messages:", error);
      throw error;
    }
  },
  createProduct: createProduct,
  sendProductCreationNotification: sendProductCreationNotification,
};
