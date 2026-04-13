import { useApi } from "../context/ApiContext";

/**
 * Hook to consume API rate-limiting and throttling status.
 */
export const useApiStatus = () => {
  const { isRateLimited, retryIn, throttlingData } = useApi();
  
  return {
    isRateLimited,
    retryIn,
    throttlingData
  };
};

export default useApiStatus;
