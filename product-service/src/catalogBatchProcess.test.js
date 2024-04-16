const { handler, createProduct, sendProductCreationNotification } = require('./catalogBatchProcess');

describe('catalogBatchProcess', () => {
  const mockEvent = {
    Records: [
      { body: JSON.stringify({ id: 'product1', name: 'Product 1' }) },
      { body: JSON.stringify({ id: 'product2', name: 'Product 2' }) },
    ],
  };

  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  jest.mock('aws-sdk', () => ({
    config: { region: 'us-east-1' }, 
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        put: jest.fn().mockReturnThis(),
        promise: jest.fn().mockResolvedValue({}), 
      })),
    },
    SNS: jest.fn(() => ({ 
      publish: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    })),
  }));

  beforeEach(() => {
    process.env.TABLE_NAME_PRODUCTS = 'Products';
    process.env.CREATE_PRODUCT_TOPIC_ARN = 'test-topic-arn';
    process.env.REGION = 'us-east-1';

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.TABLE_NAME_PRODUCTS;
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;
  });

  // Test createProduct function
  test('createProduct function creates products successfully', async () => {
    const mockProductData = { id: 'product1', name: 'Product 1' };
    await createProduct(mockProductData);
    expect(consoleLogSpy).toHaveBeenCalledWith("Mock creating product:", mockProductData.id);
  });

  test('sendProductCreationNotification function sends product creation notification successfully', async () => {
    const mockMessage = "Successfully created 2 products.";
    await sendProductCreationNotification(mockMessage);
    expect(consoleLogSpy).toHaveBeenCalledWith("Sent product creation notification:", mockMessage);
  });

  test('handler function processes SQS messages and calls createProduct and sendProductCreationNotification', async () => {
    await handler(mockEvent);

    expect(createProduct).toHaveBeenCalledTimes(mockEvent.Records.length);

    expect(sendProductCreationNotification).toHaveBeenCalledTimes(1);

    expect(consoleLogSpy).toHaveBeenCalledTimes(mockEvent.Records.length + 1);
  });
});
