const AWS = require('aws-sdk');
const csv = require('csv-parser');
const { BUCKET, REGION } = process.env;

export default async function importFileParser(event) {
  const s3 = new AWS.S3({ region: REGION });
  const sourceFile = event.Records[0].s3.object.key;

  let parseResults = [];

  const bucketParams = {
    Bucket: BUCKET,
    Key: sourceFile
  };

  const moveParsedFile = async () => {
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
  }

  const putToSQS = (items) => {
    const sqs = new AWS.SQS();

    items.forEach(item => {
      const sqsParams = {
        DelaySeconds: 2,
        MessageBody: JSON.stringify(item),
        QueueUrl: process.env.SQS_URL,
      };
      sqs.sendMessage(sqsParams, function (error, data) {
        if (error) {
          console.error("Adding to SQS - Error: ", error);
        } else {
          console.log("Adding to SQS - Success: ", data.MessageId);
        }
      })
    });

  }

  try {
    const readStream = s3.getObject(bucketParams).createReadStream().pipe(csv())
      .on('data', (data) => {
        parseResults.push(data)
      })
      .on('end', () => {
        putToSQS(parseResults);
        moveParsedFile();
      });
    return {
      statusCode: 200,
      body: JSON.stringify(parseResults)
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: error
    };
  }
}
