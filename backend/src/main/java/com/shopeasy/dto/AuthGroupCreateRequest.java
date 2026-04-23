package com.shopeasy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/** 권한그룹 신규 등록 요청. */
@Getter
@Setter
public class AuthGroupCreateRequest {

    /**
     * 무시됨. 신규 코드는 서버에서 {@code AUTH-0001} 형식으로 자동 채번.
     * @deprecated 클라이언트에서 보내지 마세요.
     */
    @Deprecated
    private String authGroupCd;
    @NotBlank(message = "authGroups.name_required")
    private String authGroupNm;
    private String remark;
}
