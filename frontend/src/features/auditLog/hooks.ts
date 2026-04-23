import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, type AuditLogListParams } from '@/api/auditLogs';

export function useAuditLogList(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 15 * 1000,
  });
}
