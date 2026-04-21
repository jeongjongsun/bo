package com.shopeasy.mapper;

import com.shopeasy.dto.UserDetailResponse;
import com.shopeasy.dto.UserListItem;
import com.shopeasy.dto.UserManageRow;
import com.shopeasy.entity.OmUserM;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_USER_M 조회 (로그인·사용자 목록). */
@Mapper
public interface OmUserMMapper {

    /** 로그인용 단건 조회 (userId) */
    OmUserM selectByUserId(@Param("userId") String userId);

    /** userId 목록으로 user_id, user_nm 일괄 조회 (주문서 처리 제외 건 표시명용). */
    List<OmUserM> selectByUserIds(@Param("userIds") List<String> userIds);

    /** 사용자 목록 페이징 (keyword LIKE, size/offset) */
    List<UserListItem> selectUserList(@Param("keyword") String keyword,
                                      @Param("size") int size,
                                      @Param("offset") int offset);

    /** 목록 총 건수 (keyword 동일 조건) */
    long selectUserListCount(@Param("keyword") String keyword);

    /** 로그인 사용자 프로필 수정 (user_nm, user_info, updated_at, updated_by). */
    int updateProfile(@Param("userId") String userId,
                      @Param("userNm") String userNm,
                      @Param("userInfo") String userInfo,
                      @Param("updatedBy") String updatedBy);

    /** 로그인 등 user_info JSONB만 갱신 (비밀번호 실패·잠금·성공 시 초기화). */
    int updateUserInfoJson(@Param("userId") String userId, @Param("userInfo") String userInfo);

    /** 관리 화면: user_info + updated_by 갱신. */
    int updateUserInfoJsonWithAudit(
            @Param("userId") String userId,
            @Param("userInfo") String userInfo,
            @Param("updatedBy") String updatedBy);

    int updateUserNm(
            @Param("userId") String userId,
            @Param("userNm") String userNm,
            @Param("updatedBy") String updatedBy);

    int insertUser(
            @Param("userId") String userId,
            @Param("userNm") String userNm,
            @Param("userInfo") String userInfo,
            @Param("createdBy") String createdBy);

    long selectManageListCount(
            @Param("keyword") String keyword,
            @Param("gradeCd") String gradeCd,
            @Param("authGroup") String authGroup);

    List<UserManageRow> selectManageList(
            @Param("keyword") String keyword,
            @Param("gradeCd") String gradeCd,
            @Param("authGroup") String authGroup,
            @Param("limit") int limit,
            @Param("offset") int offset);

    List<UserManageRow> selectManageExportList(
            @Param("keyword") String keyword,
            @Param("gradeCd") String gradeCd,
            @Param("authGroup") String authGroup);

    UserDetailResponse selectUserDetailResponse(@Param("userId") String userId);

    /** 로그인 경로: 행 잠금 후 user_info 갱신에 사용. */
    OmUserM selectByUserIdForUpdate(@Param("userId") String userId);
}
