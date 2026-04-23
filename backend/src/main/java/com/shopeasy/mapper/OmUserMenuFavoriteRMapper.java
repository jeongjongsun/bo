package com.shopeasy.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** BO 사용자 메뉴 즐겨찾기. */
@Mapper
public interface OmUserMenuFavoriteRMapper {

    List<String> selectMenuIdsOrdered(@Param("userId") String userId);

    boolean existsByUserAndMenu(@Param("userId") String userId, @Param("menuId") String menuId);

    int countByUser(@Param("userId") String userId);

    Integer selectMaxDispSeq(@Param("userId") String userId);

    int insert(
            @Param("userId") String userId,
            @Param("menuId") String menuId,
            @Param("dispSeq") int dispSeq);

    int delete(@Param("userId") String userId, @Param("menuId") String menuId);

    int deleteForUser(@Param("userId") String userId);

    /**
     * 해당 권한 그룹 소속 사용자 중, 허용 목록에 없는 메뉴 즐겨찾기 행 삭제.
     * menuIds가 비어 있으면 해당 사용자들의 즐겨찾기를 모두 삭제.
     */
    int deleteForAuthGroupUsersNotInMenuIds(
            @Param("authGroupCd") String authGroupCd,
            @Param("menuIds") List<String> menuIds);

    int deleteAllForUserIds(@Param("userIds") List<String> userIds);
}
