export function validateCredentials(email: string, password: string): string {
  // TODO: Call authentication API
  return "token";
}

const TOKEN_KEY = "token";

export function storeAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}
