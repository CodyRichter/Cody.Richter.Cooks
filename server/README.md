# Cody Richter Cooks - Server

## Setup

1. Python `3.9` is used for all lambda functions.

2. Configure the AWS CLI with your credentials

3. Configure AWS CDK

4. Navigate to the `cdk` directory

   - One-time local setup steps:
     1. Create the venv: `python -m venv .venv`
     2. Activate the venv: `source .venv/bin/activate`
     3. Install requirements: `pip install -r requirements.txt`

5. If this AWS account has not been used with CDK before, run `cdk bootstrap`

   - This command only needs to be run once per AWS account.

6. Deploy to AWS with `cdk deploy` command.

   - If you run this command after the repository is set up, make sure that your virutal environment is activated first! (`source .venv/bin/activate`)

## Running Test Cases

From the `src/` directory, run the following command to run Python Tests: `python3 -m pytest`

## Future Work

1. Create Congito authorizer for API

2. Implement full lambda functionality
