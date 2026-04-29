package com.shopeasy.service;

import com.shopeasy.api.PagedData;
import com.shopeasy.dto.MallManageRow;
import com.shopeasy.mapper.OmMallMMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** 쇼핑몰 마스터(om_mall_m) 조회. */
@Service
public class MallService {

    private final OmMallMMapper mallMapper;

    public MallService(OmMallMMapper mallMapper) {
        this.mallMapper = mallMapper;
    }

    @Transactional(readOnly = true)
    public PagedData<MallManageRow> getManageList(String keyword, int page, int size) {
        String kw = normalizeKeyword(keyword);
        if (size > 5000) {
            size = 5000;
        }
        if (size < 1) {
            size = 20;
        }
        if (page < 0) {
            page = 0;
        }
        int offset = page * size;
        long total = mallMapper.selectManageListCount(kw);
        List<MallManageRow> items = mallMapper.selectManageList(kw, size, offset);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String t = keyword.trim();
        return t.isEmpty() ? null : t;
    }
}
