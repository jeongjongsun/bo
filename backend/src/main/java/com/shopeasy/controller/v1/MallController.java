package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.MallManageRow;
import com.shopeasy.service.MallService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 쇼핑몰 마스터(om_mall_m) API. 세션 인증은 인터셉터에서 처리.
 */
@RestController
@RequestMapping("/api/v1/malls")
public class MallController {

    private final MallService mallService;

    public MallController(MallService mallService) {
        this.mallService = mallService;
    }

    /**
     * 쇼핑몰 관리 그리드용 페이징 목록. mall_cd 오름차순.
     *
     * @param keyword mall_cd·mall_nm·mall_info·api_connection_info 검색 (선택). 삭제된 행(is_deleted) 제외.
     * @param page 0-based
     * @param size 최대 5000
     */
    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<PagedData<MallManageRow>>> manageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        PagedData<MallManageRow> result = mallService.getManageList(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
