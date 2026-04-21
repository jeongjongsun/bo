package com.shopeasy.service;

import com.shopeasy.dto.AuthGroupOptionDto;
import com.shopeasy.mapper.OmAuthGroupMMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** 권한 그룹 마스터 (OM_AUTH_GROUP_M). */
@Service
public class AuthGroupService {

    private final OmAuthGroupMMapper authGroupMapper;

    public AuthGroupService(OmAuthGroupMMapper authGroupMapper) {
        this.authGroupMapper = authGroupMapper;
    }

    @Transactional(readOnly = true)
    public List<AuthGroupOptionDto> getActiveOptions() {
        return authGroupMapper.selectActiveOptions();
    }
}
