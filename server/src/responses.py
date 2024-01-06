import json
from typing import Optional

def http_200(body: str):
    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }

def http_400(error_message: str):
    return {
        'statusCode': 400,
        'body': json.dumps({'detail': error_message})
    }

def http_404(error_message: str):
    return {
        'statusCode': 404,
        'body': json.dumps({'detail': error_message})
    }

def http_405():
    return {
        'statusCode': 405,
        'body': json.dumps({'detail': "Unsupported method. Allowed: [GET, POST]"})
    }

def http_500(error_message: Optional[str]):
    return {
        'statusCode': 500,
        'body': json.dumps({'detail': error_message}) if error_message else json.dumps({'detail': 'Internal Server Error'})
    }