package com.shopeasy.mapper;

import com.shopeasy.dto.MallManageRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_MALL_M 조회. */
@Mapper
public interface OmMallMMapper {

    long selectManageListCount(@Param("keyword") String keyword);

    List<MallManageRow> selectManageList(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset);
}
