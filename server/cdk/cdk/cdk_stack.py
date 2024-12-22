from aws_cdk import (
    Duration,
    Stack,
    aws_lambda as _lambda,
    aws_dynamodb as ddb,
    aws_apigateway as apigw,
    aws_cognito as cognito,
)
from aws_cdk.aws_lambda_python_alpha import PythonFunction, PythonLayerVersion, BundlingOptions
from constructs import Construct

class ServerlessStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        python_dependency_layer = PythonLayerVersion(
            self, 'CookingEventLayer',
            entry='../src',
            layer_version_name='CookingEventLayer',
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_9],
        )

        get_event_lambda = PythonFunction(
            self, 'CookingGetEventLambda',
            function_name='CookingGetEventLambda',
            runtime=_lambda.Runtime.PYTHON_3_9,
            entry='../src',
            index='app/get_event_handler.py',
            handler='handle_event',
            timeout=Duration.seconds(10),
            layers=[python_dependency_layer],
            bundling=BundlingOptions(
                asset_excludes=[".venv", ".gitignore", '.pytest_cache', 'tests'],
            )
        )

        post_event_lambda = PythonFunction(
            self, 'CookingPostEventLambda',
            function_name='CookingPostEventLambda',
            runtime=_lambda.Runtime.PYTHON_3_9,
            entry='../src',
            index='app/post_event_handler.py',
            handler='handle_event',
            timeout=Duration.seconds(10),
            layers=[python_dependency_layer],
            bundling=BundlingOptions(
                asset_excludes=[".venv", ".gitignore", '.pytest_cache', 'tests'],
            )
        )

        recipe_table = ddb.Table(
            self, 'RecipeTable',
            table_name='RecipeTable',
            partition_key=ddb.Attribute(
                name='id',
                type=ddb.AttributeType.STRING
            )
        )
        recipe_table.grant_read_data(get_event_lambda)
        recipe_table.grant_read_write_data(post_event_lambda)

        user_pool = cognito.UserPool(
            self, "CookingUserPool",
            user_pool_name="CookingUserPool",
        )
        user_pool.add_client(
            "CookingUserPoolClient",
            user_pool_client_name="CookingUserPoolClient",
            generate_secret=False,
            prevent_user_existence_errors=True,
            o_auth=cognito.OAuthSettings(
                callback_urls=["https://cooking.cody.richter.codes", "http://localhost:3000"],
            )
        )

        user_pool.add_domain(
            "CookingUserPoolDomain",
            cognito_domain=cognito.CognitoDomainOptions(
                domain_prefix="cody-richter-cooks",
            ),
        )

        gateway = apigw.LambdaRestApi(
            self, 'CookingEventGateway',
            rest_api_name='CookingEventGateway',
            handler=get_event_lambda,
            proxy=True,
            default_cors_preflight_options={
                "allow_origins": apigw.Cors.ALL_ORIGINS,
                "allow_methods": apigw.Cors.ALL_METHODS,
                "allow_headers": apigw.Cors.DEFAULT_HEADERS,
            }
        )

        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, 'CookingUserPoolAuthorizer',
            authorizer_name='CookingUserPoolAuthorizer',
            cognito_user_pools=[user_pool],
        )

        recipe = gateway.root.add_resource('recipes')

        # Add GET method, no authorization required
        # This will call the Get Event Lambda
        get_method = recipe.add_method(
            'GET',
            integration=apigw.LambdaIntegration(get_event_lambda),
            authorization_type=apigw.AuthorizationType.NONE,
        )

        # Add POST method, authorization is required
        post_method = recipe.add_method(
            'POST',
            integration=apigw.LambdaIntegration(post_event_lambda),
            authorization_type=apigw.AuthorizationType.COGNITO,
            authorizer=authorizer,
        )