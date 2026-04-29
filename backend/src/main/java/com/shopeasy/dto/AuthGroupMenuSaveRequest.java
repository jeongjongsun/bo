package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** 권한그룹별 메뉴 권한 저장 요청. */
@Getter
@Setter
public class AuthGroupMenuSaveRequest {
    private String systemMainCd;
    private String systemSubCd;
    @Valid
    @NotNull
    @NotEmpty
    private List<AuthGroupMenuPermissionSaveItem> menuPermissions;
    private String changeReason;
}
