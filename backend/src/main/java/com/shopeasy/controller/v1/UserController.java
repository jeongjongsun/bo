package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.UserListItem;
import com.shopeasy.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 관리 API. docs/02-개발-표준.md 규격. 인증은 SessionAuthInterceptor에서 처리.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 사용자 목록 페이징. keyword로 검색 가능.
     *
     * @param keyword 검색어 (선택)
     * @param page 0-based
     * @param size 최대 5000
     * @return ApiResponse.data = PagedData&lt;UserListItem&gt;
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedData<UserListItem>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (size > 5000) size = 5000;

        PagedData<UserListItem> result = userService.getUserList(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
