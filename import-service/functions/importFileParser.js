import { S3, SQS } from 'aws-sdk';
import csv from 'csv-parser';
import { finished } from 'stream/promises';

export const importFileParser = async (event) => {
	const s3 = new S3({ region: process.env.REGION });
	const sqs = new SQS();

	for (const record of event.Records) {
		const originalKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
		const parsedKey = originalKey.replace(process.env.UPLOAD_FOLDER, process.env.PARSE_FOLDER);
		const params = {
			Bucket: record.s3.bucket.name,
			Key: originalKey,
		};

		const s3Stream = s3.getObject(params).createReadStream();

		s3Stream.pipe(csv()).on('data', async (data) => {
			await sqs
				.sendMessage({
					QueueUrl: process.env.SQS_URL,
					MessageBody: JSON.stringify(data),
				})
				.promise();
		});

		await finished(s3Stream);

		console.info(`CSV file processing completed. Moving the file to parsed folder`);

		try {
			await s3
				.copyObject({
					Bucket: params.Bucket,
					CopySource: `${params.Bucket}/${originalKey}`,
					Key: parsedKey,
				})
				.promise();

			console.info(`Successfully copied the file to ${parsedKey}`);

			await s3.deleteObject(params).promise();
			console.info(`Successfully deleted the original file ${originalKey}`);
		} catch (error) {
			console.error('Error during file moving', error);
		}
	}
};
