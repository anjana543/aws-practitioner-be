## Serverless

### Add service template

`sls create --template aws-nodejs --path <folder_name>`

### Deploy to AWS

`sls deploy`

### Remove AWS lambda

`sls remove`

### Invoke function locally

`sls invoke local --function <function_name>`

`sls invoke local --function <function_name> --path <mock.json>`

`sls invoke local --function <function_name> --data '{"pathParameters":{"id":"7567ec4b-b10c-48c5-9345-fc73c48a80a2"}}'`

#### To suppress the warning caused by Webpack

`sls invoke local -f <function_name> --path <mock.json> |& grep -v "More than one matching handlers found"`

## DynamoDB

### Show table config

`aws dynamodb describe-table --table-name <table_name>`

#### GET

`aws dynamodb scan --table-name <table_name>`

#### PUT

`aws dynamodb put-item --table-name <table_name>` --item '{ "id": {"N": "1"}, "title": {"S": "Test"} }'
