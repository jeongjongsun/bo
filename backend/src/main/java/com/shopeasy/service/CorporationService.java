package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.api.PagedData;
import com.shopeasy.dto.CorporationCreateRequest;
import com.shopeasy.dto.CorporationDetailResponse;
import com.shopeasy.dto.CorporationDetailUpdateRequest;
import com.shopeasy.dto.CorporationFieldUpdateRequest;
import com.shopeasy.dto.CorporationItem;
import com.shopeasy.dto.CorporationManageRow;
import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.mapper.OmCorporationMMapper;
import org.apache.poi.ss.usermodel.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 법인(화주사) 서비스 (OM_CORPORATION_M). 상단 법인 선택용 목록 + 화주 관리 화면용 API.
 */
@Service
public class CorporationService {

    private static final Logger log = LoggerFactory.getLogger(CorporationService.class);

    private static final Set<String> GRID_EDITABLE_FIELDS = Set.of("corporationNm", "businessNo", "telNo", "email");

    private static final String[] EXPORT_HEADERS_KO = {
            "화주코드", "화주명", "사업자등록번호", "대표전화", "대표이메일", "등록일시"
    };
    private static final String[] EXPORT_HEADERS_EN = {
            "Corporation Code", "Corporation Name", "Business No.", "Tel", "Email", "Created At"
    };

    /**
     * 동시 등록 시 corporation_cd(PK) 충돌 후 재채번 시도 횟수.
     * INSERT는 트랜잭션마다 커밋/롤백이 분리되어야 하므로 {@link TransactionDefinition#PROPAGATION_REQUIRES_NEW} 로만 수행한다.
     */
    private static final int CREATE_CORPORATION_MAX_ATTEMPTS = 5;

    private final OmCorporationMMapper corporationMapper;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;
    /** PK 중복 시에만 롤백되는 짧은 트랜잭션 (PostgreSQL: 동일 트랜잭션 내 재시도 불가 문제 회피). */
    private final TransactionTemplate insertCorporationTxTemplate;

    public CorporationService(
            OmCorporationMMapper corporationMapper,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager,
            AuditService auditService) {
        this.corporationMapper = corporationMapper;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
        this.insertCorporationTxTemplate = new TransactionTemplate(Objects.requireNonNull(transactionManager));
        this.insertCorporationTxTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** 활성 법인 목록 (corporation_cd, corporation_nm 등) */
    @Transactional(readOnly = true)
    public List<CorporationItem> getCorporationList() {
        return corporationMapper.selectCorporationList();
    }

    @Transactional(readOnly = true)
    public PagedData<CorporationManageRow> getManageList(String keyword, int page, int size) {
        String kw = normalizeKeyword(keyword);
        int offset = page * size;
        long total = corporationMapper.selectManageListCount(kw);
        List<CorporationManageRow> items = corporationMapper.selectManageList(kw, size, offset);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedData<>(items, page, size, total, totalPages,
                page == 0, page >= Math.max(0, totalPages - 1), null);
    }

    @Transactional(readOnly = true)
    public byte[] exportManageExcel(String keyword, String lang) {
        String kw = normalizeKeyword(keyword);
        List<CorporationManageRow> rows = corporationMapper.selectManageExportList(kw);
        boolean ko = lang != null && lang.toLowerCase().startsWith("ko");
        String[] headers = ko ? EXPORT_HEADERS_KO : EXPORT_HEADERS_EN;
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Corporations");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            int rowIdx = 1;
            for (CorporationManageRow r : rows) {
                Row row = sheet.createRow(rowIdx++);
                setCell(row, 0, r.getCorporationCd());
                setCell(row, 1, r.getCorporationNm());
                setCell(row, 2, r.getBusinessNo());
                setCell(row, 3, r.getTelNo());
                setCell(row, 4, r.getEmail());
                setCell(row, 5, r.getCreatedAt());
            }
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("corporations.excel_export_failed", e);
        }
    }

    private static void setCell(Row row, int col, String value) {
        if (value != null) {
            row.createCell(col).setCellValue(value);
        } else {
            row.createCell(col);
        }
    }

    @Transactional(readOnly = true)
    public CorporationDetailResponse getCorporationDetail(String corporationCd) {
        if (corporationCd == null || corporationCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_CD_REQUIRED);
        }
        CorporationDetailResponse detail = corporationMapper.selectCorporationDetail(corporationCd.trim());
        if (detail == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        return detail;
    }

    @Transactional
    public void updateCorporationField(CorporationFieldUpdateRequest request, String userId) {
        if (request == null || request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_CD_REQUIRED);
        }
        String field = request.getField();
        if (field == null || field.isBlank() || !GRID_EDITABLE_FIELDS.contains(field)) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_INVALID_FIELD);
        }
        String cd = request.getCorporationCd().trim();
        CorporationManageRow beforeRow = corporationMapper.selectManageRow(cd);
        if (beforeRow == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        String beforeValue = switch (field) {
            case "corporationNm" -> beforeRow.getCorporationNm();
            case "businessNo" -> beforeRow.getBusinessNo();
            case "telNo" -> beforeRow.getTelNo();
            case "email" -> beforeRow.getEmail();
            default -> null;
        };
        String afterValue;
        if ("corporationNm".equals(field)) {
            String nm = valueToString(request.getValue());
            if (nm == null || nm.isBlank()) {
                throw new IllegalArgumentException(MessageKeys.CORPORATIONS_NM_REQUIRED);
            }
            corporationMapper.updateCorporationNm(cd, nm.trim(), userId);
            afterValue = nm.trim();
            recordAudit("UPDATE", cd, userId,
                    Map.of("field", field, "value", beforeValue != null ? beforeValue : ""),
                    Map.of("field", field, "value", afterValue));
            return;
        }
        String jsonKey = jsonKeyForGridField(field);
        String newVal = valueToString(request.getValue());
        if (newVal == null) {
            newVal = "";
        }
        Map<String, Object> merged = readMergedInfo(cd);
        merged.put(jsonKey, newVal);
        corporationMapper.updateCorporationInfoJson(cd, toJson(merged), userId);
        afterValue = newVal;
        recordAudit("UPDATE", cd, userId,
                Map.of("field", field, "value", beforeValue != null ? beforeValue : ""),
                Map.of("field", field, "value", afterValue));
    }

    private static String jsonKeyForGridField(String field) {
        return switch (field) {
            case "businessNo" -> "business_no";
            case "telNo" -> "tel_no";
            case "email" -> "email";
            default -> field;
        };
    }

    @Transactional
    public void updateCorporationDetail(CorporationDetailUpdateRequest request, String userId) {
        if (request == null || request.getCorporationCd() == null || request.getCorporationCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_CD_REQUIRED);
        }
        String cd = request.getCorporationCd().trim();
        CorporationManageRow beforeRow = corporationMapper.selectManageRow(cd);
        if (beforeRow == null) {
            throw new IllegalArgumentException(MessageKeys.ERROR_NOT_FOUND);
        }
        if (request.getCorporationNm() == null || request.getCorporationNm().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_NM_REQUIRED);
        }
        Map<String, Object> merged = readMergedInfo(cd);
        merged.put("business_no", nullToEmpty(request.getBusinessNo()));
        merged.put("tel_no", nullToEmpty(request.getTelNo()));
        merged.put("email", nullToEmpty(request.getEmail()));
        merged.put("ceo_nm", nullToEmpty(request.getCeoNm()));
        merged.put("address", nullToEmpty(request.getAddress()));
        merged.put("fax_no", nullToEmpty(request.getFaxNo()));
        merged.put("homepage_url", nullToEmpty(request.getHomepageUrl()));
        merged.put("remark", nullToEmpty(request.getRemark()));
        corporationMapper.updateCorporationRow(cd, request.getCorporationNm().trim(), toJson(merged), userId);
        Map<String, Object> before = Map.of(
                "corporationNm", beforeRow.getCorporationNm() != null ? beforeRow.getCorporationNm() : "",
                "businessNo", beforeRow.getBusinessNo() != null ? beforeRow.getBusinessNo() : "",
                "telNo", beforeRow.getTelNo() != null ? beforeRow.getTelNo() : "",
                "email", beforeRow.getEmail() != null ? beforeRow.getEmail() : "");
        Map<String, Object> after = Map.of(
                "corporationNm", request.getCorporationNm().trim(),
                "businessNo", nullToEmpty(request.getBusinessNo()),
                "telNo", nullToEmpty(request.getTelNo()),
                "email", nullToEmpty(request.getEmail()));
        recordAudit("UPDATE", cd, userId, before, after);
    }

    private static String nullToEmpty(String s) {
        return s != null ? s : "";
    }

    /**
     * 법인 신규 등록. corporation_cd 는 PK(유니크) 보장 하에 자동 채번 후 INSERT 하며,
     * 동시성으로 인한 중복 키는 {@link DataIntegrityViolationException} 을 잡아 재채번·재시도한다.
     */
    public CorporationDetailResponse createCorporation(CorporationCreateRequest request, String userId) {
        if (request == null || request.getCorporationNm() == null || request.getCorporationNm().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CORPORATIONS_NM_REQUIRED);
        }
        String nm = request.getCorporationNm().trim();
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("business_no", nullToEmpty(request.getBusinessNo()));
        info.put("tel_no", nullToEmpty(request.getTelNo()));
        info.put("email", nullToEmpty(request.getEmail()));
        info.put("ceo_nm", nullToEmpty(request.getCeoNm()));
        info.put("address", nullToEmpty(request.getAddress()));
        info.put("fax_no", nullToEmpty(request.getFaxNo()));
        info.put("homepage_url", nullToEmpty(request.getHomepageUrl()));
        info.put("remark", nullToEmpty(request.getRemark()));
        String json = toJson(info);
        DataIntegrityViolationException lastDuplicate = null;
        for (int attempt = 0; attempt < CREATE_CORPORATION_MAX_ATTEMPTS; attempt++) {
            final String cd = allocateCorporationCd();
            try {
                insertCorporationTxTemplate.executeWithoutResult(status -> {
                    int rows = corporationMapper.insertCorporation(cd, nm, json, userId);
                    if (rows == 0) {
                        throw new IllegalArgumentException(MessageKeys.ERROR_BAD_REQUEST);
                    }
                    recordAudit("CREATE", cd, userId, Map.of(), Map.of("corporationNm", nm));
                });
                return getCorporationDetail(cd);
            } catch (DataIntegrityViolationException e) {
                lastDuplicate = e;
                log.warn("법인 등록 corporation_cd 충돌, 재시도 {}/{}, cd={}",
                        attempt + 1, CREATE_CORPORATION_MAX_ATTEMPTS, cd, e);
                if (attempt >= CREATE_CORPORATION_MAX_ATTEMPTS - 1) {
                    throw new IllegalArgumentException(MessageKeys.CORPORATIONS_CREATE_RETRY_EXHAUSTED, lastDuplicate);
                }
            }
        }
        throw new IllegalArgumentException(MessageKeys.CORPORATIONS_CREATE_RETRY_EXHAUSTED, lastDuplicate);
    }

    /**
     * {@code CORP-####} (4자리, 앞자리 0 패딩) 자동 채번. 동시성은 INSERT 시 PK 유니크 위반 후 재시도로 해소.
     */
    private String allocateCorporationCd() {
        int max = corporationMapper.selectMaxCorpSerial();
        for (int n = max + 1; n <= 9999; n++) {
            String candidate = String.format("CORP-%04d", n);
            if (corporationMapper.selectManageRow(candidate) == null) {
                return candidate;
            }
        }
        for (int n = 1; n <= max; n++) {
            String candidate = String.format("CORP-%04d", n);
            if (corporationMapper.selectManageRow(candidate) == null) {
                return candidate;
            }
        }
        throw new IllegalArgumentException(MessageKeys.CORPORATIONS_SERIAL_EXHAUSTED);
    }

    private Map<String, Object> readMergedInfo(String corporationCd) {
        String raw = corporationMapper.selectCorporationInfoJson(corporationCd);
        return parseInfoJson(raw);
    }

    private Map<String, Object> parseInfoJson(String raw) {
        if (raw == null || raw.isBlank() || "{}".equals(raw.trim())) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private String toJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(MessageKeys.ERROR_BAD_REQUEST, e);
        }
    }

    private static String valueToString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String t = keyword.trim();
        return t.isEmpty() ? null : t;
    }

    private void recordAudit(String actionCode, String entityId, String actorUserId, Map<String, Object> before, Map<String, Object> after) {
        try {
            AuditLogCommand cmd = new AuditLogCommand();
            cmd.setDomainType("CORPORATION");
            cmd.setSystemMainCd("SYSTEM");
            cmd.setSystemSubCd("BO");
            cmd.setMenuCode("basic-shipper");
            cmd.setMenuNameKo("화주(법인) 정보");
            cmd.setActionCode(actionCode);
            cmd.setEntityType("om_corporation_m");
            cmd.setEntityId(entityId);
            cmd.setBeforeData(objectMapper.writeValueAsString(before != null ? before : Map.of()));
            cmd.setAfterData(objectMapper.writeValueAsString(after != null ? after : Map.of()));
            cmd.setChangedFields("[]");
            cmd.setActorUserId(actorUserId != null && !actorUserId.isBlank() ? actorUserId : "system");
            auditService.record(cmd);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
