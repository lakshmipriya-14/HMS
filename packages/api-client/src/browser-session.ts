// Only a non-secret sign-out retry marker is persisted in browser storage.
const key = 'uyirinai_signout_pending';
function storage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const isLogoutPending = () => storage()?.getItem(key) === '1';
export const markPendingLogout = () => storage()?.setItem(key, '1');
export const clearPendingLogout = () => storage()?.removeItem(key);
