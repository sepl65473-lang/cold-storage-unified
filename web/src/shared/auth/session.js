// Token + user persistence. Kept separate from the auth store and the HTTP
// client to avoid circular imports. Token is read from here on every request.
const TOKEN_KEY = "sepl_token";
const USER_KEY  = "sepl_user";
const LEGACY_OWNER_NAME = "Anil Pradhan";
const OWNER_NAME        = "SEPL Cold Storage";

// Decode JWT payload without verifying signature (client-side only — not a security check).
function jwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const payload = jwtPayload(token);
  // If token has an exp claim and it has expired, clear session proactively.
  if (payload?.exp && Date.now() / 1000 > payload.exp) {
    clearSession();
    triggerUnauthorized();
    return null;
  }
  return token;
};

export const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (user?.name === LEGACY_OWNER_NAME) {
      const updatedUser = { ...user, name: OWNER_NAME };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
    return user;
  } catch { return null; }
};

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// The HTTP client calls this on a 401 so the auth store can log the user out.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const triggerUnauthorized = () => onUnauthorized();
