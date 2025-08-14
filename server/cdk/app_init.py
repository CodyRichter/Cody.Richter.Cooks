#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk_stack import CodyRichterCooksStack


app = cdk.App()

CodyRichterCooksStack(
    app, 
    "CookingStack",
    env=cdk.Environment(account=os.getenv('AWS_ACCOUNT_ID'), region='us-east-1'),
)

app.synth()
