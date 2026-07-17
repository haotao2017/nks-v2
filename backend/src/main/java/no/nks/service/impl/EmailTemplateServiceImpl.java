package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import no.nks.dto.DeleteEmailTemplateResponseDto;
import no.nks.dto.EmailTemplateDto;
import no.nks.entity.EmailTemplate;
import no.nks.repository.EmailTemplateRepository;
import no.nks.service.EmailTemplateService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    // 可用的邮件占位符（#hashtag#）清单，原样保留
    private static final List<String> EMAIL_HASHTAGS_LIST = List.of(
            "#CustomerName#",
            "#Description#",
            "#Name#",
            "#PhoneNumber#",
            "#Email#",
            "#Designation#",
            "#ansvarlig#",
            "#Address#",
            "#ProjectTitle#",
            "#CustomerPhone#",
            "#BuildingSupplier#",
            "#InspectorName#"
    );

    @Override
    public EmailTemplateDto getEmailTemplateById(Integer id, Integer requestingUserCompanyId) {
        if (id == null) {
            throw new IllegalArgumentException("Email template ID cannot be null");
        }

        if (requestingUserCompanyId == null) {
            throw new AccessDeniedException("Company ID is required to access email templates");
        }

        // 使用ID和公司ID查询邮件模板，确保用户只能访问自己公司的模板
        EmailTemplate template = emailTemplateRepository.findByIdAndCompanyId(id, requestingUserCompanyId)
                .orElseThrow(() -> new EntityNotFoundException("Email template not found with ID: " + id + " for your company"));

        return mapToDto(template);
    }

    @Override
    public List<EmailTemplateDto> getAllEmailTemplates(Integer requestingUserCompanyId) {
        if (requestingUserCompanyId == null) {
            throw new AccessDeniedException("Company ID is required to access email templates");
        }

        // 只返回用户公司的邮件模板
        List<EmailTemplate> templates = emailTemplateRepository.findByCompanyId(requestingUserCompanyId);

        return templates.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EmailTemplateDto updateEmailTemplate(EmailTemplateDto templateDto, Integer requestingUserCompanyId) {
        if (templateDto == null || templateDto.getId() == null) {
            throw new IllegalArgumentException("Email template or ID cannot be null");
        }

        if (requestingUserCompanyId == null) {
            throw new AccessDeniedException("Company ID is required to update email templates");
        }

        // 首先检查模板是否存在且属于用户的公司
        EmailTemplate existingTemplate = emailTemplateRepository.findByIdAndCompanyId(templateDto.getId(), requestingUserCompanyId)
                .orElseThrow(() -> new AccessDeniedException("Email template not found or you don't have permission to update it"));

        // 更新模板属性
        existingTemplate.setTitle(templateDto.getTitle());
        existingTemplate.setTemplate(templateDto.getTemplate());

        // 保存更新
        EmailTemplate updatedTemplate = emailTemplateRepository.save(existingTemplate);

        return mapToDto(updatedTemplate);
    }

    @Override
    @Transactional
    public EmailTemplateDto createEmailTemplate(EmailTemplateDto templateDto, Integer requestingUserCompanyId) {
        if (templateDto == null) {
            throw new IllegalArgumentException("Email template cannot be null");
        }

        if (requestingUserCompanyId == null) {
            throw new AccessDeniedException("Company ID is required to create email templates");
        }

        // 创建新模板，并设置公司ID为用户的公司ID
        EmailTemplate newTemplate = new EmailTemplate();
        newTemplate.setTitle(templateDto.getTitle());
        newTemplate.setTemplate(templateDto.getTemplate());
        newTemplate.setCompanyId(requestingUserCompanyId);

        // 保存新模板
        EmailTemplate savedTemplate = emailTemplateRepository.save(newTemplate);

        return mapToDto(savedTemplate);
    }

    @Override
    @Transactional
    public DeleteEmailTemplateResponseDto deleteEmailTemplate(Integer id, Integer requestingUserCompanyId) {
        if (id == null) {
            return new DeleteEmailTemplateResponseDto("Email template ID cannot be null", false);
        }

        if (requestingUserCompanyId == null) {
            return new DeleteEmailTemplateResponseDto("Company ID is required to delete email templates", false);
        }

        try {
            // 检查模板是否存在且属于用户的公司
            EmailTemplate template = emailTemplateRepository.findByIdAndCompanyId(id, requestingUserCompanyId)
                    .orElseThrow(() -> new AccessDeniedException("Email template not found or you don't have permission to delete it"));

            emailTemplateRepository.delete(template);

            return new DeleteEmailTemplateResponseDto("Record deleted", true);
        } catch (AccessDeniedException e) {
            return new DeleteEmailTemplateResponseDto(e.getMessage(), false);
        } catch (EntityNotFoundException e) {
            return new DeleteEmailTemplateResponseDto("Email template not found: " + e.getMessage(), false);
        } catch (Exception e) {
            return new DeleteEmailTemplateResponseDto("Error deleting email template: " + e.getMessage(), false);
        }
    }

    @Override
    public List<String> getAllEmailHashtags() {
        return EMAIL_HASHTAGS_LIST;
    }

    // 辅助方法，将实体映射为DTO
    private EmailTemplateDto mapToDto(EmailTemplate template) {
        return EmailTemplateDto.builder()
                .id(template.getId())
                .title(template.getTitle())
                .template(template.getTemplate())
                .companyId(template.getCompanyId())
                .build();
    }
}
