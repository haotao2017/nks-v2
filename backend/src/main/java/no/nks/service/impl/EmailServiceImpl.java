package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.workflow.EmailProjectPartiesWorkflowEntDto;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.entity.EmailHistory;
import no.nks.entity.GeneralSetting;
import no.nks.repository.EmailHistoryRepository;
import no.nks.service.EmailService;
import no.nks.service.MailSenderService;
import no.nks.service.CalendarService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final MailSenderService mailSenderService;
    private final EmailHistoryRepository emailHistoryRepository;
    private final CalendarService calendarService;

    @Value("${spring.mail.username:}")
    private String defaultFromEmail;

    @Value("${spring.mail.properties.mail.smtp.from:}")
    private String smtpFrom;

    // Constructor injection (replacing @RequiredArgsConstructor)
    public EmailServiceImpl(MailSenderService mailSenderService, EmailHistoryRepository emailHistoryRepository, CalendarService calendarService) {
        this.mailSenderService = mailSenderService;
        this.emailHistoryRepository = emailHistoryRepository;
        this.calendarService = calendarService;
    }

    // We add new methods that accept companyId parameter

    @Override
    public boolean sendEmail(String to, String subject, String content) {
        // Default to company ID 1 for backward compatibility
        return sendEmail(1, to, subject, content);
    }

    @Override
    public boolean sendEmail(Integer companyId, String to, String subject, String content) {
        return sendEmail(companyId, to, null, subject, content);
    }

    private boolean sendEmail(Integer companyId, String to, String cc, String subject, String content) {
        try {
            if (to == null || to.isBlank()) {
                log.error("Unable to send email: recipient email address is empty");
                return false;
            }

            // Get company-specific mail sender
            JavaMailSender sender = mailSenderService.getJavaMailSender(companyId);

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            applyCc(helper, cc);
            helper.setSubject(subject != null ? subject : "");
            helper.setText(content != null ? content : "", true); // true indicates HTML content

            // 设置发件人
            setFromAddress(helper, companyId);

            sender.send(message);
            log.info("Email sent successfully to: {}", to);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email to: {}", to, e);
            return false;
        }
    }

    @Override
    public boolean sendEmailWithAttachment(String to, String subject, String content, MultipartFile file) {
        // Default to company ID 1 for backward compatibility
        return sendEmailWithAttachment(1, to, subject, content, file);
    }

    @Override
    public boolean sendEmailWithAttachment(Integer companyId, String to, String subject, String content, MultipartFile file) {
        return sendEmailWithAttachment(companyId, to, null, subject, content, file);
    }

    private boolean sendEmailWithAttachment(Integer companyId, String to, String cc, String subject, String content, MultipartFile file) {
        try {
            if (to == null || to.isBlank()) {
                log.error("Unable to send email with attachment: recipient email address is empty");
                return false;
            }

            JavaMailSender sender = mailSenderService.getJavaMailSender(companyId);

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            applyCc(helper, cc);
            helper.setSubject(subject != null ? subject : "");
            helper.setText(content != null ? content : "", true); // true for HTML
            setFromAddress(helper, companyId);

            if (file != null && !file.isEmpty()) {
                helper.addAttachment(Objects.requireNonNull(file.getOriginalFilename()), file);
            }

            sender.send(message);
            log.debug("Email with attachment sent successfully to: {}", to);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email with attachment to: {}", to, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email with attachment to: {}", to, e);
            return false;
        }
    }

    @Override
    public boolean sendEmailWithAttachments(String to, String subject, String content, List<MultipartFile> files) {
        // Default to company ID 1 for backward compatibility
        return sendEmailWithAttachments(1, to, subject, content, files);
    }

    public boolean sendEmailWithAttachments(Integer companyId, String to, String subject, String content, List<MultipartFile> files) {
        return sendEmailWithAttachments(companyId, to, null, subject, content, files);
    }

    private boolean sendEmailWithAttachments(Integer companyId, String to, String cc, String subject, String content, List<MultipartFile> files) {
        try {
            if (to == null || to.isBlank()) {
                log.error("Unable to send email: recipient email address is empty");
                return false;
            }

            // Get company-specific mail sender
            JavaMailSender sender = mailSenderService.getJavaMailSender(companyId);

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            applyCc(helper, cc);
            helper.setSubject(subject != null ? subject : "");
            helper.setText(content != null ? content : "", true); // true indicates HTML content

            // 设置发件人
            setFromAddress(helper, companyId);

            // 添加附件（如果提供）
            if (files != null && !files.isEmpty()) {
                for (MultipartFile file : files) {
                    if (file != null && !file.isEmpty()) {
                        helper.addAttachment(
                            file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment",
                            file
                        );
                    }
                }
            }

            sender.send(message);
            log.info("Email with attachments sent successfully to: {}", to);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email with attachments to: {}", to, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email with attachments to: {}", to, e);
            return false;
        }
    }

    @Override
    public boolean saveEmailHistory(ProjectWorkflowDto projectWorkflow) {
        return saveEmailHistory(projectWorkflow, null);
    }

    @Override
    public boolean saveEmailHistory(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        try {
            if (projectWorkflow == null) {
                log.error("Cannot save email history: projectWorkflow is null");
                return false;
            }

            EmailHistory emailHistory = new EmailHistory();

            // 设置项目ID
            emailHistory.setProjectId(projectWorkflow.getProjectId());

            // 设置收件人ID（如果可用）
            if (projectWorkflow.getEmailProjectParties() != null) {
                emailHistory.setPartyId(projectWorkflow.getEmailProjectParties().getPartyId());

                // 设置PartyTypeId（如果可用）
                if (projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList() != null &&
                        !projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList().isEmpty()) {
                    EmailProjectPartiesWorkflowEntDto partyDetails =
                            projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList().get(0);
                    if (partyDetails != null) {
                        emailHistory.setPartyTypeId(partyDetails.getPartyTypeID());
                    }
                }
            }

            // 设置邮件主题
            emailHistory.setSubject(projectWorkflow.getEmailSubject());

            // 设置收件人邮箱
            String toEmail = projectWorkflow.getToEmail() != null ?
                    projectWorkflow.getToEmail() : projectWorkflow.getEmailTo();
            emailHistory.setToEmail(toEmail);

            // 设置发件人邮箱
            String fromEmail = projectWorkflow.getFromEmail() != null ?
                    projectWorkflow.getFromEmail() :
                    (projectWorkflow.getEmailFrom() != null ? projectWorkflow.getEmailFrom() : defaultFromEmail);
            emailHistory.setFromEmail(fromEmail);

            // 设置邮件内容
            emailHistory.setMessage(projectWorkflow.getEmailContent());

            // 设置文件名（如果可用）
            if (projectWorkflow.getFileName() != null) {
                emailHistory.setFileName(projectWorkflow.getFileName());
            } else if (projectWorkflow.getFileNames() != null && !projectWorkflow.getFileNames().isEmpty()) {
                // 多个文件名用逗号分隔
                emailHistory.setFileName(String.join(",", projectWorkflow.getFileNames()));
            }

            // 设置项目状态
            emailHistory.setProjectStatus(projectWorkflow.getWorkflowStepId());

            // 设置是否是邮件
            emailHistory.setIsEmail(true);

            // 其他属性设置
            emailHistory.setStatus(true); // 假设邮件发送成功
            emailHistory.setDate(LocalDateTime.now());
            emailHistory.setWorkflowId(projectWorkflow.getWorkflowId());
            emailHistory.setWorkflowStepId(projectWorkflow.getWorkflowStepId());
            emailHistory.setUrlKey(projectWorkflow.getRootURL());

            // Prefer authenticated company when available; fall back to 1 for legacy callers
            emailHistory.setCompanyId(companyId != null ? companyId : 1);

            // 保存到数据库
            emailHistoryRepository.save(emailHistory);

            log.debug("Email history saved for project: {}, workflow step: {}",
                    projectWorkflow.getProjectId(), projectWorkflow.getWorkflowStepId());
            return true;
        } catch (Exception e) {
            log.error("Failed to save email history", e);
            return false;
        }
    }

    /**
     * 辅助方法：设置抄送(Cc)。cc 支持逗号/分号分隔的多个地址；为空则不设置。
     */
    private void applyCc(MimeMessageHelper helper, String cc) throws MessagingException {
        if (cc == null || cc.isBlank()) {
            return;
        }
        String[] ccAddresses = java.util.Arrays.stream(cc.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        if (ccAddresses.length > 0) {
            helper.setCc(ccAddresses);
        }
    }

    /**
     * 辅助方法：设置邮件发件人
     *
     * @param helper MimeMessageHelper实例
     * @param companyId 公司ID
     * @throws MessagingException 如果设置发件人时出错
     */
    private void setFromAddress(MimeMessageHelper helper, Integer companyId) throws MessagingException {
        try {
            // 发件地址用「配置的发件邮箱(SenderEmailAddress)+显示名」,与异步发送路径一致。
            // 切勿用 SMTP 登录用户名(getUsername())当发件地址 —— 用户名不保证是合法邮箱
            // (例如含空格),会触发 jakarta.mail AddressException 导致整封邮件发送失败。
            String senderEmail = mailSenderService.getSenderEmail(companyId);
            String displayName = mailSenderService.getSenderDisplayName(companyId);
            if (senderEmail != null && !senderEmail.isBlank()) {
                senderEmail = senderEmail.trim();
                if (displayName != null && !displayName.isBlank()) {
                    helper.setFrom(new InternetAddress(senderEmail, displayName.trim(), "UTF-8"));
                } else {
                    helper.setFrom(senderEmail);
                }
                return;
            }

            // 回退:配置的SMTP发件人 / 默认发件人 / 系统默认
            if (smtpFrom != null && !smtpFrom.isBlank()) {
                helper.setFrom(smtpFrom.trim());
            } else if (defaultFromEmail != null && !defaultFromEmail.isBlank()) {
                helper.setFrom(defaultFromEmail.trim());
            } else {
                helper.setFrom(new InternetAddress("noreply@example.com", "NBK System", "UTF-8"));
            }
        } catch (UnsupportedEncodingException e) {
            log.warn("Failed to set personal name for sender, using email address only", e);
            helper.setFrom("noreply@example.com");
        }
    }

    @Async
    @Override
    public void sendEmailAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.info("Asynchronously sending email and saving history for project: {}", projectWorkflow.getProjectId());
        try {
            boolean emailSent = sendEmail(companyId, projectWorkflow.getEmailTo(), projectWorkflow.getCc(), projectWorkflow.getEmailSubject(), projectWorkflow.getEmailContent());
            if (emailSent) {
                saveEmailHistory(projectWorkflow, companyId);
                log.info("Async email sent and history saved successfully for project: {}", projectWorkflow.getProjectId());
            } else {
                log.warn("Async email sending failed for project: {}. History not saved.", projectWorkflow.getProjectId());
            }
        } catch (Exception e) {
            log.error("Exception occurred during async email sending for project: {}", projectWorkflow.getProjectId(), e);
        }
    }

    @Async
    @Override
    public void sendStepEightEmailAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.info("Asynchronously sending step 8 email for project: {}", projectWorkflow.getProjectId());
        try {
            // Send the primary email
            boolean emailSent = sendEmail(companyId, projectWorkflow.getEmailTo(), projectWorkflow.getCc(), projectWorkflow.getEmailSubject(), projectWorkflow.getEmailContent());

            // Also send to project leader if specified, replicating C# logic
            if (projectWorkflow.getProjectLeaderEmailTo() != null && !projectWorkflow.getProjectLeaderEmailTo().isEmpty()) {
                log.info("Sending additional step 8 email to project leader: {}", projectWorkflow.getProjectLeaderEmailTo());
                sendEmail(companyId, projectWorkflow.getProjectLeaderEmailTo(), projectWorkflow.getEmailSubject(), projectWorkflow.getEmailContent());
            }

            if (emailSent) {
                // Only save history for the primary email, as per C# logic
                saveEmailHistory(projectWorkflow, companyId);
                log.info("Async step 8 email sent and history saved successfully for project: {}", projectWorkflow.getProjectId());
            } else {
                log.warn("Async step 8 email sending failed for project: {}. History not saved.", projectWorkflow.getProjectId());
            }
        } catch (Exception e) {
            log.error("Exception occurred during async step 8 email sending for project: {}", projectWorkflow.getProjectId(), e);
        }
    }

    @Async
    @Override
    public void sendStepNineEmailsAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.info("Asynchronously sending step 9 emails for project: {}", projectWorkflow.getProjectId());
        if (projectWorkflow.getEmailProjectParties() == null || projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList() == null) {
            log.warn("No parties found for sending step 9 emails for project: {}", projectWorkflow.getProjectId());
            return;
        }

        for (EmailProjectPartiesWorkflowEntDto party : projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList()) {
            if (Boolean.TRUE.equals(party.getSendEmail())) {
                try {
                    String urlKey = generateUniqueUrlKey();
                    String uploadLink = projectWorkflow.getBaseURLSite() + "?WorkflowId=" + projectWorkflow.getWorkflowId() +
                            "&ProjectId=" + projectWorkflow.getProjectId() + "&PartyID=" + party.getPartyID() +
                            "&PartyTypeID=" + party.getPartyTypeID() + "&UrlKey=" + urlKey;

                    String emailContent = party.getContent().replace("@link", uploadLink);

                    boolean emailSent = sendEmail(companyId, party.getEmailTo(), projectWorkflow.getCc(), party.getTitle(), emailContent);

                    if (emailSent) {
                        // Create a specific DTO for this party's history
                        ProjectWorkflowDto historyDto = new ProjectWorkflowDto();
                        historyDto.setProjectId(projectWorkflow.getProjectId());
                        historyDto.setWorkflowId(projectWorkflow.getWorkflowId());
                        historyDto.setWorkflowStepId(projectWorkflow.getWorkflowStepId());
                        historyDto.setEmailSubject(party.getTitle());
                        historyDto.setEmailTo(party.getEmailTo());
                        historyDto.setEmailFrom(party.getEmailFrom());
                        historyDto.setEmailContent(emailContent);
                        // This is where we store party-specific info
                        historyDto.setPartyId(party.getPartyID());
                        historyDto.setPartyTypeId(party.getPartyTypeID());
                        historyDto.setUrlKey(urlKey);

                        saveEmailHistory(historyDto, companyId);
                        log.info("Successfully sent step 9 email and saved history for partyId: {} on project: {}", party.getPartyID(), projectWorkflow.getProjectId());
                    } else {
                        log.warn("Failed to send step 9 email to partyId: {} on project: {}", party.getPartyID(), projectWorkflow.getProjectId());
                    }
                } catch (Exception e) {
                    log.error("Error processing step 9 email for partyId: {} on project: {}", party.getPartyID(), projectWorkflow.getProjectId(), e);
                }
            }
        }
    }

    private String generateUniqueUrlKey() {
        // Similar to C#'s GetUniqueKey but using Java's more standard UUID.
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private boolean sendEmailWithByteArrayAttachment(Integer companyId, String to, String cc, String subject, String content, byte[] attachment, String attachmentName) {
        try {
            if (to == null || to.isBlank()) {
                log.error("Unable to send email with attachment: recipient email address is empty");
                return false;
            }

            JavaMailSender sender = mailSenderService.getJavaMailSender(companyId);
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            applyCc(helper, cc);
            helper.setSubject(subject != null ? subject : "");
            helper.setText(content != null ? content : "", true); // true for HTML
            setFromAddress(helper, companyId);

            if (attachment != null && attachment.length > 0) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachment));
            }

            sender.send(message);
            log.debug("Email with byte array attachment sent successfully to: {}", to);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email with byte array attachment to: {}", to, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email with byte array attachment to: {}", to, e);
            return false;
        }
    }

    @Async
    @Override
    public void sendStepTenEmailAsync(ProjectWorkflowDto projectWorkflow, Integer companyId, String eventDescription, String calendarSummary) {
        log.info("Asynchronously sending email with calendar event for project ID: {}", projectWorkflow.getProjectId());
        try {
            byte[] calendarFile = calendarService.createCalendarEvent(
                    projectWorkflow.getProjectInspectionDate(),
                    calendarSummary,
                    eventDescription
            );

            if (calendarFile != null) {
                String fileName = "inspection_invite.ics";
                boolean emailSent = sendEmailWithByteArrayAttachment(companyId, projectWorkflow.getEmailTo(), projectWorkflow.getCc(), projectWorkflow.getEmailSubject(), projectWorkflow.getEmailContent(), calendarFile, fileName);
                if (emailSent) {
                    projectWorkflow.setFileName(fileName);
                    saveEmailHistory(projectWorkflow, companyId);
                    log.info("Successfully sent step 10 email with calendar invite for project: {}", projectWorkflow.getProjectId());
                } else {
                     log.error("Failed to send step 10 email with calendar invite for project: {}", projectWorkflow.getProjectId());
                }
            }
        } catch (Exception e) {
            log.error("Error creating or sending calendar event for project: {}", projectWorkflow.getProjectId(), e);
        }
    }

    @Async
    @Override
    public void sendEmailWithAttachmentAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId) {
        log.info("Asynchronously sending email with attachment for project ID: {}", projectWorkflow.getProjectId());
        try {
            boolean emailSent = sendEmailWithAttachment(companyId, projectWorkflow.getEmailTo(), projectWorkflow.getCc(), projectWorkflow.getEmailSubject(), projectWorkflow.getEmailContent(), file);
            if (emailSent) {
                saveEmailHistory(projectWorkflow, companyId);
                log.info("Successfully sent email with attachment and saved history for project ID: {}", projectWorkflow.getProjectId());
            } else {
                log.error("Failed to send email with attachment for project ID: {}", projectWorkflow.getProjectId());
            }
        } catch (Exception e) {
            log.error("Error in sendEmailWithAttachmentAndSaveHistoryAsync for project ID: {}", projectWorkflow.getProjectId(), e);
        }
    }
}
