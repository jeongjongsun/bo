package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 주문 일괄등록 시 (regist_dt, corporation_cd, mall_cd, store_cd, order_no) 중복 조회용.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderNoTriple {
    private String mallCd;
    private String storeCd;
    private String orderNo;

}
