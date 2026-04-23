package com.shopeasy.dto;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.NotBlank;

/** 권한그룹-메뉴별 액션 권한 저장 항목. */
@Getter
@Setter
public class AuthGroupMenuPermissionSaveItem {
    @NotBlank
    private String menuId;
    private boolean canView;
    private boolean canCreate;
    private boolean canUpdate;
    private boolean canDelete;
    private boolean canExcelDownload;
    private boolean canApprove;
}
