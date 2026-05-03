const TOKEN_STORAGE_KEY = "careerTrackerToken";

let accessTokenGetter = null;

export const registerAccessTokenGetter = (getter) => {
  accessTokenGetter = getter;
};

export const clearAccessTokenGetter = () => {
  accessTokenGetter = null;
};

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const storeAccessToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const resolveAccessToken = async () => {
  const storedToken = getStoredAccessToken();
  if (storedToken) {
    return storedToken;
  }

  if (!accessTokenGetter) {
    return null;
  }

  try {
    const token = await accessTokenGetter();
    if (token) {
      storeAccessToken(token);
      return token;
    }
  } catch (_error) {
    return null;
  }

  return null;
};
