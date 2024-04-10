const AWS = require('aws-sdk');

const { BUCKET, UPLOAD_PATH, REGION } = process.env;

export default async function getSignedUrlForPut(fileName) {
  console.log('fileName: ', fileName);

  const s3 = new AWS.S3({ region: REGION });

  try {
    const statusCode = 200;

    const params = {
      Bucket: BUCKET,
      Key: `${UPLOAD_PATH}/${fileName}`,
      Expires: 60,
      ContentType: 'text/csv'
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    console.log('url ', url);

    return {
      statusCode: statusCode,
      body: JSON.stringify(url)
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
}
