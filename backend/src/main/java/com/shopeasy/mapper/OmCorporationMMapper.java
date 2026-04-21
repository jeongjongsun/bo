package com.shopeasy.mapper;

import com.shopeasy.dto.CorporationItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/** OM_CORPORATION_M 조회 (활성 법인 목록). */
@Mapper
public interface OmCorporationMMapper {

    /** 활성 법인 목록 (corporation_cd, corporation_nm) */
    List<CorporationItem> selectCorporationList();
}
