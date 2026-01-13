import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';

interface SafeQueryOptions<T> extends Omit<UseQueryOptions<T, PostgrestError>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  timeout?: number;
}

export function useSafeQuery<T>({
  queryKey,
  queryFn,
  timeout = 15000,
  ...options
}: SafeQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), timeout)
      );

      try {
        const result = await Promise.race([queryFn(), timeoutPromise]);
        return result;
      } catch (error) {
        console.error(`Query ${queryKey.join('/')} failed:`, error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes default
    retry: 2,
    ...options,
  });
}

export default useSafeQuery;
