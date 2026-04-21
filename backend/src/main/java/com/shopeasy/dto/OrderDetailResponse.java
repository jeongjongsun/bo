package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 주문 상세 조회 응답. 마스터 + 라인 목록.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponse {

    private OrderMasterDetail master;
    private List<OrderItemDetail> items;

}
