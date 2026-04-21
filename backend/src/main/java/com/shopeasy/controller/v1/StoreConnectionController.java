package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.StoreConnectionItem;
import com.shopeasy.dto.StoreConnectionSaveRequest;
import com.shopeasy.service.StoreConnectionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 상점별 API 접속정보 (1:N). docs/02-개발-표준.md 규격.
 */
@RestController
@RequestMapping("/api/v1/malls/stores/{storeId}/connections")
public class StoreConnectionController {

    private final StoreConnectionService connectionService;

    public StoreConnectionController(StoreConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    /** 해당 상점의 접속정보 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StoreConnectionItem>>> list(@PathVariable long storeId) {
        List<StoreConnectionItem> list = connectionService.listByStoreId(storeId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /** 접속정보 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> create(
            @PathVariable long storeId,
            @RequestBody StoreConnectionSaveRequest body,
            HttpServletRequest request) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        connectionService.create(storeId, body, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** 접속정보 수정 */
    @PutMapping("/{connectionId}")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable long storeId,
            @PathVariable long connectionId,
            @RequestBody StoreConnectionSaveRequest body,
            HttpServletRequest request) {
        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        connectionService.update(connectionId, body, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** 접속정보 삭제 */
    @DeleteMapping("/{connectionId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable long storeId,
            @PathVariable long connectionId) {
        connectionService.delete(connectionId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
