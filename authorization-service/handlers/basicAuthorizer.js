'use strict';

export const handler = async (event, ctx, cb) => {
  const { type, authorizationToken } = event;
  if (type === 'REQUEST') cb('Unauthorized');

  try {
    const [, encodedCredentials] = authorizationToken.split(' ');
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    const storedPassword = process.env[username];

    const access = !storedPassword || storedPassword !== password ? 'Deny' : 'Allow';
    const policy = generatePolicy(encodedCredentials, event.methodArn, access);

    cb(null, policy);
  } catch (error) {
    cb(`Unauthorized: ${error.message}`);
  }
};

const generatePolicy = (principalId, resource, access = 'Allow') => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: access, Resource: resource }],
    },
  };
};
