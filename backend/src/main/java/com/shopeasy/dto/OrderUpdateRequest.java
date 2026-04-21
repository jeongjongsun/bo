package com.shopeasy.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * 주문 수정 요청. registDt + 마스터 필드 + 라인 목록.
 */
@Getter
@Setter
public class OrderUpdateRequest {

    private String registDt;
    private OrderMasterDetail master;
    private List<OrderItemDetail> items;

}
