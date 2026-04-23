package com.shopeasy.service;

import com.shopeasy.api.PagedData;
import com.shopeasy.dto.AuditLogListRow;
import com.shopeasy.mapper.OmAuditLogHMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final OmAuditLogHMapper auditLogHMapper;

    public AuditLogService(OmAuditLogHMapper auditLogHMapper) {
        this.auditLogHMapper = auditLogHMapper;
    }

    @Transactional(readOnly = true)
    public PagedData<AuditLogListRow> getAuditLogs(
            String systemSubCd,
            String actionCode,
            String keyword,
            String fromTs,
            String toTs,
            int page,
            int size) {
        int safePage = Math.max(0, page);
        int safeSize = size > 0 ? Math.min(size, 500) : 100;
        int offset = safePage * safeSize;
        String normalizedSystemSub = normalizeSystemSub(systemSubCd);
        String normalizedAction = normalizeActionCode(actionCode);
        String normalizedKeyword = trimToNull(keyword);
        String normalizedFrom = trimToNull(fromTs);
        String normalizedTo = trimToNull(toTs);

        long total = auditLogHMapper.selectAuditLogCount(
                normalizedSystemSub,
                normalizedAction,
                normalizedKeyword,
                normalizedFrom,
                normalizedTo);
        List<AuditLogListRow> items = auditLogHMapper.selectAuditLogList(
                normalizedSystemSub,
                normalizedAction,
                normalizedKeyword,
                normalizedFrom,
                normalizedTo,
                safeSize,
                offset);
        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;
        return new PagedData<>(items, safePage, safeSize, total, totalPages,
                safePage == 0, safePage >= Math.max(0, totalPages - 1), null);
    }

    private String normalizeSystemSub(String systemSubCd) {
        String sub = trimToNull(systemSubCd);
        if (sub == null) {
            return null;
        }
        String up = sub.toUpperCase();
        if (!"BO".equals(up) && !"OM".equals(up)) {
            return null;
        }
        return up;
    }

    private String normalizeActionCode(String actionCode) {
        String action = trimToNull(actionCode);
        if (action == null) {
            return null;
        }
        String up = action.toUpperCase();
        if (!"CREATE".equals(up) && !"UPDATE".equals(up) && !"DELETE".equals(up)) {
            return null;
        }
        return up;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
