package no.nks.service;

import no.nks.entity.GeneralSetting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import java.util.Properties;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MailSenderService {

    private final MailConfigurationService mailConfigurationService;

    @Autowired
    public MailSenderService(MailConfigurationService mailConfigurationService) {
        this.mailConfigurationService = mailConfigurationService;
        log.debug("初始化MailSenderService，将使用MailConfigurationService提供的配置");
    }

    /**
     * 获取特定公司的邮件配置
     *
     * @param companyId 公司ID
     * @return 公司的邮件配置，如果不存在则返回空
     */
    public Optional<GeneralSetting> getMailConfigByCompanyId(Integer companyId) {
        if (companyId == null) {
            log.warn("公司ID为null，无法获取邮件配置");
            return Optional.empty();
        }
        return mailConfigurationService.getMailConfigByCompanyId(companyId);
    }

    /**
     * 根据公司ID获取JavaMailSender
     * 如果公司配置无效，则尝试使用默认配置
     *
     * @param companyId 公司ID
     * @return 配置好的JavaMailSender
     * @throws RuntimeException 如果无法创建有效的JavaMailSender
     */
    public JavaMailSender getJavaMailSender(Integer companyId) {
        // 尝试获取公司邮件配置
        Optional<GeneralSetting> configOpt = getMailConfigByCompanyId(companyId);
        GeneralSetting config;
        boolean usingDefaultConfig = false;

        // 如果无法获取公司配置或配置无效，则使用默认配置
        if (configOpt.isPresent() && mailConfigurationService.isValidMailConfig(configOpt.get())) {
            config = configOpt.get();
            log.debug("使用公司ID {} 的邮件配置", companyId);
        } else {
            // 使用默认配置
            config = mailConfigurationService.getDefaultMailConfig();
            usingDefaultConfig = true;
            log.warn("公司ID {} 的邮件配置无效或不存在，使用默认配置", companyId);
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        // 设置SMTP服务器地址
        String host = config.getCompEmailHost();
        if (host == null || host.trim().isEmpty()) {
            log.error("SMTP服务器地址未配置，无法创建邮件发送器");
            throw new RuntimeException("SMTP host not configured");
        }
        mailSender.setHost(host);

        // 设置SMTP端口
        String portStr = config.getCompEmailPort();
        if (portStr == null || portStr.trim().isEmpty()) {
            log.warn("邮件端口未指定，使用默认端口587");
            mailSender.setPort(587); // 默认TLS端口
        } else {
            try {
                mailSender.setPort(Integer.parseInt(portStr.trim()));
            } catch (NumberFormatException e) {
                log.error("无效的端口格式: {}, 使用默认端口587", portStr);
                mailSender.setPort(587); // 失败时使用默认TLS端口
            }
        }

        // 设置用户名和密码
        String username = config.getCompEmailUserName();
        String password = config.getCompEmailPassword();

        if (username == null || username.trim().isEmpty()) {
            if (!usingDefaultConfig) {
                log.warn("公司ID {} 未配置邮件用户名", companyId);
            }
        }

        if (password == null || password.trim().isEmpty()) {
            if (!usingDefaultConfig) {
                log.warn("公司ID {} 未配置邮件密码", companyId);
            }
        }

        mailSender.setUsername(username);
        mailSender.setPassword(password);

        // 配置默认编码
        mailSender.setDefaultEncoding("UTF-8");

        // 设置邮件属性
        Properties props = getMailProperties(config);
        mailSender.setJavaMailProperties(props);

        log.debug("成功创建邮件发送器, 主机: {}, 端口: {}, 用户: {}", host, mailSender.getPort(), username);

        return mailSender;
    }

    /**
     * 获取邮件属性配置
     *
     * @param config 邮件配置
     * @return 邮件属性对象
     */
    private Properties getMailProperties(GeneralSetting config) {
        Properties props = new Properties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        // 添加SMTP提供者类路径配置
        props.put("mail.smtp.provider.class", "org.eclipse.angus.mail.smtp.SMTPProvider");

        // 添加SSL信任配置
        props.put("mail.smtp.ssl.trust", "*");

        // 添加连接超时设置
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        // 设置会话调试模式为false，不输出SMTP通信细节
        props.put("mail.debug", "false");

        // 添加发件人相关配置
        String fromEmail = mailConfigurationService.getSenderEmail(config);
        props.put("mail.smtp.from", fromEmail);

        log.debug("已配置邮件属性: {}", props);
        return props;
    }

    /**
     * 获取公司的发件人邮箱地址
     *
     * @param companyId 公司ID
     * @return 发件人邮箱地址，如果未配置则返回默认值
     */
    public String getSenderEmail(Integer companyId) {
        Optional<GeneralSetting> config = getMailConfigByCompanyId(companyId);
        String email = config.map(c -> mailConfigurationService.getSenderEmail(c))
                .orElseGet(() -> {
                    GeneralSetting defaultConfig = mailConfigurationService.getDefaultMailConfig();
                    return mailConfigurationService.getSenderEmail(defaultConfig);
                });

        log.debug("获取公司ID {} 的发件人邮箱: {}", companyId, email);
        return email;
    }

    /**
     * 获取公司的发件人显示名称
     *
     * @param companyId 公司ID
     * @return 发件人显示名称，如果未配置则返回默认值
     */
    public String getSenderDisplayName(Integer companyId) {
        Optional<GeneralSetting> config = getMailConfigByCompanyId(companyId);
        String displayName = config.map(c -> mailConfigurationService.getDisplayName(c))
                .orElseGet(() -> {
                    GeneralSetting defaultConfig = mailConfigurationService.getDefaultMailConfig();
                    return mailConfigurationService.getDisplayName(defaultConfig);
                });

        log.debug("获取公司ID {} 的发件人显示名称: {}", companyId, displayName);
        return displayName;
    }
}
