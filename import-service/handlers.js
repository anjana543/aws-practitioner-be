'use strict';

import processProductsFile from './handlers/importProductsFile';
import fileParser from './handlers/importFileParser';

const defaultHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};

const serverError = (error) => {
  return {
    statusCode: 400,
    body: error
  }
}

export const importProductsFile = async (event) => {
  try {
    console.log('event: ', event);
    const { name } = await event.queryStringParameters;
    const result = await processProductsFile(name);
    console.log('result: ', result);
    result.headers = defaultHeaders;
    return result;
  } catch (error) {
    return serverError(error);
  }
};

export const importFileParser = async (event) => {
  try {
    const result = await fileParser(event);
    result.headers = defaultHeaders;
    console.log('result: ', result);
    return result;
  } catch (error) {
    return serverError(error);
  }
};
