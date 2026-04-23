package com.shopeasy.mapper;

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
            @Param("menuIds") List<String> menuIds,
            @Param("userId") String userId);
}
