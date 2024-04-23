import 'dotenv/config';

export const CORS_HEADER = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
};

export const createResponse = (statusCode, body, headers = CORS_HEADER) => ({ statusCode, headers, body: JSON.stringify(body, null, 2) });
;
