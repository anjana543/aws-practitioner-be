import { DynamoDB } from 'aws-sdk';
import { deleteProduct } from './../deleteProduct';

jest.mock('aws-sdk', () => {
	const mDynamoDB = {
		delete: jest.fn().mockReturnThis(),
		promise: jest.fn(),
	};
	return {
		DynamoDB: {
			DocumentClient: jest.fn(() => mDynamoDB),
		},
	};
});

describe('deleteProduct', () => {
	let mDynamoDB;

	beforeAll(() => {
		jest.spyOn(console, 'info').mockReturnValue();
	});

	beforeEach(() => {
		mDynamoDB = new DynamoDB.DocumentClient();
		process.env.PRODUCTS_TABLE_NAME = 'mockProductsTable';
		process.env.STOCKS_TABLE_NAME = 'mockStocksTable';
	});
	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.PRODUCTS_TABLE_NAME;
		delete process.env.STOCKS_TABLE_NAME;
	});

	it('should return 200 when the product is successfully deleted', async () => {
		const id = '1';
		mDynamoDB.promise.mockResolvedValueOnce({}).mockResolvedValueOnce({});
		const event = { pathParameters: { id } };
		const response = await deleteProduct(event);
		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.message).toBe(`Product with id: ${id} deleted`);
	});

	it('should return 500 when delete fails', async () => {
		jest.spyOn(console, 'error').mockReturnValueOnce();

		const id = '1';
		const error = new Error('error');
		mDynamoDB.promise.mockRejectedValueOnce(error);
		const event = { pathParameters: { id } };
		const response = await deleteProduct(event);
		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body);
		expect(body.message).toBe(`Error deleting product with id: ${id}`);
	});
});
