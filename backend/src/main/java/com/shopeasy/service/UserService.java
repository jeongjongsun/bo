package com.shopeasy.service;

import com.shopeasy.api.PagedData;
import com.shopeasy.dto.UserListItem;
import com.shopeasy.mapper.OmUserMMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 사용자 목록 조회 서비스 (OM_USER_M). 페이징·키워드 검색.
 */
@Service
public class UserService {

    private final OmUserMMapper userMapper;

    public UserService(OmUserMMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 사용자 목록 페이징 조회. keyword는 userId/userNm 등 LIKE 검색.
     *
     * @param keyword 검색어 (null 가능)
     * @param page 0-based 페이지
     * @param size 페이지 크기
     * @return items, page, size, total, totalPages, first, last
     */
    public PagedData<UserListItem> getUserList(String keyword, int page, int size) {
        int offset = page * size;
        long total = userMapper.selectUserListCount(keyword);
        List<UserListItem> items = userMapper.selectUserList(keyword, size, offset);
        int totalPages = (int) Math.ceil((double) total / size);

        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= totalPages - 1, null);
    }
}
