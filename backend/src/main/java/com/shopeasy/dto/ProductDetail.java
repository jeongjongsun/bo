package com.shopeasy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 상품 상세 조회/수정용 DTO.
 * <ul>
 *   <li>메인 컬럼: product_id, corporation_cd, product_cd, product_nm, product_type, base_unit_cd, is_sale, is_display</li>
 *   <li>부가정보: product_info JSONB 스칼라 필드만 (product_en_nm, category_cd, cost_price 등)</li>
 *   <li>단위/바코드: OM_PRODUCT_UNIT 테이블 → units</li>
 *   <li>세트 구성품: OM_PRODUCT_SET_COMPONENT 테이블 → setComponents</li>
 * </ul>
 */
@Getter
@Setter
public class ProductDetail {

    /** 상품 PK (OM_PRODUCT_M.product_id) */
    private String productId;
    private String corporationCd;
    private String productCd;
    private String productNm;
    private String productType;
    /** 기본단위 코드 (OM_PRODUCT_UNIT.is_base_unit=true 인 행의 unit_cd) */
    private String baseUnitCd;
    @JsonProperty("isSale")
    private boolean isSale;
    @JsonProperty("isDisplay")
    private boolean isDisplay;

    /** product_info JSONB 부가정보: 상품 영문명 */
    private String productEnNm;
    private String categoryCd;
    private String brandCd;
    private BigDecimal costPrice;
    private BigDecimal supplyPrice;
    private String taxType;
    private Integer safetyStockQty;
    private Integer minOrderQty;
    private Integer maxOrderQty;
    private Integer sortOrder;
    private String description;
    private String imageUrl;
    private String remark;

    /** 단위/바코드 목록 (OM_PRODUCT_UNIT) */
    private List<ProductUnit> units;
    /** 세트 구성품 목록 (OM_PRODUCT_SET_COMPONENT, product_type=SET일 때) */
    private List<ProductSetComponent> setComponents;
}
