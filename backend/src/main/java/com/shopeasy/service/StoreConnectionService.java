package com.shopeasy.service;

import com.shopeasy.dto.StoreConnectionItem;
import com.shopeasy.dto.StoreConnectionSaveRequest;
import com.shopeasy.mapper.OmStoreConnectionMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 상점별 API 접속정보 (1:N) CRUD.
 */
@Service
public class StoreConnectionService {

    private final OmStoreConnectionMapper connectionMapper;

    public StoreConnectionService(OmStoreConnectionMapper connectionMapper) {
        this.connectionMapper = connectionMapper;
    }

    @Transactional(readOnly = true)
    public List<StoreConnectionItem> listByStoreId(long storeId) {
        return connectionMapper.selectByStoreId(storeId);
    }

    @Transactional
    public void create(long storeId, StoreConnectionSaveRequest req, String createdBy) {
        if (req.getConnectionAlias() == null || req.getConnectionAlias().isBlank()) {
            throw new IllegalArgumentException("connection_alias is required");
        }
        connectionMapper.insert(
                storeId,
                req.getConnectionAlias().trim(),
                trim(req.getApiId()),
                trim(req.getApiPassword()),
                trim(req.getClientId()),
                trim(req.getSiteCode()),
                trim(req.getRedirectUri()),
                trim(req.getClientSecret()),
                trim(req.getScope()),
                createdBy);
    }

    @Transactional
    public void update(long connectionId, StoreConnectionSaveRequest req, String updatedBy) {
        if (req.getConnectionAlias() == null || req.getConnectionAlias().isBlank()) {
            throw new IllegalArgumentException("connection_alias is required");
        }
        int rows = connectionMapper.update(
                connectionId,
                req.getConnectionAlias().trim(),
                trim(req.getApiId()),
                trim(req.getApiPassword()),
                trim(req.getClientId()),
                trim(req.getSiteCode()),
                trim(req.getRedirectUri()),
                trim(req.getClientSecret()),
                trim(req.getScope()),
                updatedBy);
        if (rows == 0) {
            throw new IllegalArgumentException("Connection not found: connectionId=" + connectionId);
        }
    }

    @Transactional
    public void delete(long connectionId) {
        int rows = connectionMapper.delete(connectionId);
        if (rows == 0) {
            throw new IllegalArgumentException("Connection not found: connectionId=" + connectionId);
        }
    }

    private static String trim(String s) {
        return s != null ? s.trim() : null;
    }
}
