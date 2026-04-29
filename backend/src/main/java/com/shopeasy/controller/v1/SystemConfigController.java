package com.shopeasy.controller.v1;

import com.shopeasy.api.ApiResponse;
import com.shopeasy.dto.SystemConfigDto;
import com.shopeasy.service.SystemConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system-config")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    public SystemConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SystemConfigDto>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(systemConfigService.getConfig()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SystemConfigDto>> saveConfig(@RequestBody SystemConfigDto body) {
        return ResponseEntity.ok(ApiResponse.ok(systemConfigService.saveConfig(body == null ? new SystemConfigDto() : body)));
    }
}
