const AWS = require('aws-sdk');
const { BUCKET, UPLOAD_PATH, REGION } = process.env;

export default async function getSignedUrlForPut(fileName) {
  console.log('fileName: ', fileName);
  const s3 = new AWS.S3({ region: REGION });

  const params = {
    Bucket: BUCKET,
    Key: `${UPLOAD_PATH}${fileName}`,
    Expires: 60,
    ContentType: 'text/csv'
  };

  return new Promise((resolve, reject) => {
    s3.getSignedUrlPromise('putObject', params, (error, url) => {
      console.log('url ', url);

      if (url) {
        resolve({
          statusCode: 200,
          body: JSON.stringify(url)
        });
      } else {
        console.error('Error');
        console.error(error);
        reject({
          statusCode: 500,
          body: JSON.stringify(error)
        });
      }
    })
  })
};
