package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.MallListItem;
import com.shopeasy.dto.MallOption;
import com.shopeasy.dto.MallStoreListItem;
import com.shopeasy.dto.StoreCreateRequest;
import com.shopeasy.dto.StoreUpdateRequest;
import com.shopeasy.mapper.OmMallMMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 쇼핑몰·상점 목록 조회 서비스. 페이징·키워드 검색.
 */
@Service
public class MallService {

    private final OmMallMMapper mallMapper;

    public MallService(OmMallMMapper mallMapper) {
        this.mallMapper = mallMapper;
    }

    /** 쇼핑몰 목록 (mall 단위). */
    @Transactional(readOnly = true)
    public PagedData<MallListItem> getMallList(String keyword, int page, int size) {
        int offset = page * size;
        long total = mallMapper.selectMallListCount(keyword);
        List<MallListItem> items = mallMapper.selectMallList(keyword, size, offset);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;

        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    /**
     * 쇼핑몰+상점 목록 페이징 조회 (상점 단위, 한 행당 한 상점).
     *
     * @param keyword 검색어 (mall_cd, mall_nm, store_cd, store_nm LIKE, null 가능)
     * @param corporationCd 법인코드 (있으면 해당 법인 상점만, null/blank면 전체)
     * @param page 0-based 페이지
     * @param size 페이지 크기
     * @return items, page, size, total, totalPages, first, last
     */
    @Transactional(readOnly = true)
    public PagedData<MallStoreListItem> getMallStoreList(String keyword, String corporationCd, int page, int size) {
        int offset = page * size;
        String corp = (corporationCd != null && !corporationCd.isBlank()) ? corporationCd.trim() : null;
        long total = mallMapper.selectMallStoreListCount(keyword, corp);
        List<MallStoreListItem> items = mallMapper.selectMallStoreList(keyword, corp, size, offset);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;

        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    /**
     * 상점 수정 (store_nm, store_info, is_active). storeNm 필수.
     *
     * @param storeId  상점 PK
     * @param body     storeNm(필수), storeInfo(선택), isActive(선택)
     * @param updatedBy 수정자
     */
    @Transactional
    public void updateStore(long storeId, StoreUpdateRequest body, String updatedBy) {
        if (body == null || body.getStoreNm() == null || body.getStoreNm().isBlank()) {
            throw new IllegalArgumentException("store_nm is required");
        }
        String mallCd = body.getMallCd() != null ? body.getMallCd().trim() : null;
        if (mallCd != null && mallCd.isEmpty()) mallCd = null;
        String storeNm = body.getStoreNm().trim();
        String storeInfoJson = null;
        if (body.getStoreInfo() != null && !body.getStoreInfo().isEmpty()) {
            try {
                storeInfoJson = JSON.writeValueAsString(body.getStoreInfo());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("store_info invalid", e);
            }
        }
        int rows = mallMapper.updateStore(storeId, mallCd, storeNm, storeInfoJson, body.getIsActive(), updatedBy);
        if (rows == 0) {
            throw new IllegalArgumentException("Store not found: storeId=" + storeId);
        }
    }

    /** 쇼핑몰 옵션 목록 (드롭다운). */
    @Transactional(readOnly = true)
    public List<MallOption> getMallOptions() {
        return mallMapper.selectMallOptions();
    }

    private static final ObjectMapper JSON = new ObjectMapper();

    /** 상점 등록. store_cd 미입력 시 자동 채번: STORE_0001, STORE_0002, ... (동일 쇼핑몰·법인 내 순번). */
    @Transactional
    public void createStore(StoreCreateRequest req, String createdBy) {
        if (req.getMallCd() == null || req.getMallCd().isBlank()) {
            throw new IllegalArgumentException("mall_cd is required");
        }
        if (req.getCorporationCd() == null || req.getCorporationCd().isBlank()) {
            throw new IllegalArgumentException("corporation_cd is required");
        }
        if (req.getStoreNm() == null || req.getStoreNm().isBlank()) {
            throw new IllegalArgumentException("store_nm is required");
        }
        String mallCd = req.getMallCd().trim();
        String corporationCd = req.getCorporationCd().trim();
        String storeCd = req.getStoreCd() != null ? req.getStoreCd().trim() : "";
        if (storeCd.isEmpty()) {
            int count = mallMapper.selectStoreCountByMallAndCorporation(mallCd, corporationCd);
            storeCd = "STORE_" + String.format("%04d", count + 1);
        }
        String storeInfoJson = "{}";
        if (req.getStoreInfo() != null && !req.getStoreInfo().isEmpty()) {
            try {
                storeInfoJson = JSON.writeValueAsString(req.getStoreInfo());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("store_info invalid", e);
            }
        }
        boolean isActive = req.getIsActive() != null ? req.getIsActive() : true;
        mallMapper.insertStore(mallCd, corporationCd, storeCd, req.getStoreNm().trim(),
                storeInfoJson, isActive, createdBy);
    }
}
