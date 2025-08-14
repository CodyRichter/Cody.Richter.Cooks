# Infrastructure Overview

This project uses AWS CDK (Python) to provision all backend infrastructure for the React frontend.

## Main Components

- The app is hosted on AWS in the free tier, and extreme effort should be made not to violate this and incur a cost
- The app is designed to be serverless
- Cognito is used for all authenciation and authorization
- Github Pages is used to deploy the frontend, and should not need to be changed.
