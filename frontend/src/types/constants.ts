import { apiBaseUrl } from '@/config/environment'

export const BASE_URL = apiBaseUrl

export interface NetworkResult {
  isLoading: boolean;
  error: string;
  response: unknown;
}

export const INITIAL_NETWORK_RESULT_WITH_LOADING: NetworkResult = {
  isLoading: true,
  error: "",
  response: null,
};

export const INITIAL_NETWORK_RESULT_WITHOUT_LOADING: NetworkResult = {
  isLoading: false,
  error: "",
  response: null,
};
