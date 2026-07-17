package no.nks.service;

import no.nks.dto.DeleteEmailTemplateResponseDto;
import no.nks.dto.EmailTemplateDto;

import java.util.List;

public interface EmailTemplateService {

    /**
     * 获取单个邮件模板
     * @param id 邮件模板ID
     * @param requestingUserCompanyId 请求用户的公司ID
     * @return 邮件模板DTO
     */
    EmailTemplateDto getEmailTemplateById(Integer id, Integer requestingUserCompanyId);

    /**
     * 获取所有邮件模板
     * @param requestingUserCompanyId 请求用户的公司ID
     * @return 邮件模板DTO列表
     */
    List<EmailTemplateDto> getAllEmailTemplates(Integer requestingUserCompanyId);

    /**
     * 更新邮件模板
     * @param templateDto 邮件模板DTO
     * @param requestingUserCompanyId 请求用户的公司ID
     * @return 更新后的邮件模板DTO
     */
    EmailTemplateDto updateEmailTemplate(EmailTemplateDto templateDto, Integer requestingUserCompanyId);

    /**
     * 创建邮件模板
     * @param templateDto 邮件模板DTO
     * @param requestingUserCompanyId 请求用户的公司ID
     * @return 创建的邮件模板DTO
     */
    EmailTemplateDto createEmailTemplate(EmailTemplateDto templateDto, Integer requestingUserCompanyId);

    /**
     * 删除邮件模板
     * @param id 邮件模板ID
     * @param requestingUserCompanyId 请求用户的公司ID
     * @return 删除结果
     */
    DeleteEmailTemplateResponseDto deleteEmailTemplate(Integer id, Integer requestingUserCompanyId);

    /**
     * 获取所有邮件标签
     * @return 邮件标签列表
     */
    List<String> getAllEmailHashtags();
}
