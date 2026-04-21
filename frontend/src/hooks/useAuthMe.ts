/**
 * 현재 사용자·메뉴·권한. docs/02-개발-표준.md, 05-React Query.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchAuthMe } from '@/api/auth';

export function useAuthMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
    retry: (_, error: { response?: { status?: number } }) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return true;
    },
  });
}
