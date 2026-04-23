/**
 * 현재 사용자·메뉴·권한. docs/02-개발-표준.md, 05-React Query.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthMe } from '@/api/auth';
import { persistBoAllowedMenuIds } from '@/utils/boAllowedMenuStorage';

export function useAuthMe() {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
    retry: (_, error: { response?: { status?: number } }) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return true;
    },
  });

  useEffect(() => {
    const data = query.data;
    if (data?.allowedMenuIds !== undefined) {
      persistBoAllowedMenuIds(data.allowedMenuIds);
    }
  }, [query.data]);

  return query;
}
