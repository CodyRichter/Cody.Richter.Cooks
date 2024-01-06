#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk.cdk_stack import ServerlessStack


app = cdk.App()

ServerlessStack(
    app, 
    "CookingStack",
    env=cdk.Environment(account=os.getenv('AWS_ACCOUNT_ID'), region='us-east-1'),
)

app.synth()
