package com.shopeasy.service;

import com.shopeasy.dto.CorporationItem;
import com.shopeasy.mapper.OmCorporationMMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 법인(화주사) 목록 서비스 (OM_CORPORATION_M). 활성 법인만 조회.
 */
@Service
public class CorporationService {

    private final OmCorporationMMapper corporationMapper;

    public CorporationService(OmCorporationMMapper corporationMapper) {
        this.corporationMapper = corporationMapper;
    }

    /** 활성 법인 목록 (corporation_cd, corporation_nm 등) */
    public List<CorporationItem> getCorporationList() {
        return corporationMapper.selectCorporationList();
    }
}
