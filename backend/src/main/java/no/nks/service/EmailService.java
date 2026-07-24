package no.nks.service;

import no.nks.dto.workflow.ProjectWorkflowDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EmailService {
    /**
     * Send an email with the given parameters
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param content email body content
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmail(String to, String subject, String content);

    /**
     * Send an email with the given parameters
     *
     * @param companyId company ID
     * @param to      recipient email address
     * @param subject email subject
     * @param content email body content
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmail(Integer companyId, String to, String subject, String content);

    /**
     * Send an email with optional CC.
     *
     * @param companyId company ID
     * @param to        recipient email address
     * @param cc        comma/semicolon-separated CC addresses (nullable)
     * @param subject   email subject
     * @param content   email body content
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmail(Integer companyId, String to, String cc, String subject, String content);

    /**
     * Send an email with attachment
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param content email body content
     * @param file    attachment file
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmailWithAttachment(String to, String subject, String content, MultipartFile file);

    /**
     * Send an email with attachment
     *
     * @param companyId company ID
     * @param to      recipient email address
     * @param subject email subject
     * @param content email body content
     * @param file    attachment file
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmailWithAttachment(Integer companyId, String to, String subject, String content, MultipartFile file);

    /**
     * Send an email with attachment and optional CC.
     */
    boolean sendEmailWithAttachment(Integer companyId, String to, String cc, String subject, String content, MultipartFile file);

    /**
     * Send an email with multiple attachments
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param content email body content
     * @param files   attachment files
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmailWithAttachments(String to, String subject, String content, List<MultipartFile> files);

    /**
     * Save email history record
     *
     * @param projectWorkflow project workflow data containing email information
     * @return true if history was saved successfully, false otherwise
     */
    boolean saveEmailHistory(ProjectWorkflowDto projectWorkflow);

    /**
     * Save email history record with authenticated company ID when available.
     *
     * @param projectWorkflow project workflow data containing email information
     * @param companyId       company ID (preferred over hardcoded default)
     * @return true if history was saved successfully, false otherwise
     */
    boolean saveEmailHistory(ProjectWorkflowDto projectWorkflow, Integer companyId);

    void sendEmailAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId);

    void sendStepEightEmailAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId);

    void sendStepNineEmailsAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, Integer companyId);

    void sendStepTenEmailAsync(ProjectWorkflowDto projectWorkflow, Integer companyId, String eventDescription, String calendarSummary);

    void sendEmailWithAttachmentAndSaveHistoryAsync(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId);
}
