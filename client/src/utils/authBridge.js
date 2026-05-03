const TOKEN_STORAGE_KEY = "careerTrackerToken";
export const TOKEN_NOT_READY_MESSAGE = "Authentication token is not ready yet. Please wait a moment and try again.";

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

export const createTokenNotReadyError = () => {
  const error = new Error(TOKEN_NOT_READY_MESSAGE);
  error.code = "AUTH_TOKEN_NOT_READY";
  error.response = {
    status: 401,
    data: {
      message: TOKEN_NOT_READY_MESSAGE
    }
  };
  return error;
};
