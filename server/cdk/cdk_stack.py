from aws_cdk import (
    Duration,
    RemovalPolicy,
    Stack,
    aws_lambda as _lambda,
    aws_dynamodb as ddb,
    aws_apigateway as apigw,
    aws_cognito as cognito,
    aws_s3 as s3,
    aws_certificatemanager as acm
)

from aws_cdk.aws_lambda_python_alpha import PythonFunction, PythonLayerVersion, BundlingOptions
from constructs import Construct

class CodyRichterCooksStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        python_dependency_layer = PythonLayerVersion(
            self, 'CookingEventLayer',
            entry='../app',
            layer_version_name='CookingEventLayer',
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_9],
        )

        get_event_lambda = PythonFunction(
            self, 'CookingGetEventLambda',
            function_name='CookingGetEventLambda',
            runtime=_lambda.Runtime.PYTHON_3_9,
            entry='../app',
            index='src/get_event_handler.py',
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
            entry='../app',
            index='src/post_event_handler.py',
            handler='handle_event',
            timeout=Duration.seconds(10),
            layers=[python_dependency_layer],
            bundling=BundlingOptions(
                asset_excludes=[".venv", ".gitignore", '.pytest_cache', 'tests'],
            )
        )

        delete_event_lambda = PythonFunction(
            self, 'CookingDeleteEventLambda',
            function_name='CookingDeleteEventLambda',
            runtime=_lambda.Runtime.PYTHON_3_9,
            entry='../app',
            index='src/delete_event_handler.py',
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
            ),
            removal_policy=RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
        )
        recipe_table.grant_read_data(get_event_lambda)
        recipe_table.grant_read_write_data(post_event_lambda)
        recipe_table.grant_read_write_data(delete_event_lambda)

        recipe_bucket = s3.Bucket(
            self, 'RecipeBucket',
            bucket_name='cody-richter-cooks-recipes',
            removal_policy=RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
        )

        recipe_bucket.grant_read_write(post_event_lambda)
        recipe_bucket.grant_read(delete_event_lambda)
        recipe_bucket.grant_read(get_event_lambda)        

        user_pool = cognito.UserPool(
            self, "CookingUserPool",
            user_pool_name="CookingUserPool",
            feature_plan=cognito.FeaturePlan.ESSENTIALS,
            self_sign_up_enabled=True,
            email=cognito.UserPoolEmail.with_cognito(
                reply_to="no-reply@cooking.cody.richter.codes",
            ),
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True,
                phone=False,
                preferred_username=False,
            ),
            user_verification=cognito.UserVerificationConfig(
                email_subject="Verify your email for Cody Richter Cooks",
                email_body="Welcome to Cody Richter Cooks,\n\nPlease verify your email by clicking the link below:\n{##Verify Email##}",
                email_style=cognito.VerificationEmailStyle.LINK,
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(
                    required=True,
                    mutable=True,
                ),
                given_name=cognito.StandardAttribute(
                    required=True,
                    mutable=True,
                ),
                family_name=cognito.StandardAttribute(
                    required=True,
                    mutable=True,
                ),
            ),
            passkey_user_verification=cognito.PasskeyUserVerification.PREFERRED,
        )

        user_pool_client = user_pool.add_client(
            "CookingUserPoolClient",
            user_pool_client_name="CookingUserPoolClient",
            generate_secret=False,
            access_token_validity=Duration.hours(12),
            prevent_user_existence_errors=True,
            o_auth=cognito.OAuthSettings(
                callback_urls=["https://cooking.cody.richter.codes", "https://auth.richter.codes", "http://localhost:3000"],
            )
        )

        # This will apply Cognito managed branding to the user pool instead
        # of basic HTML branding.
        cognito.CfnManagedLoginBranding(
            self, "CookingUserPoolBranding",
            user_pool_id=user_pool.user_pool_id,
            client_id=user_pool_client.user_pool_client_id,
            use_cognito_provided_values=True,
        )

        # Certificate ARN for the custom domain
        # This has to be manually created in the AWS Certificate Manager outside of CDK
        # and should be in the us-east-1 region for Cognito custom domains.
        certificate_arn = "arn:aws:acm:us-east-1:043952678440:certificate/e29c580d-5a8f-45ee-b991-7e74c8a00eee"

        user_pool.add_domain(
            "CookingCustomDomain",
            custom_domain=cognito.CustomDomainOptions(
                domain_name="auth.richter.codes",
                certificate=acm.Certificate.from_certificate_arn(
                    self, "CookingAuthCertificate",
                    certificate_arn=certificate_arn
                ),
            ),
            managed_login_version=cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN
        )

        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, 'CookingUserPoolAuthorizer',
            authorizer_name='CookingUserPoolAuthorizer',
            cognito_user_pools=[user_pool],
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

        delete_method = recipe.add_method(
            'DELETE',
            integration=apigw.LambdaIntegration(delete_event_lambda),
            authorization_type=apigw.AuthorizationType.COGNITO,
            authorizer=authorizer,
        )