type AuthSessionHandlers = {
  getRefreshToken: () => string | null | undefined;
  setTokens: (token: string, refreshToken: string) => Promise<void> | void;
  logout: () => Promise<void> | void;
};

let handlers: AuthSessionHandlers | null = null;

export function configureAuthSession(nextHandlers: AuthSessionHandlers) {
  handlers = nextHandlers;
}

export function getStoredRefreshToken(): string | null {
  return handlers?.getRefreshToken() ?? null;
}

export async function storeRefreshedTokens(token: string, refreshToken: string): Promise<void> {
  await handlers?.setTokens(token, refreshToken);
}

export async function logoutExpiredSession(): Promise<void> {
  await handlers?.logout();
}
