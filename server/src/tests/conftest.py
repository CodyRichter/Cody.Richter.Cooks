from moto import mock_aws  # THIS IMPORT MUST BE ABOVE ALL OTHERS IN ORDER TO MOCK AWS SERVICES
import pytest
import os
import boto3


@pytest.fixture(scope="session")
def clear_default_boto3_session():
    boto3.DEFAULT_SESSION = None

@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def mock_dynamodb_resource(aws_credentials):
    with mock_aws():
        yield boto3.resource("dynamodb", region_name="us-east-1")

@pytest.fixture
def mock_s3_resource(aws_credentials):
    with mock_aws():
        yield boto3.resource("s3", region_name="us-east-1")

@pytest.fixture
def mock_recipe_bucket(mock_s3_resource):
    mock_s3_resource.create_bucket(Bucket="cody-richter-cooks-recipes")
    bucket = mock_s3_resource.Bucket("cody-richter-cooks-recipes")
    yield bucket


@pytest.fixture
def mock_recipes_table(mock_dynamodb_resource):
        mock_dynamodb_resource.create_table(
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            TableName="RecipeTable",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table = mock_dynamodb_resource.Table("RecipeTable")
        table.wait_until_exists()
        yield table