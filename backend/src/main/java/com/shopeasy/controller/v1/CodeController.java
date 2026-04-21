package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.dto.CodeItem;
import com.shopeasy.service.CodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공통코드 API. CM_CODE_M 조회 (단위코드 등). 인증은 SessionAuthInterceptor에서 처리.
 */
@RestController
@RequestMapping("/api/v1/codes")
public class CodeController {

    private final CodeService codeService;

    public CodeController(CodeService codeService) {
        this.codeService = codeService;
    }

    /**
     * main_cd에 해당하는 공통코드 목록 (use_yn='Y', disp_seq 순).
     *
     * @param mainCd 코드 그룹 (예: PACK_UNIT)
     * @param lang   코드명 언어 키 (선택, 기본 ko)
     * @return ApiResponse.data = List&lt;CodeItem&gt; (subCd, codeNm)
     */
    @GetMapping("/list/{mainCd}")
    public ResponseEntity<ApiResponse<List<CodeItem>>> list(
            @PathVariable("mainCd") String mainCd,
            @RequestParam(required = false) String lang) {
        List<CodeItem> result = codeService.getCodeList(mainCd, lang);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
