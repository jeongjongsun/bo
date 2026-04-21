package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.dto.AuthGroupOptionDto;
import com.shopeasy.service.AuthGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 권한 그룹 마스터 조회 (사용자 화면 select 등).
 */
@RestController
@RequestMapping("/api/v1/auth-groups")
public class AuthGroupController {

    private final AuthGroupService authGroupService;

    public AuthGroupController(AuthGroupService authGroupService) {
        this.authGroupService = authGroupService;
    }

    /**
     * 활성 권한 그룹 목록.
     *
     * @return ApiResponse.data = List&lt;AuthGroupOptionDto&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AuthGroupOptionDto>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(authGroupService.getActiveOptions()));
    }
}
