import { DynamoDB } from 'aws-sdk';
import { getProductById } from './../getProductById';

jest.mock('aws-sdk', () => {
	const mDynamoDB = {
		get: jest.fn().mockReturnThis(),
		promise: jest.fn(),
	};
	return {
		DynamoDB: {
			DocumentClient: jest.fn(() => mDynamoDB),
		},
	};
});

describe('getProductById', () => {
	let mDynamoDB;

	beforeEach(() => {
		mDynamoDB = new DynamoDB.DocumentClient();
		process.env.PRODUCTS_TABLE_NAME = 'products';
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.PRODUCTS_TABLE_NAME;
	});

	it('should return product data when product exists', async () => {
		const consoleSpy = jest.spyOn(console, 'log').mockReturnValue();

		const id = '1';
		mDynamoDB.promise
			.mockResolvedValueOnce({ Item: { id } })
			.mockResolvedValueOnce({ Item: { count: 10 } });

		const event = { pathParameters: { id } };
		const response = await getProductById(event);

		expect(consoleSpy).toHaveBeenCalledWith('Event pathParameters', event.pathParameters);

		expect(response.statusCode).toBe(200);

		const body = JSON.parse(response.body);
		expect(body.id).toBe(id);
		expect(body.count).toBe(10);

		expect(mDynamoDB.get).toBeCalledWith({ TableName: 'products', Key: { id } });
	});

	it('should return 404 when product not found', async () => {
		const id = '1';
		mDynamoDB.promise.mockResolvedValueOnce({}).mockResolvedValueOnce({});
		const event = { pathParameters: { id } };
		const response = await getProductById(event);
		expect(response.statusCode).toBe(404);
		const body = JSON.parse(response.body);
		expect(body.message).toBe('Product not found');
	});

	it('should return 500 when scan fails', async () => {
		jest.spyOn(console, 'error').mockReturnValueOnce();

		const mError = new Error('network');
		mDynamoDB.promise.mockRejectedValueOnce(mError);

		const event = { pathParameters: { id: 'test' } };

		const response = await await getProductById(event);

		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body);
		expect(body.error).toMatch(/Error retrieving product from DynamoDB/);

		expect(mDynamoDB.get).toBeCalledWith({ TableName: 'products', Key: { id: 'test' } });
	});
});
