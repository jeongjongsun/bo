package com.shopeasy.mapper;

import com.shopeasy.dto.AuthGroupManageRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** OM_AUTH_GROUP_M 권한관리 전용 조회/수정. */
@Mapper
public interface OmAuthGroupManageMapper {

    List<AuthGroupManageRow> selectManageList();

    AuthGroupManageRow selectManageOne(@Param("authGroupCd") String authGroupCd);

    int updateGroupInfo(
            @Param("authGroupCd") String authGroupCd,
            @Param("authGroupNm") String authGroupNm,
            @Param("remark") String remark,
            @Param("userId") String userId);

    int softDelete(@Param("authGroupCd") String authGroupCd, @Param("userId") String userId);

    int selectMaxSortSeq();

    /**
     * {@code AUTH-0001} 형식 코드 중 숫자 접미사의 최댓값 (없으면 0).
     * 삭제된 행 포함해 동일 코드 충돌 방지용 시리얼 산출에 사용.
     */
    int selectMaxAuthPrefixedSerial();

    int insert(
            @Param("authGroupCd") String authGroupCd,
            @Param("authGroupNm") String authGroupNm,
            @Param("remark") String remark,
            @Param("sortSeq") int sortSeq,
            @Param("userId") String userId);
}
