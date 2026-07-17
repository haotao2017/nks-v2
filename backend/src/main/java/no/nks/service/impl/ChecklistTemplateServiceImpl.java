package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import no.nks.dto.ChecklistItemTemplateDto;
import no.nks.dto.ChecklistTemplateDto;
import no.nks.dto.ResponseDto;
import no.nks.dto.ServiceItemTemplateDto;
import no.nks.entity.ChecklistItemTemplate;
import no.nks.entity.ChecklistTemplate;
import no.nks.entity.Service;
import no.nks.repository.ChecklistItemTemplateRepository;
import no.nks.repository.ChecklistTemplateRepository;
import no.nks.repository.ServiceRepository;
import no.nks.service.ChecklistTemplateService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ChecklistTemplateServiceImpl implements ChecklistTemplateService {

    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final ChecklistItemTemplateRepository checklistItemTemplateRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Cacheable(value = "checklistTemplate", key = "'template_' + #checklistTemplateId + '_' + #companyId")
    public ChecklistTemplateDto getChecklistTemplate(Integer checklistTemplateId, Integer companyId) {
        ChecklistTemplate template = findTemplateAndValidateCompany(checklistTemplateId, companyId);
        return mapToDto(template);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplate", key = "'template_' + #checklistTemplateDto.id + '_' + #companyId"),
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ChecklistTemplateDto updateChecklistTemplate(ChecklistTemplateDto checklistTemplateDto, Integer companyId) {
        ChecklistTemplate existingTemplate = findTemplateAndValidateCompany(checklistTemplateDto.getId(), companyId);

        // Update fields
        existingTemplate.setTitle(checklistTemplateDto.getTitle());
        existingTemplate.setIsDefault(checklistTemplateDto.getIsDefault());

        // Save updated template
        ChecklistTemplate updatedTemplate = checklistTemplateRepository.save(existingTemplate);

        return mapToDto(updatedTemplate);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplate", key = "'template_' + #checklistTemplateId + '_' + #companyId"),
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ResponseDto deleteChecklistTemplate(Integer checklistTemplateId, Integer companyId) {
        ChecklistTemplate template = findTemplateAndValidateCompany(checklistTemplateId, companyId);

        try {
            checklistTemplateRepository.delete(template);
            return ResponseDto.builder()
                    .message("Record deleted")
                    .success(true)
                    .build();
        } catch (Exception e) {
            return ResponseDto.builder()
                    .message(e.getMessage())
                    .success(false)
                    .build();
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ChecklistTemplateDto createChecklistTemplate(ChecklistTemplateDto checklistTemplateDto, Integer companyId) {
        // Create new template
        ChecklistTemplate newTemplate = new ChecklistTemplate();
        newTemplate.setTitle(checklistTemplateDto.getTitle());
        newTemplate.setIsDefault(checklistTemplateDto.getIsDefault());
        newTemplate.setCompanyId(companyId);

        ChecklistTemplate savedTemplate = checklistTemplateRepository.save(newTemplate);

        // Create checklist items if provided
        if (checklistTemplateDto.getChecklistItemTemplateList() != null && !checklistTemplateDto.getChecklistItemTemplateList().isEmpty()) {
            List<ChecklistItemTemplate> itemsToSave = new ArrayList<>();

            for (ChecklistItemTemplateDto itemDto : checklistTemplateDto.getChecklistItemTemplateList()) {
                ChecklistItemTemplate newItem = new ChecklistItemTemplate();
                newItem.setTitle(itemDto.getTitle());
                newItem.setChecklistId(savedTemplate.getId());
                newItem.setCompanyId(companyId);
                itemsToSave.add(newItem);
            }

            // 批量保存所有项目，减少数据库交互次数
            List<ChecklistItemTemplate> savedItems = checklistItemTemplateRepository.saveAll(itemsToSave);

            // 更新DTO中的ID
            Map<String, Integer> titleToIdMap = savedItems.stream()
                    .collect(Collectors.toMap(
                            item -> item.getTitle(),
                            item -> item.getId(),
                            (existing, replacement) -> existing // 处理可能的重复标题
                    ));

            for (ChecklistItemTemplateDto itemDto : checklistTemplateDto.getChecklistItemTemplateList()) {
                Integer savedId = titleToIdMap.get(itemDto.getTitle());
                if (savedId != null) {
                    itemDto.setId(savedId);
                    itemDto.setChecklistId(savedTemplate.getId());
                }
            }
        }

        // Set the ID in the returning DTO
        checklistTemplateDto.setId(savedTemplate.getId());

        return checklistTemplateDto;
    }

    @Override
    @Cacheable(value = "checklistTemplateList", key = "'templates_' + #pageNo + '_' + #searchByName + '_' + #companyId")
    public List<ChecklistTemplateDto> getAllChecklistTemplates(Integer pageNo, String searchByName, Integer companyId) {
        List<ChecklistTemplate> templates;

        // Handle pagination and search
        if (pageNo == 0) {
            // Get all templates
            if (searchByName == null || searchByName.isEmpty()) {
                templates = checklistTemplateRepository.findByCompanyIdWithItems(companyId);
            } else {
                templates = checklistTemplateRepository.findByTitleAndCompanyIdWithItems(searchByName, companyId);
            }
        } else {
            // Get paginated templates
            if (pageNo == 1) {
                if (searchByName == null || searchByName.isEmpty()) {
                    templates = checklistTemplateRepository.findByCompanyIdWithItems(companyId, PageRequest.of(0, 10));
                } else {
                    templates = checklistTemplateRepository.findByTitleAndCompanyIdWithItems(searchByName, companyId, PageRequest.of(0, 10));
                }
            } else {
                int skip = (pageNo - 1) * 10;
                if (searchByName == null || searchByName.isEmpty()) {
                    templates = checklistTemplateRepository.findByCompanyIdWithItems(companyId, PageRequest.of(skip / 10, 10));
                } else {
                    templates = checklistTemplateRepository.findByTitleAndCompanyIdWithItems(searchByName, companyId, PageRequest.of(skip / 10, 10));
                }
            }
        }

        // 获取模板ID列表，用于批量查询服务
        List<Integer> templateIds = templates.stream()
                .map(ChecklistTemplate::getId)
                .collect(Collectors.toList());

        // 批量查询与这些模板关联的服务
        Map<Integer, Service> templateIdToServiceMap = new HashMap<>();
        if (!templateIds.isEmpty()) {
            List<Service> services = serviceRepository.findByChecklistTempIdIn(templateIds);
            templateIdToServiceMap = services.stream()
                    .collect(Collectors.toMap(
                            Service::getChecklistTempId,
                            service -> service,
                            (existing, replacement) -> existing // 如果有多个服务指向同一模板，保留第一个
                    ));
        }

        // 使用Map保存每个模板对应的服务，避免N+1查询
        final Map<Integer, Service> finalServiceMap = templateIdToServiceMap;

        // Map to DTOs - 使用预加载的项目和批量查询的服务
        return templates.stream()
                .map(template -> mapToTemplateDto(template, finalServiceMap.get(template.getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplate", allEntries = true),
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ChecklistItemTemplateDto createChecklistItemTemplate(ChecklistItemTemplateDto itemDto, Integer companyId) {
        // Verify template exists and belongs to company
        ChecklistTemplate parentTemplate = checklistTemplateRepository.findById(itemDto.getChecklistId())
                .orElseThrow(() -> new EntityNotFoundException("Checklist template not found with ID: " + itemDto.getChecklistId()));

        if (!parentTemplate.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Access denied to checklist template with ID: " + itemDto.getChecklistId());
        }

        // Create new item
        ChecklistItemTemplate newItem = new ChecklistItemTemplate();
        newItem.setTitle(itemDto.getTitle());
        newItem.setChecklistId(itemDto.getChecklistId());
        newItem.setCompanyId(companyId);

        ChecklistItemTemplate savedItem = checklistItemTemplateRepository.save(newItem);

        // Update DTO with saved ID
        itemDto.setId(savedItem.getId());

        return itemDto;
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplate", allEntries = true),
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ChecklistItemTemplateDto updateChecklistItemTemplate(ChecklistItemTemplateDto itemDto, Integer companyId) {
        // Find existing item
        ChecklistItemTemplate existingItem = checklistItemTemplateRepository.findById(itemDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Checklist item template not found with ID: " + itemDto.getId()));

        // Verify owner company
        if (!existingItem.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Access denied to checklist item template with ID: " + itemDto.getId());
        }

        // Update fields
        existingItem.setTitle(itemDto.getTitle());
        existingItem.setChecklistId(itemDto.getChecklistId());

        ChecklistItemTemplate updatedItem = checklistItemTemplateRepository.save(existingItem);

        return mapToItemDto(updatedItem);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "checklistTemplate", allEntries = true),
        @CacheEvict(value = "checklistTemplateList", allEntries = true)
    })
    public ResponseDto deleteChecklistItemTemplate(Integer checklistItemId, Integer companyId) {
        // Find existing item
        ChecklistItemTemplate existingItem = checklistItemTemplateRepository.findById(checklistItemId)
                .orElseThrow(() -> new EntityNotFoundException("Checklist item template not found with ID: " + checklistItemId));

        // Verify owner company
        if (!existingItem.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Access denied to checklist item template with ID: " + checklistItemId);
        }

        try {
            checklistItemTemplateRepository.delete(existingItem);
            return ResponseDto.builder()
                    .message("Checklist item deleted!")
                    .success(true)
                    .build();
        } catch (Exception e) {
            return ResponseDto.builder()
                    .message(e.getMessage())
                    .success(false)
                    .build();
        }
    }

    // Helper methods

    private ChecklistTemplate findTemplateAndValidateCompany(Integer templateId, Integer companyId) {
        ChecklistTemplate template = checklistTemplateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Checklist template not found with ID: " + templateId));

        if (!template.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Access denied to checklist template with ID: " + templateId);
        }

        return template;
    }

    private ChecklistTemplateDto mapToDto(ChecklistTemplate template) {
        // Find associated items
        List<ChecklistItemTemplate> items = checklistItemTemplateRepository.findByChecklistId(template.getId());

        // Find associated service
        Service associatedService = serviceRepository.findByChecklistTempId(template.getId())
                .orElse(null);

        // Map items to DTOs
        List<ChecklistItemTemplateDto> itemDtos = items.stream()
                .map(this::mapToItemDto)
                .collect(Collectors.toList());

        // Map service to DTO
        ServiceItemTemplateDto serviceDto = associatedService != null ?
                mapToServiceDto(associatedService) : null;

        // Create template DTO
        return ChecklistTemplateDto.builder()
                .id(template.getId())
                .title(template.getTitle())
                .isDefault(template.getIsDefault())
                .sortOrder(template.getSortOrder())
                .checklistItemTemplateList(itemDtos)
                .checkListAttchedWithService(serviceDto)
                .build();
    }

    // 映射模板数据的新方法，接受预先查询的服务参数
    private ChecklistTemplateDto mapToTemplateDto(ChecklistTemplate template, Service associatedService) {
        // 获取已经加载的关联项目
        List<ChecklistItemTemplate> items = template.getChecklistItemTemplates();

        // 映射项目到DTOs
        List<ChecklistItemTemplateDto> itemDtos = items == null ? new ArrayList<>() :
                items.stream()
                .map(this::mapToItemDto)
                .collect(Collectors.toList());

        // 映射服务到DTO
        ServiceItemTemplateDto serviceDto = associatedService != null ?
                mapToServiceDto(associatedService) : null;

        // 创建模板DTO
        return ChecklistTemplateDto.builder()
                .id(template.getId())
                .title(template.getTitle())
                .isDefault(template.getIsDefault())
                .sortOrder(template.getSortOrder())
                .checklistItemTemplateList(itemDtos)
                .checkListAttchedWithService(serviceDto)
                .build();
    }

    private ChecklistItemTemplateDto mapToItemDto(ChecklistItemTemplate item) {
        return ChecklistItemTemplateDto.builder()
                .id(item.getId())
                .checklistId(item.getChecklistId())
                .title(item.getTitle())
                .sortOrder(item.getSortOrder())
                .build();
    }

    private ServiceItemTemplateDto mapToServiceDto(Service service) {
        return ServiceItemTemplateDto.builder()
                .id(service.getId())
                .serviceTypeId(service.getServiceTypeId())
                .name(service.getName())
                .rate(service.getRate())
                .description(service.getDescription())
                .serviceChargedAs(service.getServiceChargedAs())
                .checklistTempId(service.getChecklistTempId())
                .build();
    }
}
