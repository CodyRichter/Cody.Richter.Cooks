# Cody.Richter.Cooks

Cody.Richter.Cooks is a web-based application designed to systematically document and manage a curated collection of culinary recipes (a.k.a. Recipes that Cody thinks are tasty). 
This repository contains both the frontend and backend components. The frontend codebase is encapsulated within the `client` directory, while backend operations are maintained in the `server` directory.

## Features
- Comprehensive cataloging of recipes, including precise ingredient specifications, stepwise procedural instructions, and detailed descriptions.
- Restricted content modification privileges; public account creation is not permitted.
- A responsive and dynamic user interface constructed with React and Next.js, leveraging modern web development paradigms.
- Serverless backend architecture utilizing AWS Lambda for computational tasks and DynamoDB for persistent data storage, ensuring scalability and high availability.
- Secure authentication and authorization mechanisms implemented via AWS Cognito to regulate access control.
- Continuous feature enhancements and iterative development to optimize user experience and expand functionality.

## Technology Stack
### Frontend
- **React** with **Next.js**, albeit with limited utilization of server-side rendering (SSR).
- **Mantine** as the principal component library for UI design.

### Backend
- **Python** as the primary backend programming language.
- **AWS Lambda** for executing backend logic in a serverless environment.
- **DynamoDB** as the NoSQL database solution for efficient, scalable data management.
- **AWS Cognito** for identity and access management.
- **AWS Cloud Development Kit (CDK)** for infrastructure-as-code (IaC) deployment.

## Installation Guide
To deploy and run the application locally, visit the `client` and `server` directories and view the README files.

## Application Usage
- Access the web interface to explore the available recipe collection (https://cooking.cody.richter.codes).
- Recipes are viewable by the general public; however, submission and modification functionalities are not available to the public.

## Contribution Guidelines
This project undergoes active development with iterative feature expansions. Prospective contributors should adhere to established version control protocols, issue tracking methodologies, and pull request guidelines.

## Contact and Support
For inquiries, feature requests, or issue reporting, please submit a ticket via [GitHub Issues](https://github.com/CodyRichter/Cody.Richter.Cooks/issues).

