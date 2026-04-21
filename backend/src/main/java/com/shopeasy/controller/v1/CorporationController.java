package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.dto.CorporationItem;
import com.shopeasy.service.CorporationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 법인(화주사) API. 전체 메뉴에서 법인 선택 시 사용. 인증은 SessionAuthInterceptor에서 처리.
 */
@RestController
@RequestMapping("/api/v1/corporations")
public class CorporationController {

    private final CorporationService corporationService;

    public CorporationController(CorporationService corporationService) {
        this.corporationService = corporationService;
    }

    /**
     * 활성 법인(화주사) 목록. 상단 법인 선택 등에 사용.
     *
     * @return ApiResponse.data = List&lt;CorporationItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CorporationItem>>> list() {
        List<CorporationItem> result = corporationService.getCorporationList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
