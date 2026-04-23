package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.AuditLogListRow;
import com.shopeasy.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedData<AuditLogListRow>>> list(
            @RequestParam(required = false) String systemSubCd,
            @RequestParam(required = false) String actionCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String fromTs,
            @RequestParam(required = false) String toTs,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        if (size > 500) {
            size = 500;
        }
        if (size < 0) {
            size = 0;
        }
        PagedData<AuditLogListRow> data = auditLogService.getAuditLogs(
                systemSubCd, actionCode, keyword, fromTs, toTs, page, size);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
