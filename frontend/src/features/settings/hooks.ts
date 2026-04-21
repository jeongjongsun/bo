import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserSettings, saveUserSettings, type SaveUserSettingsRequest } from '@/api/userSettings';
import { fetchProfile, updateProfile, type ProfileUpdateBody } from '@/api/profile';

export const USER_SETTINGS_QUERY_KEY = ['user-settings'] as const;
export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useUserSettings() {
  return useQuery({
    queryKey: USER_SETTINGS_QUERY_KEY,
    queryFn: fetchUserSettings,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveUserSettingsRequest) => saveUserSettings(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdateBody) => updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
