package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.CodeItem;
import com.shopeasy.dto.UserDetailResponse;
import com.shopeasy.dto.UserDetailUpdateRequest;
import com.shopeasy.dto.UserFieldUpdateRequest;
import com.shopeasy.dto.UserListItem;
import com.shopeasy.dto.UserManageRow;
import com.shopeasy.dto.UserRegisterRequest;
import com.shopeasy.entity.OmUserM;
import com.shopeasy.mapper.OmAuthGroupMMapper;
import com.shopeasy.mapper.OmUserMMapper;
import com.shopeasy.util.PasswordPolicy;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.i18n.LocaleContextHolder;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 사용자 목록·관리 (OM_USER_M). 페이징·검색·그리드 필드 수정·상세·등록·엑셀.
 */
@Service
public class UserService {

    public static final String MAIN_CD_USER_GRADE = "USER_GRADE";

    private static final Set<String> GRID_EDITABLE_FIELDS =
            Set.of("userNm", "emailId", "gradeCd", "authGroup", "userStatus");

    private static final Set<String> ALLOWED_USER_STATUS = Set.of("ACTIVE", "INACTIVE", "LOCKED");
    private static final int EXPORT_PAGE_SIZE = 1000;
    private static final int EXPORT_ROW_WINDOW = 100;

    private static final String[] EXPORT_HEADERS_KO = {
            "아이디", "이름", "이메일", "등급코드", "등급명", "권한코드", "권한그룹명", "상태", "최종 로그인", "등록일시"
    };
    private static final String[] EXPORT_HEADERS_EN = {
            "User ID", "Name", "Email", "Grade Code", "Grade Name", "Auth Code", "Auth Group", "Status",
            "Last Login", "Created At"
    };

    private final OmUserMMapper userMapper;
    private final OmAuthGroupMMapper authGroupMapper;
    private final CodeService codeService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public UserService(
            OmUserMMapper userMapper,
            OmAuthGroupMMapper authGroupMapper,
            CodeService codeService,
            AuthService authService,
            ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.authGroupMapper = authGroupMapper;
        this.codeService = codeService;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PagedData<UserListItem> getUserList(String keyword, int page, int size) {
        int validatedSize = size > 0 ? size : 0;
        int offset = validatedSize > 0 ? page * validatedSize : 0;
        long total = userMapper.selectUserListCount(keyword);
        List<UserListItem> items = userMapper.selectUserList(keyword, validatedSize, offset);
        int totalPages = validatedSize > 0 ? (int) Math.ceil((double) total / validatedSize) : 0;
        return new PagedData<>(items, page, validatedSize, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    @Transactional(readOnly = true)
    public PagedData<UserManageRow> getManageList(
            String keyword, String gradeCd, String authGroup, String lang, int page, int size) {
        String kw = normalizeKeyword(keyword);
        String g = normalizeKeyword(gradeCd);
        String ag = normalizeKeyword(authGroup);
        int offset = page * size;
        long total = userMapper.selectManageListCount(kw, g, ag);
        List<UserManageRow> items = userMapper.selectManageList(kw, g, ag, size, offset);
        fillGradeNames(items, lang != null && !lang.isBlank() ? lang.trim() : "ko");
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    @Transactional(readOnly = true)
    public byte[] exportManageExcel(String keyword, String gradeCd, String authGroup, String lang) {
        String kw = normalizeKeyword(keyword);
        String g = normalizeKeyword(gradeCd);
        String ag = normalizeKeyword(authGroup);
        String l = lang != null && lang.toLowerCase().startsWith("ko") ? "ko" : "en";
        boolean ko = "ko".equals(l);
        String[] headers = ko ? EXPORT_HEADERS_KO : EXPORT_HEADERS_EN;
        try (SXSSFWorkbook wb = new SXSSFWorkbook(EXPORT_ROW_WINDOW);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.setCompressTempFiles(true);
            SXSSFSheet sheet = wb.createSheet("Users");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            int rowIdx = 1;
            int page = 0;
            while (true) {
                int offset = page * EXPORT_PAGE_SIZE;
                List<UserManageRow> rows = userMapper.selectManageList(kw, g, ag, EXPORT_PAGE_SIZE, offset);
                if (rows.isEmpty()) {
                    break;
                }
                fillGradeNames(rows, l);
                for (UserManageRow r : rows) {
                    Row row = sheet.createRow(rowIdx++);
                    setCell(row, 0, r.getUserId());
                    setCell(row, 1, r.getUserNm());
                    setCell(row, 2, r.getEmailId());
                    setCell(row, 3, r.getGradeCd());
                    setCell(row, 4, r.getGradeNm());
                    setCell(row, 5, r.getAuthGroup());
                    setCell(row, 6, r.getAuthGroupNm());
                    setCell(row, 7, r.getUserStatus());
                    setCell(row, 8, r.getLastLoginDtm());
                    setCell(row, 9, r.getCreatedAt());
                }
                sheet.flushRows(EXPORT_ROW_WINDOW);
                if (rows.size() < EXPORT_PAGE_SIZE) {
                    break;
                }
                page++;
            }
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException(MessageKeys.USERS_EXCEL_EXPORT_FAILED, e);
        }
    }

    private static void setCell(Row row, int col, String value) {
        if (value != null) {
            row.createCell(col).setCellValue(value);
        } else {
            row.createCell(col);
        }
    }

    private void fillGradeNames(List<UserManageRow> rows, String lang) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        List<CodeItem> codes = codeService.getCodeList(MAIN_CD_USER_GRADE, lang);
        Map<String, String> map = codes.stream()
                .filter(c -> c.getSubCd() != null)
                .collect(Collectors.toMap(CodeItem::getSubCd, c -> c.getCodeNm() != null ? c.getCodeNm() : "", (a, b) -> a));
        for (UserManageRow r : rows) {
            if (r.getGradeCd() != null && map.containsKey(r.getGradeCd())) {
                r.setGradeNm(map.get(r.getGradeCd()));
            }
        }
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_ID_REQUIRED);
        }
        UserDetailResponse d = userMapper.selectUserDetailResponse(userId.trim());
        if (d == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        return d;
    }

    @Transactional
    public void updateUserField(UserFieldUpdateRequest request, String updatedBy) {
        if (request == null || request.getUserId() == null || request.getUserId().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_ID_REQUIRED);
        }
        String field = request.getField();
        if (field == null || field.isBlank() || !GRID_EDITABLE_FIELDS.contains(field)) {
            throw new IllegalArgumentException(MessageKeys.USERS_INVALID_FIELD);
        }
        String uid = request.getUserId().trim();
        OmUserM row = userMapper.selectByUserId(uid);
        if (row == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        switch (field) {
            case "userNm" -> {
                String nm = valueToString(request.getValue());
                if (nm == null || nm.isBlank()) {
                    throw new IllegalArgumentException(MessageKeys.USERS_USER_NM_REQUIRED);
                }
                userMapper.updateUserNm(uid, nm.trim(), updatedBy);
            }
            case "emailId" -> {
                String email = valueToString(request.getValue());
                if (email == null || email.isBlank()) {
                    throw new IllegalArgumentException(MessageKeys.USERS_EMAIL_REQUIRED);
                }
                mergeUserInfoKey(row, uid, "email_id", email.trim(), updatedBy);
            }
            case "gradeCd" -> {
                String grade = valueToString(request.getValue());
                if (grade == null || grade.isBlank()) {
                    throw new IllegalArgumentException(MessageKeys.USERS_GRADE_NOT_FOUND);
                }
                String g = grade.trim();
                assertGradeExists(g);
                mergeUserInfoKey(row, uid, "grade_cd", g, updatedBy);
            }
            case "authGroup" -> {
                String ag = valueToString(request.getValue());
                if (ag == null || ag.isBlank()) {
                    throw new IllegalArgumentException(MessageKeys.USERS_AUTH_GROUP_NOT_FOUND);
                }
                String code = ag.trim();
                assertAuthGroupExists(code);
                mergeUserInfoKey(row, uid, "auth_group", code, updatedBy);
            }
            case "userStatus" -> {
                String st = valueToString(request.getValue());
                if (st == null || !ALLOWED_USER_STATUS.contains(st.trim())) {
                    throw new IllegalArgumentException(MessageKeys.USERS_USER_STATUS_INVALID);
                }
                mergeUserInfoKey(row, uid, "user_status", st.trim(), updatedBy);
            }
            default -> throw new IllegalArgumentException(MessageKeys.USERS_INVALID_FIELD);
        }
    }

    @Transactional
    public void updateUserDetail(UserDetailUpdateRequest request, String updatedBy) {
        if (request == null || request.getUserId() == null || request.getUserId().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_ID_REQUIRED);
        }
        String uid = request.getUserId().trim();
        OmUserM row = userMapper.selectByUserId(uid);
        if (row == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        if (request.getUserNm() == null || request.getUserNm().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_NM_REQUIRED);
        }
        String email = request.getEmailId() != null ? request.getEmailId().trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException(MessageKeys.USERS_EMAIL_REQUIRED);
        }
        if (request.getAuthGroup() == null || request.getAuthGroup().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_AUTH_GROUP_NOT_FOUND);
        }
        assertAuthGroupExists(request.getAuthGroup().trim());
        if (request.getUserStatus() == null || !ALLOWED_USER_STATUS.contains(request.getUserStatus().trim())) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_STATUS_INVALID);
        }
        if (request.getGradeCd() != null && !request.getGradeCd().isBlank()) {
            assertGradeExists(request.getGradeCd().trim());
        }
        String np = request.getNewPassword();
        if (np != null && !np.isBlank()) {
            String policyErr = PasswordPolicy.validate(np);
            if (policyErr != null) {
                throw new IllegalArgumentException(policyErr);
            }
        }

        Map<String, Object> userInfoMap = row.getUserInfoMap();
        Map<String, Object> m = userInfoMap == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(userInfoMap);
        m.put("email_id", email);
        m.put("auth_group", request.getAuthGroup().trim());
        m.put("user_status", request.getUserStatus().trim());
        if (request.getGradeCd() == null || request.getGradeCd().isBlank()) {
            m.remove("grade_cd");
        } else {
            m.put("grade_cd", request.getGradeCd().trim());
        }
        if (request.getMobileNo() != null) {
            String mob = request.getMobileNo().trim();
            if (mob.isEmpty()) {
                m.remove("mobile_no");
            } else {
                m.put("mobile_no", mob);
            }
        }
        if (request.getCorporationCd() != null) {
            String corp = request.getCorporationCd().trim();
            if (corp.isEmpty()) {
                m.remove("corporation_cd");
            } else {
                m.put("corporation_cd", corp);
            }
        }
        if (np != null && !np.isBlank()) {
            m.put("password", authService.encodePassword(np));
            m.put("password_fail_cnt", 0);
        }

        userMapper.updateUserNm(uid, request.getUserNm().trim(), updatedBy);
        try {
            userMapper.updateUserInfoJsonWithAudit(uid, objectMapper.writeValueAsString(m), updatedBy);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @Transactional
    public UserDetailResponse registerUser(UserRegisterRequest request, String createdBy) {
        if (request == null || request.getUserId() == null || request.getUserId().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_ID_REQUIRED);
        }
        if (request.getUserNm() == null || request.getUserNm().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_NM_REQUIRED);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.SETTINGS_PROFILE_PASSWORD_REQUIRED);
        }
        String policyErr = PasswordPolicy.validate(request.getPassword());
        if (policyErr != null) {
            throw new IllegalArgumentException(policyErr);
        }
        String email = request.getEmailId() != null ? request.getEmailId().trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException(MessageKeys.USERS_EMAIL_REQUIRED);
        }
        if (request.getAuthGroup() == null || request.getAuthGroup().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.USERS_AUTH_GROUP_NOT_FOUND);
        }
        assertAuthGroupExists(request.getAuthGroup().trim());
        if (request.getUserStatus() == null || !ALLOWED_USER_STATUS.contains(request.getUserStatus().trim())) {
            throw new IllegalArgumentException(MessageKeys.USERS_USER_STATUS_INVALID);
        }
        if (request.getGradeCd() != null && !request.getGradeCd().isBlank()) {
            assertGradeExists(request.getGradeCd().trim());
        }

        String uid = request.getUserId().trim();
        if (userMapper.selectByUserId(uid) != null) {
            throw new IllegalArgumentException(MessageKeys.USERS_DUPLICATE_USER_ID);
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("password", authService.encodePassword(request.getPassword()));
        m.put("password_fail_cnt", 0);
        m.put("user_status", request.getUserStatus().trim());
        m.put("auth_group", request.getAuthGroup().trim());
        m.put("email_id", email);
        m.put("privacy_access", "N");
        m.put("second_auth_yn", "N");
        m.put("access_ip_limit", "N");
        m.put("access_ip", List.of());
        if (request.getGradeCd() != null && !request.getGradeCd().isBlank()) {
            m.put("grade_cd", request.getGradeCd().trim());
        }
        if (request.getMobileNo() != null && !request.getMobileNo().isBlank()) {
            m.put("mobile_no", request.getMobileNo().trim());
        }
        if (request.getCorporationCd() != null && !request.getCorporationCd().isBlank()) {
            m.put("corporation_cd", request.getCorporationCd().trim());
        }

        try {
            userMapper.insertUser(uid, request.getUserNm().trim(), objectMapper.writeValueAsString(m), createdBy);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        UserDetailResponse created = userMapper.selectUserDetailResponse(uid);
        if (created == null) {
            throw new IllegalStateException(MessageKeys.ERROR_NOT_FOUND);
        }
        return created;
    }

    private void mergeUserInfoKey(OmUserM row, String userId, String jsonKey, String value, String updatedBy) {
        try {
            Map<String, Object> userInfoMap = row.getUserInfoMap();
            Map<String, Object> m = userInfoMap == null
                    ? new LinkedHashMap<>()
                    : new LinkedHashMap<>(userInfoMap);
            m.put(jsonKey, value);
            userMapper.updateUserInfoJsonWithAudit(userId, objectMapper.writeValueAsString(m), updatedBy);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private void assertAuthGroupExists(String authGroupCd) {
        if (authGroupMapper.countByCd(authGroupCd) <= 0) {
            throw new IllegalArgumentException(MessageKeys.USERS_AUTH_GROUP_NOT_FOUND);
        }
    }

    private void assertGradeExists(String gradeCd) {
        List<CodeItem> codes = codeService.getCodeList(
                MAIN_CD_USER_GRADE,
                LocaleContextHolder.getLocale().getLanguage());
        boolean ok = codes.stream().anyMatch(c -> gradeCd.equals(c.getSubCd()));
        if (!ok) {
            throw new IllegalArgumentException(MessageKeys.USERS_GRADE_NOT_FOUND);
        }
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String t = keyword.trim();
        return t.isEmpty() ? null : t;
    }

    private static String valueToString(Object value) {
        if (value == null) {
            return null;
        }
        return value.toString();
    }
}
