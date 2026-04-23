package com.shopeasy.service;

import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmAuthGroupMenuRMapper;
import com.shopeasy.mapper.OmUserMMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** 사용자 액션 권한 조회 서비스. */
@Service
public class ActionPermissionService {

    private static final String SYSTEM_MAIN = "SYSTEM";
    private static final String SYSTEM_SUB = "BO";
    private static final String EMPTY_AUTH_GROUP = "";

    private final OmUserMMapper userMMapper;
    private final OmAuthGroupMenuRMapper authGroupMenuRMapper;
    private final ConcurrentMap<String, String> userAuthGroupCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Set<String>> permissionSetCache = new ConcurrentHashMap<>();

    public ActionPermissionService(OmUserMMapper userMMapper, OmAuthGroupMenuRMapper authGroupMenuRMapper) {
        this.userMMapper = userMMapper;
        this.authGroupMenuRMapper = authGroupMenuRMapper;
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(String userId, String permissionCode) {
        if (userId == null || userId.isBlank() || permissionCode == null || permissionCode.isBlank()) {
            return false;
        }
        String normalizedUserId = userId.trim();
        String normalizedPermissionCode = permissionCode.trim();

        String authGroup = userAuthGroupCache.computeIfAbsent(normalizedUserId, this::findAuthGroupByUserId);
        if (authGroup.isBlank()) {
            return false;
        }

        String permissionCacheKey = permissionCacheKey(authGroup);
        Set<String> permissionCodes = permissionSetCache.computeIfAbsent(
                permissionCacheKey, key -> findPermissionCodesByAuthGroup(authGroup));
        return permissionCodes.contains(normalizedPermissionCode);
    }

    private String findAuthGroupByUserId(String userId) {
        OmUserM user = userMMapper.selectByUserId(userId);
        if (user == null || user.getAuthGroup() == null || user.getAuthGroup().isBlank()) {
            return EMPTY_AUTH_GROUP;
        }
        return user.getAuthGroup().trim();
    }

    private Set<String> findPermissionCodesByAuthGroup(String authGroup) {
        List<String> codes = authGroupMenuRMapper.selectPermissionCodesByAuthGroupAndSystem(
                authGroup, SYSTEM_MAIN, SYSTEM_SUB);
        if (codes == null || codes.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> normalized = new HashSet<>();
        for (String code : codes) {
            if (code != null && !code.isBlank()) {
                normalized.add(code.trim());
            }
        }
        if (normalized.isEmpty()) {
            return Collections.emptySet();
        }
        return normalized;
    }

    private String permissionCacheKey(String authGroup) {
        return authGroup + "|" + SYSTEM_MAIN + "|" + SYSTEM_SUB;
    }
}
