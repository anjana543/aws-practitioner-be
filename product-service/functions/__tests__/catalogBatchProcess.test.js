import { catalogBatchProcess } from '../catalogBatchProcess';
import { addProduct } from '../createProduct';
import AWS from 'aws-sdk';

jest.mock('./../createProduct', () => ({
	addProduct: jest.fn(),
}));

jest.mock('aws-sdk', () => {
	const mockedSNS = {
		publish: jest.fn().mockReturnThis(),
		promise: jest.fn(),
	};

	return {
		SNS: jest.fn(() => mockedSNS),
	};
});

describe('catalogBatchProcess', () => {
	const mockProductData = { id: '1', title: 'Test' };

	const mockEvent = {
		Records: [
			{
				body: JSON.stringify(mockProductData),
			},
		],
	};

	beforeAll(() => {
		jest.spyOn(console, 'error').mockImplementation();
	});

	beforeEach(() => {
		process.env.SNS_TOPIC_ARN = 'test-topic-arn';
		process.env.REGION = 'ap-south-1';
	});

	afterEach(() => {
		delete process.env.SNS_TOPIC_ARN;
		delete process.env.REGION;
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should create product and publish a message to SNS topic', async () => {
		addProduct.mockResolvedValue(mockProductData);

		const mockedSns = new AWS.SNS();

		await catalogBatchProcess(mockEvent);

		expect(addProduct).toHaveBeenCalledWith(mockProductData);

		expect(mockedSns.publish).toHaveBeenCalledWith({
			Subject: 'A new product was created in the shop',
			Message: `Product was created:\n${JSON.stringify(mockProductData, null, 2)}`,
			MessageAttributes: {
				event: {
					DataType: 'String',
					StringValue: 'ProductCreated',
				},
			},
			TopicArn: process.env.SNS_TOPIC_ARN,
		});

		expect(mockedSns.publish().promise).toHaveBeenCalled();
	});

	it('should handle error if product creation fails', async () => {
		const errorMock = new Error('product creation error');
		addProduct.mockRejectedValue(errorMock);

		jest.spyOn(console, 'error');

		await catalogBatchProcess(mockEvent);

		expect(console.error).toHaveBeenCalledWith(
			'Error creating product: product creation error'
		);

		jest.restoreAllMocks();
	});
});
