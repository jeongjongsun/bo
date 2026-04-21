package com.shopeasy.mapper;

import com.shopeasy.dto.StoreConnectionItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 상점 API 접속정보 (om_store_connection_m). 1:N.
 */
@Mapper
public interface OmStoreConnectionMapper {

    List<StoreConnectionItem> selectByStoreId(@Param("storeId") long storeId);

    int insert(@Param("storeId") long storeId,
               @Param("connectionAlias") String connectionAlias,
               @Param("apiId") String apiId,
               @Param("apiPassword") String apiPassword,
               @Param("clientId") String clientId,
               @Param("siteCode") String siteCode,
               @Param("redirectUri") String redirectUri,
               @Param("clientSecret") String clientSecret,
               @Param("scope") String scope,
               @Param("createdBy") String createdBy);

    int update(@Param("connectionId") long connectionId,
               @Param("connectionAlias") String connectionAlias,
               @Param("apiId") String apiId,
               @Param("apiPassword") String apiPassword,
               @Param("clientId") String clientId,
               @Param("siteCode") String siteCode,
               @Param("redirectUri") String redirectUri,
               @Param("clientSecret") String clientSecret,
               @Param("scope") String scope,
               @Param("updatedBy") String updatedBy);

    int delete(@Param("connectionId") long connectionId);
}
