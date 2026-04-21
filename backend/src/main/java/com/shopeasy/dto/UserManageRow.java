package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 관리 그리드 행 (OM_USER_M + 표시용 보강). */
@Getter
@Setter
public class UserManageRow {

    private String userId;
    private String userNm;
    private String emailId;
    private String gradeCd;
    private String gradeNm;
    private String authGroup;
    private String authGroupNm;
    private String userStatus;
    private String lastLoginDtm;
    private String createdAt;
}
