package com.shopeasy.mapper;

import com.shopeasy.dto.AuthGroupMenuPermissionDto;
import com.shopeasy.dto.AuthGroupMenuPermissionSaveItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_AUTH_GROUP_MENU_R 권한그룹-메뉴 매핑. */
@Mapper
public interface OmAuthGroupMenuRMapper {

    List<String> selectMenuIdsByGroupAndSystem(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd);

    /**
     * 권한그룹에 매핑된 메뉴 중, 활성·미삭제 메뉴만 (로그인 후 사이드바 노출용).
     */
    List<String> selectActiveMenuIdsByAuthGroupAndSystem(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd);

    List<AuthGroupMenuPermissionDto> selectMenuPermissionsByGroupAndSystem(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd);

    List<String> selectPermissionCodesByAuthGroupAndSystem(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd);

    List<String> selectPermissionCodesByAuthGroup(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd);

    int softDeleteByGroupAndSystem(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("userId") String userId);

    int softDeleteByGroup(
            @Param("authGroupCd") String authGroupCd,
            @Param("userId") String userId);

    int insertBatch(
            @Param("authGroupCd") String authGroupCd,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("menuPermissions") List<AuthGroupMenuPermissionSaveItem> menuPermissions,
            @Param("userId") String userId);
}
