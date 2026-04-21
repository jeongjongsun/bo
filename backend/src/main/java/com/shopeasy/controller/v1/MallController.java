package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.PagedData;
import com.shopeasy.config.SessionAuthInterceptor;
import com.shopeasy.dto.MallOption;
import com.shopeasy.dto.MallStoreListItem;
import com.shopeasy.dto.StoreCreateRequest;
import com.shopeasy.dto.StoreUpdateRequest;
import com.shopeasy.service.MallService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 쇼핑몰 관리 API. 쇼핑몰+상점 목록(상점 단위) 조회·상점명 수정. docs/02-개발-표준.md 규격.
 */
@RestController
@RequestMapping("/api/v1/malls")
public class MallController {

    private final MallService mallService;

    public MallController(MallService mallService) {
        this.mallService = mallService;
    }

    /**
     * 쇼핑몰+상점 목록 페이징 (상점 단위). corporationCd 있으면 해당 법인 상점만.
     *
     * @param keyword 검색어 (선택)
     * @param corporationCd 법인코드 (선택, 있으면 해당 법인만)
     * @param page 0-based
     * @param size 최대 5000
     * @return ApiResponse.data = PagedData&lt;MallStoreListItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedData<MallStoreListItem>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String corporationCd,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (size > 5000) size = 5000;

        PagedData<MallStoreListItem> result = mallService.getMallStoreList(keyword, corporationCd, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 상점명 수정 (목록 그리드 셀 편집용).
     *
     * @param storeId 상점 PK
     * @param body storeNm
     * @param request 세션 사용자 ID
     */
    @PatchMapping("/stores/{storeId}")
    public ResponseEntity<ApiResponse<Void>> updateStore(
            @PathVariable long storeId,
            @RequestBody StoreUpdateRequest body,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        mallService.updateStore(storeId, body, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * 쇼핑몰 옵션 목록 (드롭다운용).
     *
     * @return ApiResponse.data = List&lt;MallOption&gt;
     */
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<MallOption>>> mallOptions() {
        return ResponseEntity.ok(ApiResponse.ok(mallService.getMallOptions()));
    }

    /**
     * 상점 등록.
     *
     * @param body mallCd, corporationCd, storeCd, storeNm, storeInfo(선택), isActive(선택)
     * @param request 세션 사용자 ID
     */
    @PostMapping("/stores")
    public ResponseEntity<ApiResponse<Void>> createStore(
            @RequestBody StoreCreateRequest body,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute(SessionAuthInterceptor.REQUEST_ATTR_USER_ID);
        mallService.createStore(body, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    }
