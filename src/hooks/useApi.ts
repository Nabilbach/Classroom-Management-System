import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/apiClient';

interface UseApiOptions {
  initialData?: any;
  skipInitialFetch?: boolean;
}

const useApi = <T>( 
  apiCall: (signal?: AbortSignal) => Promise<T>,
  options?: UseApiOptions
) => {
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await apiCall(signal);
      setData(result);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (options?.skipInitialFetch) {
      return;
    }
    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchData, options?.skipInitialFetch]);

  return { data, loading, error, refetch: fetchData };
};

export default useApi;
