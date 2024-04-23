import AWS from 'aws-sdk';

export const importProductsFile = async (event) => {
	const s3 = new AWS.S3({ region: process.env.REGION, signatureVersion: 'v4' });

	console.info('queryStringParameters', event.queryStringParameters);

	const { name } = event.queryStringParameters;

	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Credentials': true,
	};

	try {
		const params = {
			Bucket: process.env.BUCKET,
			Key: `${process.env.UPLOAD_FOLDER}/${name}`,
			Expires: 60, // Signed URL will be valid for 60 seconds
			ContentType: 'text/csv',
		};

		const signedUrl = await s3.getSignedUrlPromise('putObject', params);

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(signedUrl),
		};
	} catch (error) {
		console.error('Error generating signed S3 URL:', error);

		return {
			statusCode: 500,
			headers,
			body: 'Failed to generate signed URL',
		};
	}
};
