import json
from typing import Optional

from src.utilities.constants import DecimalEncoder

cors_headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': True
}

# HTTP 200: OK
def http_200(body):
    return {
        'statusCode': 200,
        'body': json.dumps(body, cls=DecimalEncoder),
        'headers': cors_headers
    }

# HTTP 201: Created
def http_201(body):
    return {
        'statusCode': 201,
        'body': json.dumps(body, cls=DecimalEncoder),
        'headers': cors_headers
    }

# HTTP 400: Bad Request
def http_400(error_message: str):
    return {
        'statusCode': 400,
        'body': json.dumps({'detail': error_message}),
        'headers': cors_headers
    }

# HTTP 404: Not Found
def http_404(error_message: str):
    return {
        'statusCode': 404,
        'body': json.dumps({'detail': error_message}),
        'headers': cors_headers
    }

# HTTP 405: Method Not Allowed
def http_405():
    return {
        'statusCode': 405,
        'body': json.dumps({'detail': "Unsupported method."}),
        'headers': cors_headers
    }

# HTTP 500: Internal Server Error
def http_500(error_message: Optional[str]):
    return {
        'statusCode': 500,
        'body': json.dumps({'detail': error_message}) if error_message else json.dumps({'detail': 'Internal Server Error'}),
        'headers': cors_headers
    }