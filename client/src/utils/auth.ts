import { AuthProviderProps } from "react-oidc-context";
import { isDevEnvironment } from "./development";

export const cognitoAuthConfig: AuthProviderProps = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_iWzlwY8et",
  client_id: "4mpm5q3jhvre834inbke4jcl31",
  // Dynamically update the redirect_uri based on the environment
  redirect_uri: isDevEnvironment
    ? "http://localhost:3000"
    : "https://cooking.cody.richter.codes",
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid phone profile",
};
