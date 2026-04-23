package com.shopeasy.service;

import com.shopeasy.dto.AuditLogCommand;

/** 서비스 계층 공통 감사 이력 기록 인터페이스. */
public interface AuditService {

    /**
     * 감사 이력을 저장한다.
     * 트랜잭션 정책에 따라 저장 실패 시 호출 트랜잭션도 실패해야 한다.
     */
    void record(AuditLogCommand command);
}
