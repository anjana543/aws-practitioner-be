import AWS from 'aws-sdk';
import { importProductsFile } from './../importProductsFile';

jest.mock('aws-sdk', () => {
	const mS3 = {
		getSignedUrlPromise: jest.fn(),
	};

	return {
		S3: jest.fn(() => mS3),
	};
});

describe('importProductsFile', () => {
	const MOCK_FILE = 'http://example.com/upload';

	beforeAll(() => {
		jest.spyOn(console, 'info').mockImplementation();
		jest.spyOn(console, 'error').mockImplementation();
	});

	beforeEach(() => {
		AWS.S3().getSignedUrlPromise.mockImplementation(() => {
			return Promise.resolve(MOCK_FILE);
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return signed URL for putObject operation', async () => {
		const event = {
			queryStringParameters: {
				name: 'test.csv',
			},
		};

		const response = await importProductsFile(event);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toEqual(MOCK_FILE);
	});

	it('should return error when there is an error while getting signed URL', async () => {
		AWS.S3().getSignedUrlPromise.mockImplementation(() => {
			return Promise.reject('Failed to generate signed URL');
		});

		const event = {
			queryStringParameters: {
				name: 'test.csv',
			},
		};

		const response = await importProductsFile(event);
		expect(response.statusCode).toBe(500);
		expect(response.body).toEqual('Failed to generate signed URL');
	});
});
