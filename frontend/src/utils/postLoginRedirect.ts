// Remembers where to send someone after they log in (e.g. an invite link they
// opened while logged out). sessionStorage survives the Google OAuth round trip
// because it happens in the same tab.
const KEY = 'flowstate.postLoginRedirect';

export const setPostLoginRedirect = (path: string) => {
  try { sessionStorage.setItem(KEY, path); } catch {}
};

export const takePostLoginRedirect = (fallback = '/dashboard'): string => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // Only allow in-app paths so this can't become an open redirect.
    if (path && path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {}
  return fallback;
};
