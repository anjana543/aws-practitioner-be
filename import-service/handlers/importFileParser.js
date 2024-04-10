const AWS = require('aws-sdk');
const csv = require('csv-parser');

const { BUCKET, REGION } = process.env;

export default async function importFileParser(event) {
  console.log('event: ', event);

  const s3 = new AWS.S3({ region: REGION });

  const sourceFile = event.Records[0].s3.object.key;

  try {
    const parseResults = [];

    const bucketParams = {
      Bucket: BUCKET,
      Key: sourceFile
    };

    // Define a function to move the parsed file
    const moveParsedFile = async () => {
      const parsedKey = sourceFile.replace('uploaded', 'parsed');

      await s3.copyObject({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${sourceFile}`,
        Key: parsedKey
      }).promise();

      await s3.deleteObject({
        Bucket: BUCKET,
        Key: sourceFile
      }).promise();

      console.log(`File: ${sourceFile} moved to parsed`);
    };

    // Read the CSV file from S3, parse it, and move the parsed file
    await new Promise((resolve, reject) => {
      s3.getObject(bucketParams)
        .createReadStream()
        .pipe(csv())
        .on('data', (data) => {
          console.log(data);
          parseResults.push(data);
        })
        .on('end', async () => {
          console.log(parseResults);
          await moveParsedFile();
          resolve();
        })
        .on('error', (error) => {
          console.error(error);
          reject(error);
        });
    });

    // Return the parsed results
    return {
      statusCode: 200,
      body: JSON.stringify(parseResults)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
