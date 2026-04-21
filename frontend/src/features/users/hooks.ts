import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCodeList } from '@/api/codes';
import {
  fetchUserManageList,
  fetchUserDetail,
  updateUserField,
  updateUserDetail,
  registerUser,
  fetchAuthGroupOptions,
  type UserManageListParams,
  type UserDetailUpdateBody,
  type UserRegisterBody,
  type UserGridEditableField,
} from '@/api/usersManage';

const USER_GRADE_MAIN_CD = 'USER_GRADE';

export function useUserManageList(params: UserManageListParams) {
  return useQuery({
    queryKey: [
      'users',
      'manage',
      params.keyword ?? '',
      params.gradeCd ?? '',
      params.authGroup ?? '',
      params.lang ?? '',
      params.page ?? 0,
      params.size ?? 100,
    ],
    queryFn: () => fetchUserManageList(params),
    placeholderData: (prev) => prev,
  });
}

export function useAuthGroupOptions() {
  return useQuery({
    queryKey: ['auth-groups', 'options'],
    queryFn: () => fetchAuthGroupOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserGradeOptions(lang: string) {
  return useQuery({
    queryKey: ['codes', USER_GRADE_MAIN_CD, lang],
    queryFn: () => fetchCodeList(USER_GRADE_MAIN_CD, lang),
    staleTime: 60 * 60 * 1000,
  });
}

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: () => fetchUserDetail(userId!),
    enabled: !!userId,
  });
}

export function useUpdateUserField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: { userId: string; field: UserGridEditableField; value: unknown }) => updateUserField(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'manage'] });
    },
  });
}

export function useUpdateUserDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserDetailUpdateBody) => updateUserDetail(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}

export function useRegisterUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserRegisterBody) => registerUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'manage'] });
    },
  });
}
