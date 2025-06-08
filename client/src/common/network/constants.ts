export const BASE_URL =
  "https://wndyiwspp6.execute-api.us-east-1.amazonaws.com/prod";

export interface NetworkResult {
  isLoading: boolean;
  error: string;
  response: any;
}

export const INITIAL_NETWORK_RESULT: NetworkResult = {
  isLoading: true,
  error: "",
  response: null,
};
