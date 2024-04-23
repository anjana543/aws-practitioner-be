import { DynamoDB } from 'aws-sdk';
import { getProductsList } from './../getProductsList';

jest.mock('aws-sdk', () => {
	const mDynamoDB = {
		scan: jest.fn().mockReturnThis(),
		get: jest.fn().mockReturnThis(),
		promise: jest.fn(),
	};
	return {
		DynamoDB: {
			DocumentClient: jest.fn(() => mDynamoDB),
		},
	};
});

describe('getProductsList', () => {
	let mDynamoDB;

	beforeEach(() => {
		mDynamoDB = new DynamoDB.DocumentClient();
		process.env.PRODUCTS_TABLE_NAME = 'products';
		process.env.STOCKS_TABLE_NAME = 'stocks';
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.PRODUCTS_TABLE_NAME;
		delete process.env.STOCKS_TABLE_NAME;
	});

	it('should return 200 and data when scan and get are successful', async () => {
		const mResponse = { Items: [{ id: '1' }] };
		mDynamoDB.promise
			.mockResolvedValueOnce(mResponse)
			.mockResolvedValueOnce({ Item: { count: 10 } });
		const response = await getProductsList();
		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body).toHaveLength(1);
		expect(body[0].count).toBe(10);
		expect(mDynamoDB.scan).toBeCalledWith({ TableName: 'products' });
		expect(mDynamoDB.get).toBeCalledWith({
			TableName: 'stocks',
			Key: {
				product_id: '1',
			},
		});
	});

	it('should return 500 when scan fails', async () => {
		jest.spyOn(console, 'error').mockReturnValueOnce();

		const mError = new Error('network');
		mDynamoDB.promise.mockRejectedValueOnce(mError);
		const response = await getProductsList();
		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body);
		expect(body.error).toMatch(/Error retrieving products from DynamoDB/);

		expect(mDynamoDB.scan).toBeCalledWith({ TableName: 'products' });
	});
});
