import { apiGet, apiPost } from './client';
import type { PurchaseSkinResponseView, WalletStateView } from './types';

export function getWalletState(token: string): Promise<WalletStateView> {
  return apiGet<WalletStateView>('/api/wallet', token);
}

export function equipSkin(token: string, code: string): Promise<PurchaseSkinResponseView> {
  return apiPost<PurchaseSkinResponseView>(`/api/wallet/skins/${code}/equip`, {}, token);
}
