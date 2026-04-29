package com.shopeasy.service;

import com.shopeasy.dto.SystemConfigDto;
import com.shopeasy.mapper.OmConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemConfigService {

    private final OmConfigMapper configMapper;

    public SystemConfigService(OmConfigMapper configMapper) {
        this.configMapper = configMapper;
    }

    @Transactional(readOnly = true)
    public SystemConfigDto getConfig() {
        SystemConfigDto dto = configMapper.selectSystemConfig();
        if (dto != null) {
            return dto;
        }
        return defaultConfig();
    }

    @Transactional
    public SystemConfigDto saveConfig(SystemConfigDto request) {
        configMapper.insertDefaultRowIfAbsent();
        SystemConfigDto next = normalize(request);
        next.setId(1);
        configMapper.updateSystemConfig(next);
        return getConfig();
    }

    private SystemConfigDto normalize(SystemConfigDto in) {
        SystemConfigDto dto = new SystemConfigDto();
        dto.setMaxPasswordFailCount(positiveOrDefault(in.getMaxPasswordFailCount(), 5));
        dto.setMaxInactiveLoginDays(nonNegativeOrDefault(in.getMaxInactiveLoginDays(), 90));
        dto.setAllowDuplicateLogin(Boolean.TRUE.equals(in.getAllowDuplicateLogin()));
        dto.setSmtpHost(trimToNull(in.getSmtpHost()));
        dto.setSmtpPort(positiveOrNull(in.getSmtpPort()));
        dto.setSmtpUsername(trimToNull(in.getSmtpUsername()));
        dto.setSmtpPasswordEnc(trimToNull(in.getSmtpPasswordEnc()));
        dto.setSmtpFromEmail(trimToNull(in.getSmtpFromEmail()));
        dto.setSmtpFromName(trimToNull(in.getSmtpFromName()));
        dto.setSmtpUseTls(in.getSmtpUseTls() == null || in.getSmtpUseTls());
        dto.setSmtpUseSsl(Boolean.TRUE.equals(in.getSmtpUseSsl()));
        dto.setSmtpAuthRequired(in.getSmtpAuthRequired() == null || in.getSmtpAuthRequired());
        dto.setSmtpConnectionTimeoutMs(nonNegativeOrDefault(in.getSmtpConnectionTimeoutMs(), 10000));
        dto.setSmtpReadTimeoutMs(nonNegativeOrDefault(in.getSmtpReadTimeoutMs(), 10000));
        dto.setSmtpWriteTimeoutMs(nonNegativeOrDefault(in.getSmtpWriteTimeoutMs(), 10000));
        return dto;
    }

    private SystemConfigDto defaultConfig() {
        SystemConfigDto dto = new SystemConfigDto();
        dto.setId(1);
        dto.setMaxPasswordFailCount(5);
        dto.setMaxInactiveLoginDays(90);
        dto.setAllowDuplicateLogin(false);
        dto.setSmtpUseTls(true);
        dto.setSmtpUseSsl(false);
        dto.setSmtpAuthRequired(true);
        dto.setSmtpConnectionTimeoutMs(10000);
        dto.setSmtpReadTimeoutMs(10000);
        dto.setSmtpWriteTimeoutMs(10000);
        return dto;
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private static Integer positiveOrNull(Integer v) {
        return v != null && v > 0 ? v : null;
    }

    private static int positiveOrDefault(Integer v, int fallback) {
        return v != null && v > 0 ? v : fallback;
    }

    private static int nonNegativeOrDefault(Integer v, int fallback) {
        return v != null && v >= 0 ? v : fallback;
    }
}
