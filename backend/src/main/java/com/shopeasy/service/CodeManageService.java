package com.shopeasy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shopeasy.api.MessageKeys;
import com.shopeasy.config.CacheConfig;
import com.shopeasy.dto.CodeFieldUpdateRequest;
import com.shopeasy.dto.CodeManageDetailUpdateRequest;
import com.shopeasy.dto.CodeManageChildRegisterRequest;
import com.shopeasy.dto.CodeManageGroupRegisterRequest;
import com.shopeasy.dto.CodeManageRow;
import com.shopeasy.dto.CodeRowRaw;
import com.shopeasy.dto.AuditLogCommand;
import com.shopeasy.mapper.OmCodeMMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 공통코드(OM_CODE_M) 관리: 대분류(CODE) 그룹·하위 목록, 그리드/모달 갱신, 엑셀.
 */
@Service
public class CodeManageService {

    public static final String CODE_GROUP_MAIN = "CODE";

    private static final Set<String> GRID_EDITABLE_FIELDS =
            Set.of("codeNmKo", "codeNmEn", "useYn", "dispSeq", "etc1", "etc2");

    private static final int EXPORT_ROW_WINDOW = 100;

    private final OmCodeMMapper omCodeMMapper;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public CodeManageService(OmCodeMMapper omCodeMMapper, ObjectMapper objectMapper, AuditService auditService) {
        this.omCodeMMapper = omCodeMMapper;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<CodeManageRow> listGroups(String keyword) {
        String kw = normalizeKeyword(keyword);
        return omCodeMMapper.selectManageGroups(kw);
    }

    @Transactional(readOnly = true)
    public List<CodeManageRow> listDetails(String mainCd) {
        if (mainCd == null || mainCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_MAIN_CD_REQUIRED);
        }
        return omCodeMMapper.selectManageDetails(mainCd.trim());
    }

    @Transactional(readOnly = true)
    public CodeManageRow getRow(String mainCd, String subCd) {
        if (mainCd == null || mainCd.isBlank() || subCd == null || subCd.isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_SUB_CD_REQUIRED);
        }
        CodeRowRaw raw = omCodeMMapper.selectRaw(mainCd.trim(), subCd.trim());
        if (raw == null) {
            throw new IllegalArgumentException(MessageKeys.CODES_NOT_FOUND);
        }
        try {
            return mapRawToRow(raw);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @CacheEvict(cacheNames = CacheConfig.CACHE_CODE_LIST, allEntries = true)
    @Transactional
    public void updateField(CodeFieldUpdateRequest request, String updatedBy) {
        if (request == null
                || request.getMainCd() == null
                || request.getMainCd().isBlank()
                || request.getSubCd() == null
                || request.getSubCd().isBlank()
                || request.getField() == null
                || request.getField().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_SUB_CD_REQUIRED);
        }
        String field = request.getField().trim();
        if (!GRID_EDITABLE_FIELDS.contains(field)) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        String mainCd = request.getMainCd().trim();
        String subCd = request.getSubCd().trim();
        CodeRowRaw raw = omCodeMMapper.selectRaw(mainCd, subCd);
        if (raw == null) {
            throw new IllegalArgumentException(MessageKeys.CODES_NOT_FOUND);
        }
        try {
            ObjectNode codeNm = readObject(raw.getCodeNm());
            ObjectNode codeInfo = readObject(raw.getCodeInfo());
            String beforeData = objectMapper.writeValueAsString(buildCodeAuditState(mainCd, subCd, codeNm, codeInfo));
            applyGridField(field, request.getValue(), codeNm, codeInfo);
            persistJson(mainCd, subCd, codeNm, codeInfo, updatedBy);
            recordAudit("UPDATE", mainCd + ":" + subCd, updatedBy, beforeData,
                    objectMapper.writeValueAsString(buildCodeAuditState(mainCd, subCd, codeNm, codeInfo)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @CacheEvict(cacheNames = CacheConfig.CACHE_CODE_LIST, allEntries = true)
    @Transactional
    public void updateDetail(CodeManageDetailUpdateRequest request, String updatedBy) {
        if (request == null
                || request.getMainCd() == null
                || request.getMainCd().isBlank()
                || request.getSubCd() == null
                || request.getSubCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_SUB_CD_REQUIRED);
        }
        String mainCd = request.getMainCd().trim();
        String subCd = request.getSubCd().trim();
        CodeRowRaw raw = omCodeMMapper.selectRaw(mainCd, subCd);
        if (raw == null) {
            throw new IllegalArgumentException(MessageKeys.CODES_NOT_FOUND);
        }
        if (request.getCodeNmKo() == null || request.getCodeNmKo().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_CODE_NM_KO_REQUIRED);
        }
        if (request.getUseYn() == null || request.getUseYn().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_USE_YN_REQUIRED);
        }
        String ynUpdate = request.getUseYn().trim().toUpperCase();
        if (!"Y".equals(ynUpdate) && !"N".equals(ynUpdate)) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        try {
            ObjectNode codeNm = readObject(raw.getCodeNm());
            ObjectNode codeInfo = readObject(raw.getCodeInfo());
            String beforeData = objectMapper.writeValueAsString(buildCodeAuditState(mainCd, subCd, codeNm, codeInfo));
            codeNm.put("ko", request.getCodeNmKo().trim());
            if (request.getCodeNmEn() != null) {
                codeNm.put("en", request.getCodeNmEn().trim());
            }
            codeInfo.put("use_yn", ynUpdate);
            if (request.getDispSeq() != null) {
                codeInfo.put("disp_seq", request.getDispSeq());
            } else {
                codeInfo.remove("disp_seq");
            }
            if (request.getEtc1() != null) {
                codeInfo.put("etc1", request.getEtc1());
            }
            if (request.getEtc2() != null) {
                codeInfo.put("etc2", request.getEtc2());
            }
            persistJson(mainCd, subCd, codeNm, codeInfo, updatedBy);
            recordAudit("UPDATE", mainCd + ":" + subCd, updatedBy, beforeData,
                    objectMapper.writeValueAsString(buildCodeAuditState(mainCd, subCd, codeNm, codeInfo)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @CacheEvict(cacheNames = CacheConfig.CACHE_CODE_LIST, allEntries = true)
    @Transactional
    public void registerGroup(CodeManageGroupRegisterRequest request, String createdBy) {
        if (request == null || request.getSubCd() == null || request.getSubCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_SUB_CD_REQUIRED);
        }
        String subCd = request.getSubCd().trim().toUpperCase();
        if (subCd.length() > 50) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        if (omCodeMMapper.selectRaw(CODE_GROUP_MAIN, subCd) != null) {
            throw new IllegalArgumentException(MessageKeys.CODES_DUPLICATE_KEY);
        }
        if (request.getCodeNmKo() == null || request.getCodeNmKo().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_CODE_NM_KO_REQUIRED);
        }
        if (request.getUseYn() == null || request.getUseYn().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_USE_YN_REQUIRED);
        }
        String ynGroup = request.getUseYn().trim().toUpperCase();
        if (!"Y".equals(ynGroup) && !"N".equals(ynGroup)) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        try {
            ObjectNode codeNm = objectMapper.createObjectNode();
            codeNm.put("ko", request.getCodeNmKo().trim());
            if (request.getCodeNmEn() != null) {
                codeNm.put("en", request.getCodeNmEn().trim());
            }
            ObjectNode codeInfo = objectMapper.createObjectNode();
            codeInfo.put("use_yn", ynGroup);
            if (request.getDispSeq() != null) {
                codeInfo.put("disp_seq", request.getDispSeq());
            }
            omCodeMMapper.insertCode(
                    CODE_GROUP_MAIN,
                    subCd,
                    objectMapper.writeValueAsString(codeNm),
                    objectMapper.writeValueAsString(codeInfo),
                    createdBy);
            recordAudit("CREATE", CODE_GROUP_MAIN + ":" + subCd, createdBy, "{}",
                    objectMapper.writeValueAsString(buildCodeAuditState(CODE_GROUP_MAIN, subCd, codeNm, codeInfo)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @CacheEvict(cacheNames = CacheConfig.CACHE_CODE_LIST, allEntries = true)
    @Transactional
    public void registerChild(CodeManageChildRegisterRequest request, String createdBy) {
        if (request == null
                || request.getParentMainCd() == null
                || request.getParentMainCd().isBlank()
                || request.getSubCd() == null
                || request.getSubCd().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_SUB_CD_REQUIRED);
        }
        String parentMainCd = request.getParentMainCd().trim().toUpperCase();
        String subCd = request.getSubCd().trim().toUpperCase();
        if (subCd.length() > 50 || parentMainCd.length() > 50) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        if (CODE_GROUP_MAIN.equalsIgnoreCase(parentMainCd)) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        if (omCodeMMapper.selectRaw(CODE_GROUP_MAIN, parentMainCd) == null) {
            throw new IllegalArgumentException(MessageKeys.CODES_NOT_FOUND);
        }
        if (omCodeMMapper.selectRaw(parentMainCd, subCd) != null) {
            throw new IllegalArgumentException(MessageKeys.CODES_DUPLICATE_KEY);
        }
        if (request.getCodeNmKo() == null || request.getCodeNmKo().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_CODE_NM_KO_REQUIRED);
        }
        if (request.getUseYn() == null || request.getUseYn().isBlank()) {
            throw new IllegalArgumentException(MessageKeys.CODES_USE_YN_REQUIRED);
        }
        String ynChild = request.getUseYn().trim().toUpperCase();
        if (!"Y".equals(ynChild) && !"N".equals(ynChild)) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
        try {
            ObjectNode codeNm = objectMapper.createObjectNode();
            codeNm.put("ko", request.getCodeNmKo().trim());
            if (request.getCodeNmEn() != null) {
                codeNm.put("en", request.getCodeNmEn().trim());
            }
            ObjectNode codeInfo = objectMapper.createObjectNode();
            codeInfo.put("use_yn", ynChild);
            if (request.getDispSeq() != null) {
                codeInfo.put("disp_seq", request.getDispSeq());
            }
            omCodeMMapper.insertCode(
                    parentMainCd,
                    subCd,
                    objectMapper.writeValueAsString(codeNm),
                    objectMapper.writeValueAsString(codeInfo),
                    createdBy);
            recordAudit("CREATE", parentMainCd + ":" + subCd, createdBy, "{}",
                    objectMapper.writeValueAsString(buildCodeAuditState(parentMainCd, subCd, codeNm, codeInfo)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportExcel(String keyword) {
        String kw = normalizeKeyword(keyword);
        List<CodeManageRow> groups = omCodeMMapper.selectManageGroups(kw);
        String[] headers = {
                "구분", "main_cd", "sub_cd", "코드명(한글)", "코드명(영문)", "사용여부", "표시순서", "기타1", "기타2", "등록일시"
        };
        try (SXSSFWorkbook wb = new SXSSFWorkbook(EXPORT_ROW_WINDOW);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.setCompressTempFiles(true);
            SXSSFSheet sheet = wb.createSheet("codes");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            int rowIdx = 1;
            for (CodeManageRow g : groups) {
                Row row = sheet.createRow(rowIdx++);
                writeExportRow(row, "대분류", g);
                sheet.flushRows(EXPORT_ROW_WINDOW);
                List<CodeManageRow> details = omCodeMMapper.selectManageDetails(g.getSubCd());
                for (CodeManageRow d : details) {
                    Row dr = sheet.createRow(rowIdx++);
                    writeExportRow(dr, "하위", d);
                }
                sheet.flushRows(EXPORT_ROW_WINDOW);
            }
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException(MessageKeys.CODES_EXCEL_EXPORT_FAILED, e);
        }
    }

    private static void writeExportRow(Row row, String kindLabel, CodeManageRow r) {
        int c = 0;
        row.createCell(c++).setCellValue(kindLabel);
        row.createCell(c++).setCellValue(r.getMainCd() != null ? r.getMainCd() : "");
        row.createCell(c++).setCellValue(r.getSubCd() != null ? r.getSubCd() : "");
        row.createCell(c++).setCellValue(r.getCodeNmKo() != null ? r.getCodeNmKo() : "");
        row.createCell(c++).setCellValue(r.getCodeNmEn() != null ? r.getCodeNmEn() : "");
        row.createCell(c++).setCellValue(r.getUseYn() != null ? r.getUseYn() : "");
        if (r.getDispSeq() != null) {
            row.createCell(c++).setCellValue(r.getDispSeq());
        } else {
            row.createCell(c++);
        }
        row.createCell(c++).setCellValue(r.getEtc1() != null ? r.getEtc1() : "");
        row.createCell(c++).setCellValue(r.getEtc2() != null ? r.getEtc2() : "");
        row.createCell(c).setCellValue(r.getCreatedAt() != null ? r.getCreatedAt() : "");
    }

    private void persistJson(String mainCd, String subCd, ObjectNode codeNm, ObjectNode codeInfo, String updatedBy)
            throws JsonProcessingException {
        omCodeMMapper.updateCodeJson(
                mainCd,
                subCd,
                objectMapper.writeValueAsString(codeNm),
                objectMapper.writeValueAsString(codeInfo),
                updatedBy);
    }

    private void applyGridField(String field, Object value, ObjectNode codeNm, ObjectNode codeInfo) {
        switch (field) {
            case "codeNmKo" -> codeNm.put("ko", value == null ? "" : String.valueOf(value).trim());
            case "codeNmEn" -> codeNm.put("en", value == null ? "" : String.valueOf(value).trim());
            case "useYn" -> {
                String yn = value == null ? "" : String.valueOf(value).trim().toUpperCase();
                if (!"Y".equals(yn) && !"N".equals(yn)) {
                    throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
                }
                codeInfo.put("use_yn", yn);
            }
            case "dispSeq" -> {
                Integer n = parseDispSeq(value);
                if (n == null) {
                    codeInfo.remove("disp_seq");
                } else {
                    codeInfo.put("disp_seq", n);
                }
            }
            case "etc1" -> codeInfo.put("etc1", value == null ? "" : String.valueOf(value).trim());
            case "etc2" -> codeInfo.put("etc2", value == null ? "" : String.valueOf(value).trim());
            default -> throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
    }

    private static Integer parseDispSeq(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number num) {
            return num.intValue();
        }
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(MessageKeys.CODES_INVALID_FIELD);
        }
    }

    private ObjectNode readObject(String json) throws JsonProcessingException {
        if (json == null || json.isBlank()) {
            return objectMapper.createObjectNode();
        }
        JsonNode n = objectMapper.readTree(json);
        if (n instanceof ObjectNode on) {
            return on;
        }
        return objectMapper.createObjectNode();
    }

    private CodeManageRow mapRawToRow(CodeRowRaw raw) throws JsonProcessingException {
        ObjectNode codeNm = readObject(raw.getCodeNm());
        ObjectNode codeInfo = readObject(raw.getCodeInfo());
        CodeManageRow row = new CodeManageRow();
        row.setMainCd(raw.getMainCd());
        row.setSubCd(raw.getSubCd());
        row.setRowType(CODE_GROUP_MAIN.equals(raw.getMainCd()) ? "MAIN" : "DETAIL");
        row.setCodeNmKo(text(codeNm, "ko"));
        row.setCodeNmEn(text(codeNm, "en"));
        row.setUseYn(text(codeInfo, "use_yn"));
        if (codeInfo.has("disp_seq") && !codeInfo.get("disp_seq").isNull()) {
            JsonNode d = codeInfo.get("disp_seq");
            if (d.isInt()) {
                row.setDispSeq(d.intValue());
            } else {
                String ds = d.asText("");
                if (!ds.isEmpty() && ds.matches("[0-9]+")) {
                    row.setDispSeq(Integer.parseInt(ds));
                }
            }
        }
        row.setEtc1(text(codeInfo, "etc1"));
        row.setEtc2(text(codeInfo, "etc2"));
        row.setCreatedAt(raw.getCreatedAt());
        return row;
    }

    private static String text(ObjectNode node, String key) {
        JsonNode n = node.get(key);
        return n == null || n.isNull() ? "" : n.asText("");
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String t = keyword.trim();
        return t.isEmpty() ? null : t;
    }

    private Map<String, Object> buildCodeAuditState(String mainCd, String subCd, ObjectNode codeNm, ObjectNode codeInfo) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mainCd", mainCd);
        out.put("subCd", subCd);
        out.put("codeNm", codeNm);
        out.put("codeInfo", codeInfo);
        return out;
    }

    private void recordAudit(String actionCode, String entityId, String actorUserId, String beforeData, String afterData) {
        AuditLogCommand cmd = new AuditLogCommand();
        cmd.setDomainType("CODE");
        cmd.setSystemMainCd("SYSTEM");
        cmd.setSystemSubCd("BO");
        cmd.setMenuCode("system-common-code");
        cmd.setMenuNameKo("공통코드 관리");
        cmd.setActionCode(actionCode);
        cmd.setEntityType("om_code_m");
        cmd.setEntityId(entityId);
        cmd.setBeforeData(beforeData);
        cmd.setAfterData(afterData);
        cmd.setChangedFields("[]");
        cmd.setActorUserId(actorUserId != null && !actorUserId.isBlank() ? actorUserId : "system");
        auditService.record(cmd);
    }
}
