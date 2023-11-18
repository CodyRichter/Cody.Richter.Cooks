import uuid
import boto3
import zipfile
import os
import json

# AWS Credentials Setup
aws_access_key_id = os.environ.get('AWS_KEY')
aws_secret_access_key = os.environ.get('AWS_SECRET')
aws_region = 'us-east-1'

# Resource Path Setup
local_function_directory = 'src/lambdas/'
target_zip_file_name = f'build/lambdas.zip'


# Initialize Boto3 clients
lambda_client = boto3.client('lambda', region_name=aws_region)
apigateway_client = boto3.client('apigateway')
s3_client = boto3.client('s3', region_name=aws_region)
sts_client = boto3.client('sts')
iam_client = boto3.client('iam')
logs_client = boto3.client('logs')
dynamodb_client = boto3.client('dynamodb', region_name=aws_region)


# Get AWS account ID
aws_account_id = sts_client.get_caller_identity()['Account']

# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
#                   AWS DynamoDB Setup
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

table_name = 'Recipes'

key_schema = [{'AttributeName': 'name', 'KeyType': 'HASH'}]
attribute_definitions = [{'AttributeName': 'name', 'AttributeType': 'S'}]

try:
    dynamodb_client.describe_table(TableName=table_name)
    print(f"DynamoDB table '{table_name}' exist, skipping creation...")
except dynamodb_client.exceptions.ResourceNotFoundException:
    print(f"DynamoDB table '{table_name}' does not exist, creating...")
    dynamodb_client.create_table(
        TableName=table_name,
        KeySchema=key_schema,
        AttributeDefinitions=attribute_definitions,
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"DynamoDB table '{table_name}' created successfully!")

# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
#                   AWS Lambda Setup
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 


# Create s3 bucket if it doesn't exist
upload_bucket_name = f'cody-richter-cooks-{str(uuid.uuid4())}'
s3_client.create_bucket(Bucket=upload_bucket_name)

# Create build directory if it doesn't exist
if not os.path.exists('build'):
    os.makedirs('build')

# Create zip file with all the code and upload to S3
s3_lambdas_object_name = 'lambdas.zip'
with zipfile.ZipFile(target_zip_file_name, 'w') as zipf:
    for root, dirs, files in os.walk(local_function_directory):
        for file in files:
            zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), local_function_directory))
s3_client.upload_file(target_zip_file_name, upload_bucket_name, s3_lambdas_object_name)


# Create or update the Lambda functions
lambda_operations = [{'name': 'create', "method": 'PUT'}, {'name': 'get', "method": 'GET'}, {'name': 'delete', "method": 'DELETE'}]
for lambda_operation in lambda_operations:
    handler_name = f'handlers.{lambda_operation["name"]}_handler'
    function_name = f'{lambda_operation["name"]}-recipe-lambda'

    # Create or update the Lambda function
    try:
        # If the Lambda function exists, update it
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            S3Bucket=upload_bucket_name,
            S3Key=s3_lambdas_object_name
        )
        print(f'Lambda function {lambda_operation["name"]} updated successfully!')
    except lambda_client.exceptions.ResourceNotFoundException:
        # If the Lambda function doesn't exist, create it
        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.9',
            Role=f'arn:aws:iam::{aws_account_id}:role/{role_name}',
            Handler=handler_name,
            Code={
                'S3Bucket': upload_bucket_name,
                'S3Key': s3_lambdas_object_name
            },
            Description=f'CodyRichterCooks Lambda Handler for {lambda_operation["name"]}',
            Timeout=10,  # Timeout in seconds
            MemorySize=128  # Memory in MB
        )
        print(f"Lambda function {function_name} created successfully!")

    # Name of the log group associated with your Lambda function
    log_group_name = f'/aws/lambda/{function_name}'
    try:
        logs_client.create_log_group(logGroupName=log_group_name)
        print(f"Log group '{log_group_name}' created.")
    except logs_client.exceptions.ResourceAlreadyExistsException:
        print(f"Log group '{log_group_name}' already exists.")

    retention_days = 7
    logs_client.put_retention_policy(
        logGroupName=log_group_name,
        retentionInDays=retention_days
    )
    print(f'Lambda function {function_name} log retention policy set to {retention_days} days')


# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
#                   AWS API Gateway Setup
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

api_name = 'CodyRichterCooksAPI'
resource_name = "recipes"

# Create the API Gateway
existing_rest_apis = apigateway_client.get_rest_apis()

# Find the API by name
rest_api_id = None
for api in existing_rest_apis['items']:
    if api['name'] == api_name:
        rest_api_id = api['id']
        print(f"API Gateway {api_name} exists with id {rest_api_id}, skipping creation...")
        break

if rest_api_id is None:
    # If the API Gateway doesn't exist, create it
    response = apigateway_client.create_rest_api(
        name=api_name,
        endpointConfiguration={
            'types': ['REGIONAL']
        },
        description='CodyRichterCooks API Gateway'
    )
    print(f"API Gateway {api_name} created successfully!")
    rest_api_id = response['id']


# Create the API Gateway resource for Recipes
resources = apigateway_client.get_resources(restApiId=rest_api_id)
root_resource_id = next(res['id'] for res in resources['items'] if res['path'] == '/')

# Try to find the resource by name, otherwise create it
recipe_resource_id = next((resource['id'] for resource in resources['items'] if resource and 'pathPart' in resource and resource['pathPart'] == resource_name), None)
if not recipe_resource_id:
    response = apigateway_client.create_resource(
        restApiId=rest_api_id,
        parentId=root_resource_id,
        pathPart=resource_name,
    )
    recipe_resource_id = response['id']
    print(f'API Gateway resource "{resource_name}" created successfully!')
else:
    print(f'API Gateway resource {resource_name} exists, skipping creation...')

# Create the API Gateway methods and integrations for the Lambda functions
for api_operation in lambda_operations:
    try:
        apigateway_client.get_method(
            restApiId=rest_api_id,
            resourceId=recipe_resource_id,
            httpMethod=api_operation["method"]
        )
        print(f'API Gateway method {api_operation["method"]} exists, skipping creation...')
    except apigateway_client.exceptions.NotFoundException:
        # Create a method for the resource and connect it to the Lambda integration
        method_response = apigateway_client.put_method(
            restApiId=rest_api_id,
            resourceId=recipe_resource_id,
            httpMethod=api_operation["method"],
            authorizationType='NONE',
            apiKeyRequired=False,
        )

        integration_response = apigateway_client.put_integration(
            restApiId=rest_api_id,
            resourceId=recipe_resource_id,
            httpMethod=api_operation["method"],
            type='AWS_PROXY',
            integrationHttpMethod="POST",
            uri=f"arn:aws:apigateway:{aws_region}:lambda:path/2015-03-31/functions/arn:aws:lambda:{aws_region}:{aws_account_id}:function:{api_operation['name']}-recipe-lambda/invocations"
        )
        print(f'API Gateway method {api_operation["method"]} created successfully!')

# Deploy the API
deployment_response = apigateway_client.create_deployment(
    restApiId=rest_api_id,
    stageName='Prod'
)
print(f'API Gateway {api_name} deployed successfully!')



# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
#                   AWS IAM Setup
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

role_name = 'CodyRichterCooksLambdaRole'

assume_role_policy_document = json.dumps({
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
})

try:
    existing_role = iam_client.get_role(RoleName=role_name)
    role_exists = True
except iam_client.exceptions.NoSuchEntityException:
    role_exists = False

if role_exists:
    # If the role exists, update its assume role policy
    iam_client.update_assume_role_policy(
        RoleName=role_name,
        PolicyDocument=assume_role_policy_document,
    )
    print(f"IAM Role '{role_name}' assume role policy updated successfully!")
else:
    # If the role doesn't exist, create it
    response = iam_client.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=str(assume_role_policy_document),
        Description='Role for Lambdas in CodyRichterCooks'
    )
    print(f"IAM Role '{role_name}' created successfully!")

iam_client.attach_role_policy(
    RoleName=role_name,
    PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
)


iam_client.attach_role_policy(
    RoleName=role_name,
    PolicyArn='arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'
)

iam_client.attach_role_policy(
    RoleName=role_name,
    PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
)

iam_client.attach_role_policy(
    RoleName=role_name,
    PolicyArn='arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess'
)

for api_operation in lambda_operations:
    function_name = f'{api_operation["name"]}-recipe-lambda'
    # Create permission for API Gateway to invoke the Lambda function
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f'apigateway-invoke-{api_operation["name"]}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f'arn:aws:execute-api:{aws_region}:{aws_account_id}:{rest_api_id}/*/{api_operation["method"]}/{resource_name}'
        )
        print(f'Lambda function {function_name} permission for API Gateway created successfully!')
    except lambda_client.exceptions.ResourceConflictException:
        print(f'Lambda function {function_name} permission for API Gateway exists, skipping creation...')


# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
#                   Cleanup
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

# Delete build directory
for file in os.listdir('build'):
    os.remove(os.path.join('build', file))
os.rmdir('build')

# Remove the S3 bucket
s3_client.delete_object(Bucket=upload_bucket_name, Key=s3_lambdas_object_name)
s3_client.delete_bucket(Bucket=upload_bucket_name)
