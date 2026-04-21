package com.shopeasy.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 상품 수정 요청 DTO (PUT /api/v1/products/{productId}).
 * <ul>
 *   <li>메인 컬럼·부가정보: OM_PRODUCT_M 및 product_info JSONB 스칼라만 갱신</li>
 *   <li>units: OM_PRODUCT_UNIT 테이블 전체 교체 (delete 후 insert)</li>
 *   <li>setComponents: OM_PRODUCT_SET_COMPONENT 테이블 전체 교체</li>
 * </ul>
 */
@Getter
@Setter
public class ProductUpdateRequest {

    private String productCd;
    private String productNm;
    private String productType;
    private String baseUnitCd;
    private Boolean isSale;
    private Boolean isDisplay;

    /** product_info 부가정보 (product_en_nm, category_cd, cost_price 등) */
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
    /** OM_PRODUCT_UNIT */
    private List<ProductUnit> units;
    /** OM_PRODUCT_SET_COMPONENT */
    private List<ProductSetComponent> setComponents;

}
