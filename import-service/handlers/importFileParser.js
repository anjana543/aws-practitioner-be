const AWS = require('aws-sdk');
const csv = require('csv-parser');
const { BUCKET, REGION } = process.env;

export default async function importFileParser(event) {
  console.log('Parsing started...');
  const s3 = new AWS.S3({ region: REGION });
  const sourceFile = event.Records[0].s3.object.key;

  let parseResults = [];

  const moveParsedFile = async () => {
    try {
      await s3.copyObject({
        Bucket: BUCKET,
        CopySource: BUCKET + '/' + sourceFile,
        Key: sourceFile.replace('uploaded', 'parsed')
      }).promise();

      await s3.deleteObject({
        Bucket: BUCKET,
        Key: sourceFile
      }).promise();

      console.log('File: ' + sourceFile + ' moved to parsed');
    } catch (error) {
      console.error('Error moving parsed file:', error);
      throw error; // Rethrow the error to be caught by the caller
    }
  }

  try {
    const readStream = s3.getObject({ Bucket: BUCKET, Key: sourceFile }).createReadStream();
    readStream.pipe(csv())
      .on('data', (data) => {
        console.log(data);
        parseResults.push(data);
      })
      .on('end', async () => {
        console.log('Parsing finished.');
        await moveParsedFile();
        console.log('Move operation completed.');
      });

    // Wait for parsing and moving operations to complete
    await new Promise((resolve, reject) => {
      readStream.on('error', reject);
      readStream.on('end', resolve);
    });

    return {
      statusCode: 200,
      body: JSON.stringify(parseResults)
    };
  } catch (error) {
    console.error('Error parsing file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
