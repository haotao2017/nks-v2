package no.nks.service;

import no.nks.entity.GeneralSetting;
import no.nks.repository.GeneralSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MailConfigurationService {
    private final GeneralSettingRepository generalSettingRepository;

    // 硬编码的默认邮件配置值
    private static final String DEFAULT_FROM_EMAIL = "noreply@nbkontroll.no";
    private static final String DEFAULT_FROM_NAME = "NBK System";
    private static final String DEFAULT_SMTP_HOST = "smtp.office365.com";
    private static final String DEFAULT_SMTP_PORT = "587";
    private static final String DEFAULT_SMTP_USERNAME = "";
    private static final String DEFAULT_SMTP_PASSWORD = "";

    @Autowired
    public MailConfigurationService(GeneralSettingRepository generalSettingRepository) {
        this.generalSettingRepository = generalSettingRepository;
        log.debug("初始化MailConfigurationService，使用硬编码默认值：");
        log.debug("DEFAULT_FROM_EMAIL = {}", DEFAULT_FROM_EMAIL);
        log.debug("DEFAULT_FROM_NAME = {}", DEFAULT_FROM_NAME);
        log.debug("DEFAULT_SMTP_HOST = {}", DEFAULT_SMTP_HOST);
        log.debug("DEFAULT_SMTP_PORT = {}", DEFAULT_SMTP_PORT);
    }

    /**
     * 根据公司ID获取邮件配置
     * @param companyId 公司ID
     * @return 公司的邮件配置
     */
    public Optional<GeneralSetting> getMailConfigByCompanyId(Integer companyId) {
        if (companyId == null) {
            log.warn("获取邮件配置时公司ID为null");
            return Optional.empty();
        }

        Optional<GeneralSetting> config = generalSettingRepository.findById(companyId);
        if (config.isPresent()) {
            log.debug("成功获取公司ID {} 的邮件配置", companyId);
        } else {
            log.warn("找不到公司ID {} 的邮件配置", companyId);
        }

        return config;
    }

    /**
     * 检查邮件配置是否有效
     * @param config 邮件配置
     * @return 配置是否有效
     */
    public boolean isValidMailConfig(GeneralSetting config) {
        if (config == null) {
            log.warn("邮件配置为null，被视为无效");
            return false;
        }

        // 检查基本的SMTP配置
        boolean isValid = config.getCompEmailHost() != null && !config.getCompEmailHost().trim().isEmpty() &&
                         config.getCompEmailPort() != null && !config.getCompEmailPort().trim().isEmpty() &&
                         config.getCompEmailUserName() != null && !config.getCompEmailUserName().trim().isEmpty() &&
                         config.getCompEmailPassword() != null && !config.getCompEmailPassword().trim().isEmpty();

        if (!isValid) {
            log.warn("公司ID {} 的邮件配置无效: host={}, port={}, username={}, 缺少关键配置",
                    config.getId(),
                    config.getCompEmailHost(),
                    config.getCompEmailPort(),
                    config.getCompEmailUserName());
        } else {
            log.debug("公司ID {} 的邮件配置有效", config.getId());
        }

        return isValid;
    }

    /**
     * 获取默认的邮件配置
     * @return 默认的邮件配置
     */
    public GeneralSetting getDefaultMailConfig() {
        log.debug("使用默认邮件配置");
        GeneralSetting defaultConfig = new GeneralSetting();
        defaultConfig.setCompEmailHost(DEFAULT_SMTP_HOST);
        defaultConfig.setCompEmailPort(DEFAULT_SMTP_PORT);
        defaultConfig.setCompEmailUserName(DEFAULT_SMTP_USERNAME);
        defaultConfig.setCompEmailPassword(DEFAULT_SMTP_PASSWORD);
        defaultConfig.setCompEmailDisplayName(DEFAULT_FROM_NAME);
        defaultConfig.setSenderEmailAddress(DEFAULT_FROM_EMAIL);

        return defaultConfig;
    }

    /**
     * 获取发件人显示名称，如果未配置则返回默认值
     * @param config 邮件配置
     * @return 发件人显示名称
     */
    public String getDisplayName(GeneralSetting config) {
        String displayName = config.getCompEmailDisplayName();
        if (displayName == null || displayName.trim().isEmpty()) {
            log.debug("邮件显示名称未配置，使用默认值: {}", DEFAULT_FROM_NAME);
            return DEFAULT_FROM_NAME;
        }
        return displayName;
    }

    /**
     * 获取发件人邮箱地址，如果未配置则返回默认值
     * @param config 邮件配置
     * @return 发件人邮箱地址
     */
    public String getSenderEmail(GeneralSetting config) {
        String senderEmail = config.getSenderEmailAddress();
        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            log.debug("发件人邮箱未配置，使用默认值: {}", DEFAULT_FROM_EMAIL);
            return DEFAULT_FROM_EMAIL;
        }
        return senderEmail;
    }
}
