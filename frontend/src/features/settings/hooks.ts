import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserSettings, saveUserSettings, type SaveUserSettingsRequest } from '@/api/userSettings';
import { fetchSystemConfig, saveSystemConfig, type SaveSystemConfigRequest } from '@/api/systemConfig';

export const USER_SETTINGS_QUERY_KEY = ['user-settings'] as const;
export const SYSTEM_CONFIG_QUERY_KEY = ['system-config'] as const;

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

export function useSystemConfig() {
  return useQuery({
    queryKey: SYSTEM_CONFIG_QUERY_KEY,
    queryFn: fetchSystemConfig,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveSystemConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveSystemConfigRequest) => saveSystemConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SYSTEM_CONFIG_QUERY_KEY });
    },
  });
}
