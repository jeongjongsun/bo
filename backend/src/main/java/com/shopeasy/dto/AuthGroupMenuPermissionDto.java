package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;

/** 권한그룹-메뉴별 액션 권한 DTO. */
@Getter
@Setter
public class AuthGroupMenuPermissionDto {
    private String menuId;
    private boolean canView;
    private boolean canCreate;
    private boolean canUpdate;
    private boolean canDelete;
    private boolean canExcelDownload;
    private boolean canApprove;
}
