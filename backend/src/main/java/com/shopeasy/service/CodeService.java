package com.shopeasy.service;

import com.shopeasy.config.CacheConfig;
import com.shopeasy.dto.CodeItem;
import com.shopeasy.mapper.CmCodeMMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 공통코드(CM_CODE_M) 조회. main_cd별, use_yn='Y', disp_seq 정렬, 언어별 code_nm.
 * <p>결과는 메모리 캐시(codeList)에 1시간 보관되어 DB 비용을 줄인다.</p>
 */
@Service
public class CodeService {

    private static final String DEFAULT_LANG = "ko";

    private final CmCodeMMapper codeMapper;

    public CodeService(CmCodeMMapper codeMapper) {
        this.codeMapper = codeMapper;
    }

    /**
     * main_cd에 해당하는 공통코드 목록 (use_yn='Y', disp_seq 오름차순).
     * 동일 (mainCd, lang) 요청은 캐시에서 반환.
     *
     * @param mainCd 예: PACK_UNIT
     * @param lang   코드명 키 (code_nm JSONB). null이면 'ko'
     */
    @Cacheable(cacheNames = CacheConfig.CACHE_CODE_LIST, key = "#mainCd + '_' + #lang")
    public List<CodeItem> getCodeList(String mainCd, String lang) {
        String l = (lang != null && !lang.isBlank()) ? lang.trim() : DEFAULT_LANG;
        return codeMapper.selectByMainCd(mainCd, l);
    }
}
