export const BASE_URL =
  "https://wtbqxgb93e.execute-api.us-east-1.amazonaws.com/prod";

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
