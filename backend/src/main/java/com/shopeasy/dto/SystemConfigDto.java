package com.shopeasy.dto;

public class SystemConfigDto {
    private Integer id;
    private Integer maxPasswordFailCount;
    private Integer maxInactiveLoginDays;
    private Boolean allowDuplicateLogin;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPasswordEnc;
    private String smtpFromEmail;
    private String smtpFromName;
    private Boolean smtpUseTls;
    private Boolean smtpUseSsl;
    private Boolean smtpAuthRequired;
    private Integer smtpConnectionTimeoutMs;
    private Integer smtpReadTimeoutMs;
    private Integer smtpWriteTimeoutMs;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getMaxPasswordFailCount() { return maxPasswordFailCount; }
    public void setMaxPasswordFailCount(Integer maxPasswordFailCount) { this.maxPasswordFailCount = maxPasswordFailCount; }
    public Integer getMaxInactiveLoginDays() { return maxInactiveLoginDays; }
    public void setMaxInactiveLoginDays(Integer maxInactiveLoginDays) { this.maxInactiveLoginDays = maxInactiveLoginDays; }
    public Boolean getAllowDuplicateLogin() { return allowDuplicateLogin; }
    public void setAllowDuplicateLogin(Boolean allowDuplicateLogin) { this.allowDuplicateLogin = allowDuplicateLogin; }
    public String getSmtpHost() { return smtpHost; }
    public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }
    public Integer getSmtpPort() { return smtpPort; }
    public void setSmtpPort(Integer smtpPort) { this.smtpPort = smtpPort; }
    public String getSmtpUsername() { return smtpUsername; }
    public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }
    public String getSmtpPasswordEnc() { return smtpPasswordEnc; }
    public void setSmtpPasswordEnc(String smtpPasswordEnc) { this.smtpPasswordEnc = smtpPasswordEnc; }
    public String getSmtpFromEmail() { return smtpFromEmail; }
    public void setSmtpFromEmail(String smtpFromEmail) { this.smtpFromEmail = smtpFromEmail; }
    public String getSmtpFromName() { return smtpFromName; }
    public void setSmtpFromName(String smtpFromName) { this.smtpFromName = smtpFromName; }
    public Boolean getSmtpUseTls() { return smtpUseTls; }
    public void setSmtpUseTls(Boolean smtpUseTls) { this.smtpUseTls = smtpUseTls; }
    public Boolean getSmtpUseSsl() { return smtpUseSsl; }
    public void setSmtpUseSsl(Boolean smtpUseSsl) { this.smtpUseSsl = smtpUseSsl; }
    public Boolean getSmtpAuthRequired() { return smtpAuthRequired; }
    public void setSmtpAuthRequired(Boolean smtpAuthRequired) { this.smtpAuthRequired = smtpAuthRequired; }
    public Integer getSmtpConnectionTimeoutMs() { return smtpConnectionTimeoutMs; }
    public void setSmtpConnectionTimeoutMs(Integer smtpConnectionTimeoutMs) { this.smtpConnectionTimeoutMs = smtpConnectionTimeoutMs; }
    public Integer getSmtpReadTimeoutMs() { return smtpReadTimeoutMs; }
    public void setSmtpReadTimeoutMs(Integer smtpReadTimeoutMs) { this.smtpReadTimeoutMs = smtpReadTimeoutMs; }
    public Integer getSmtpWriteTimeoutMs() { return smtpWriteTimeoutMs; }
    public void setSmtpWriteTimeoutMs(Integer smtpWriteTimeoutMs) { this.smtpWriteTimeoutMs = smtpWriteTimeoutMs; }
}
