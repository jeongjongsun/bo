-- 상점 API 접속정보 샘플 데이터
-- 실행 순서: docs/ddl/om_store_connection_m.sql, docs/dml/om_mall_m_data_sample.sql(또는 om_mall_store_m 데이터) 적용 후 실행

INSERT INTO om_store_connection_m (store_id, connection_alias, api_id, api_password, client_id, site_code, redirect_uri, client_secret, scope, created_by)
SELECT s.store_id, '아임웹 메인', 'api_user_sample', '********', '8a188230-9578-46a0-9d3d-4e25554f6710', 'SITE001', 'https://daybarrier.co.kr/', '49158e6f-985e-426e-96d5-29c78958ffea', 'site-info:write promotion:write product:write order:write payment:write', 'system'
  FROM om_mall_store_m s
 WHERE s.mall_cd = 'MALL01' AND s.corporation_cd = 'CORP01' AND s.store_cd = 'STORE_11ST_01'
 LIMIT 1;

INSERT INTO om_store_connection_m (store_id, connection_alias, api_id, api_password, client_id, site_code, redirect_uri, client_secret, scope, created_by)
SELECT s.store_id, '아임웹 서브', NULL, NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SITE002', 'https://example.com/callback', 'secret-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'site-info:read product:read order:read', 'system'
  FROM om_mall_store_m s
 WHERE s.mall_cd = 'MALL01' AND s.corporation_cd = 'CORP01' AND s.store_cd = 'STORE_11ST_01'
 LIMIT 1;

INSERT INTO om_store_connection_m (store_id, connection_alias, api_id, api_password, client_id, site_code, redirect_uri, client_secret, scope, created_by)
SELECT s.store_id, 'G마켓 API 계정', 'gmarket_api_id', NULL, 'gmarket-client-uuid-here', 'GMKT_STORE_01', 'https://daybarrier.co.kr/gmarket/callback', 'gmarket-client-secret', 'product:write order:read payment:read', 'system'
  FROM om_mall_store_m s
 WHERE s.mall_cd = 'MALL02' AND s.corporation_cd = 'CORP01' AND s.store_cd = 'STORE_GMKT_01'
 LIMIT 1;

INSERT INTO om_store_connection_m (store_id, connection_alias, api_id, api_password, client_id, site_code, redirect_uri, client_secret, scope, created_by)
SELECT s.store_id, 'Amazon SP-API', NULL, NULL, 'amzn1.application-oa2-client.xxxx', 'AMZ_SELLER_01', 'https://daybarrier.co.kr/amazon/callback', 'amzn1.oa2-cs.v1.xxxx', 'orders:read catalog:read', 'system'
  FROM om_mall_store_m s
 WHERE s.mall_cd = 'MALL03' AND s.corporation_cd = 'CORP01' AND s.store_cd = 'STORE_AMZ_01'
 LIMIT 1;
