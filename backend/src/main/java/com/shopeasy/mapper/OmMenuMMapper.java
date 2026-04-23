package com.shopeasy.mapper;

import com.shopeasy.dto.MenuManageRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_MENU_M 메뉴 관리. */
@Mapper
public interface OmMenuMMapper {

    List<MenuManageRow> selectFlatBySystem(
            @Param("systemMainCd") String systemMainCd, @Param("systemSubCd") String systemSubCd);

    MenuManageRow selectOne(@Param("menuId") String menuId);

    Integer selectMaxNumericSuffix(@Param("systemSubCd") String systemSubCd, @Param("idPrefix") String idPrefix);

    int countActiveBySystemAndIds(
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("menuIds") List<String> menuIds);

    int insert(
            @Param("menuId") String menuId,
            @Param("systemMainCd") String systemMainCd,
            @Param("systemSubCd") String systemSubCd,
            @Param("parentMenuId") String parentMenuId,
            @Param("menuNm") String menuNm,
            @Param("menuUrl") String menuUrl,
            @Param("isActive") boolean isActive,
            @Param("icon") String icon,
            @Param("dispSeq") int dispSeq,
            @Param("menuInfo") String menuInfo,
            @Param("userId") String userId);

    int update(
            @Param("menuId") String menuId,
            @Param("menuNm") String menuNm,
            @Param("menuUrl") String menuUrl,
            @Param("isActive") boolean isActive,
            @Param("icon") String icon,
            @Param("dispSeq") int dispSeq,
            @Param("menuInfo") String menuInfo,
            @Param("userId") String userId);

    int softDeleteCascade(@Param("menuId") String menuId, @Param("userId") String userId);
}
