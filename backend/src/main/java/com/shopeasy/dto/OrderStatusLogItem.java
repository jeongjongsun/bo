package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 주문 상태 변경 이력 1건 (om_order_status_log).
 */
@Getter
@Setter
public class OrderStatusLogItem {

    private Long id;
    private Long orderId;
    private String registDt;
    private String statusKind;
    private String statusValue;
    private String statusDt;
    private String statusBy;
    /** 처리자 이름 (om_user_m.user_nm, 조회 시 JOIN). */
    private String statusByNm;
    private String createdAt;

}
