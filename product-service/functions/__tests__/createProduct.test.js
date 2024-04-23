import { DynamoDB } from 'aws-sdk';
import { createProduct } from './../createProduct';
import { v4 as uuidv4 } from 'uuid';

jest.mock('aws-sdk', () => {
	const mDynamoDB = {
		put: jest.fn().mockReturnThis(),
		promise: jest.fn(),
	};
	return {
		DynamoDB: {
			DocumentClient: jest.fn(() => mDynamoDB),
		},
	};
});

jest.mock('uuid', () => ({
	v4: jest.fn(),
}));

describe('createProduct', () => {
	let mDynamoDB;

	beforeAll(() => {
		jest.spyOn(console, 'info').mockReturnValue();
	});

	beforeEach(() => {
		mDynamoDB = new DynamoDB.DocumentClient();
		process.env.PRODUCTS_TABLE_NAME = 'mockProductsTable';
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.PRODUCTS_TABLE_NAME;
	});

	it('should return 200 when the product is successfully created', async () => {
		const id = '1';
		uuidv4.mockReturnValueOnce(id);

		mDynamoDB.promise.mockResolvedValueOnce({});

		const event = {
			body: JSON.stringify({
				title: 'product',
				price: 10,
			}),
		};
		const response = await createProduct(event);
		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.id).toBe(id);
	});

	it('should return 500 when put operation fails', async () => {
		jest.spyOn(console, 'error').mockReturnValueOnce();

		const id = '1';
		uuidv4.mockReturnValueOnce(id);
		const error = new Error('error');
		mDynamoDB.promise.mockRejectedValueOnce(error);
		const event = {
			body: JSON.stringify({
				title: 'product',
				price: 10,
			}),
		};
		const response = await createProduct(event);
		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body);
		expect(body.error).toBe(`Could not create product: ${error.message}`);
	});
});
