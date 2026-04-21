package com.shopeasy.mapper;

import com.shopeasy.dto.ProductUnit;
import com.shopeasy.dto.UnitBulkInsertRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 상품 단위/바코드 테이블(OM_PRODUCT_UNIT) MyBatis 매퍼.
 */
@Mapper
public interface OmProductUnitMapper {

    /** 상품별 단위/바코드 목록 (sort_order, id 순) */
    List<ProductUnit> selectByProductId(@Param("productId") String productId);

    /** 해당 상품의 단위 행 전체 삭제 (수정 시 교체 전 삭제용) */
    int deleteByProductId(@Param("productId") String productId);

    /** 단위 목록 일괄 INSERT */
    int insertAll(@Param("productId") String productId, @Param("list") List<ProductUnit> list);

    /** 기본단위(is_base_unit=true) 행의 unit_cd만 변경 (목록 그리드에서 baseUnitCd 단건 수정 시) */
    int updateBaseUnitCd(@Param("productId") String productId, @Param("unitCd") String unitCd);

    /** 단위/바코드 bulk INSERT (엑셀 업로드). 여러 상품의 단위를 한 번에 */
    int insertBatch(@Param("list") List<UnitBulkInsertRow> list);
}
