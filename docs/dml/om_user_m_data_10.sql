-- 사용자 10명 샘플 데이터
-- 비밀번호: 모두 1111 (bcrypt 해시 동일 값 사용)
-- 해시: $2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW

INSERT INTO om_user_m (user_id, user_nm, user_info, is_deleted) VALUES
('user01@example.com', '사용자01', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user02@example.com', '사용자02', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user03@example.com', '사용자03', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user04@example.com', '사용자04', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user05@example.com', '사용자05', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user06@example.com', '사용자06', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user07@example.com', '사용자07', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user08@example.com', '사용자08', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user09@example.com', '사용자09', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false),
('user10@example.com', '사용자10', '{"password":"$2a$10$SQzvwI3kW3iQh4ioJHhd3ujinMQzuqtUFXJ37LjUmQ.I09upDJVzW","user_status":"ACTIVE","auth_group":"USER","password_fail_cnt":0}'::jsonb, false)
ON CONFLICT (user_id) DO NOTHING;
