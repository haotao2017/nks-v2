package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ChecklistItemDto;
import no.nks.dto.ChecklistItemImageDto;
import no.nks.dto.ProjectChecklistDto;
import no.nks.entity.*;
import no.nks.repository.ChecklistItemImageRepository;
import no.nks.repository.ChecklistItemRepository;
import no.nks.repository.ProjectChecklistRepository;
import no.nks.repository.ProjectRepository;
import no.nks.repository.ProjectServiceRepository;
import no.nks.service.ProjectChecklistService;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 项目检查清单服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "projectChecklists")
public class ProjectChecklistServiceImpl implements ProjectChecklistService {

    private final ProjectChecklistRepository projectChecklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistItemImageRepository checklistItemImageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectServiceRepository projectServiceRepository;
    private final CacheManager cacheManager;

    @Override
    @Cacheable(key = "'project_' + #projectId")
    public List<ProjectChecklistDto> getAllProjectChecklists(Integer projectId, Integer companyId) {
        log.debug("获取项目ID为 {} 的所有检查清单", projectId);

        // 验证项目是否存在且属于该公司
        validateProjectBelongsToCompany(projectId, companyId);

        List<ProjectChecklist> checklists = projectChecklistRepository.findByProjectId(projectId);
        return checklists.stream()
                .parallel()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = "projectChecklist", key = "#checklistId")
    public ProjectChecklistDto getSingleProjectChecklist(Integer checklistId, Integer companyId) {
        log.debug("获取检查清单ID为 {} 的详情", checklistId);

        ProjectChecklist checklist = projectChecklistRepository.findById(checklistId)
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + checklistId));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(checklist.getProjectId(), companyId);

        return convertToDto(checklist);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "projectChecklists", key = "'project_' + #checklistDto.projectId")
    public ProjectChecklistDto createSingleProjectChecklist(ProjectChecklistDto checklistDto, Integer companyId) {
        log.debug("创建项目ID为 {} 的检查清单", checklistDto.getProjectId());

        // 验证项目是否存在且属于该公司
        validateProjectBelongsToCompany(checklistDto.getProjectId(), companyId);

        ProjectChecklist checklist = convertToEntity(checklistDto);
        ProjectChecklist savedChecklist = projectChecklistRepository.save(checklist);

        log.debug("成功创建检查清单，ID: {}", savedChecklist.getId());
        return convertToDto(savedChecklist);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "projectChecklist", key = "#checklistDto.id"),
        @CacheEvict(cacheNames = "projectChecklists", key = "'project_' + #checklistDto.projectId")
    })
    public ProjectChecklistDto updateSingleProjectChecklist(ProjectChecklistDto checklistDto, Integer companyId) {
        log.debug("更新检查清单ID为 {} 的信息", checklistDto.getId());

        // 验证检查清单是否存在
        ProjectChecklist existingChecklist = projectChecklistRepository.findById(checklistDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + checklistDto.getId()));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(existingChecklist.getProjectId(), companyId);

        // 更新检查清单信息
        existingChecklist.setChecklistName(checklistDto.getChecklistName());
        existingChecklist.setSortOrder(checklistDto.getSortOrder());
        existingChecklist.setStartDate(checklistDto.getStartDate());
        existingChecklist.setEndDate(checklistDto.getEndDate());
        existingChecklist.setComment(checklistDto.getComment());

        ProjectChecklist updatedChecklist = projectChecklistRepository.save(existingChecklist);
        log.debug("成功更新检查清单，ID: {}", updatedChecklist.getId());

        return convertToDto(updatedChecklist);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "projectChecklist", key = "#checklistId"),
        @CacheEvict(cacheNames = "projectChecklists", key = "'project_' + #projectId", condition = "#projectId != null")
    })
    public RequestResponse deleteSingleProjectChecklist(Integer checklistId, Integer companyId) {
        log.debug("删除检查清单ID为 {} 的记录", checklistId);

        // 验证检查清单是否存在
        ProjectChecklist checklist = projectChecklistRepository.findById(checklistId)
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + checklistId));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(checklist.getProjectId(), companyId);

        Integer projectId = checklist.getProjectId(); // 保存项目ID用于缓存清理

        try {
            // 获取所有相关的检查清单项
            List<ChecklistItem> items = checklistItemRepository.findByChecklistId(checklistId);
            List<Integer> itemIds = items.stream()
                    .parallel()  // 使用并行流提高处理速度
                    .map(ChecklistItem::getId)
                    .collect(Collectors.toList());

            if (!itemIds.isEmpty()) {
                // 批量删除相关图片
                checklistItemImageRepository.deleteByChecklistItemIdIn(itemIds);
            }

            // 删除检查清单项
            checklistItemRepository.deleteByChecklistId(checklistId);

            // 删除检查清单
            projectChecklistRepository.deleteById(checklistId);

            log.debug("成功删除检查清单，ID: {}", checklistId);
            return new RequestResponse(true, "检查清单删除成功");
        } catch (Exception e) {
            log.error("删除检查清单时发生错误: {}", e.getMessage());
            return new RequestResponse(false, "删除检查清单时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "checklistItems", key = "#checklistItemDto.checklistId")
    public ChecklistItemDto createSingleProjectChecklistItem(ChecklistItemDto checklistItemDto, Integer companyId) {
        log.debug("创建检查清单项，所属检查清单ID: {}", checklistItemDto.getChecklistId());

        // 验证检查清单是否存在
        ProjectChecklist checklist = projectChecklistRepository.findById(checklistItemDto.getChecklistId())
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + checklistItemDto.getChecklistId()));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(checklist.getProjectId(), companyId);

        ChecklistItem checklistItem = convertToEntity(checklistItemDto);
        ChecklistItem savedItem = checklistItemRepository.save(checklistItem);

        // 清除相关缓存
        clearProjectChecklistCache(checklist.getProjectId(), checklist.getId());

        log.debug("成功创建检查清单项，ID: {}", savedItem.getId());
        return convertToDto(savedItem);
    }

    @Override
    @Transactional
    public ChecklistItemDto updateSingleProjectChecklistItem(ChecklistItemDto checklistItemDto, Integer companyId) {
        log.debug("更新检查清单项ID为 {} 的信息", checklistItemDto.getId());

        // 验证检查清单项是否存在
        ChecklistItem existingItem = checklistItemRepository.findById(checklistItemDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("检查清单项不存在: " + checklistItemDto.getId()));

        // 验证检查清单项所属的检查清单
        ProjectChecklist checklist = projectChecklistRepository.findById(existingItem.getChecklistId())
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + existingItem.getChecklistId()));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(checklist.getProjectId(), companyId);

        // 更新检查清单项信息
        existingItem.setTitle(checklistItemDto.getTitle());
        existingItem.setSortOrder(checklistItemDto.getSortOrder());
        existingItem.setStatus(checklistItemDto.getStatus());
        existingItem.setComment(checklistItemDto.getComment());
        existingItem.setFixDate(checklistItemDto.getFixDate());
        existingItem.setWasDev(checklistItemDto.getWasDev());
        existingItem.setEmailPartyDate(checklistItemDto.getEmailPartyDate());
        existingItem.setPartyUploadedImgDate(checklistItemDto.getPartyUploadedImgDate());
        existingItem.setEmailTempToPartiesIds(checklistItemDto.getEmailTempToPartiesIds());
        existingItem.setIsImageUploadedByParty(checklistItemDto.getIsImageUploadedByParty());

        ChecklistItem updatedItem = checklistItemRepository.save(existingItem);

        // 清除相关缓存
        clearProjectChecklistCache(checklist.getProjectId(), checklist.getId());

        log.debug("成功更新检查清单项，ID: {}", updatedItem.getId());

        return convertToDto(updatedItem);
    }

    @Override
    @Transactional
    public RequestResponse deleteSingleProjectChecklistItem(Integer checklistItemId, Integer companyId) {
        log.debug("删除检查清单项ID为 {} 的记录", checklistItemId);

        // 验证检查清单项是否存在
        ChecklistItem checklistItem = checklistItemRepository.findById(checklistItemId)
                .orElseThrow(() -> new EntityNotFoundException("检查清单项不存在: " + checklistItemId));

        // 验证检查清单项所属的检查清单
        ProjectChecklist checklist = projectChecklistRepository.findById(checklistItem.getChecklistId())
                .orElseThrow(() -> new EntityNotFoundException("检查清单不存在: " + checklistItem.getChecklistId()));

        // 验证检查清单所属的项目是否属于该公司
        validateProjectBelongsToCompany(checklist.getProjectId(), companyId);

        try {
            // 删除检查清单项的图片
            checklistItemImageRepository.deleteByChecklistItemId(checklistItemId);

            // 删除检查清单项
            checklistItemRepository.deleteById(checklistItemId);

            // 清除相关缓存
            clearProjectChecklistCache(checklist.getProjectId(), checklist.getId());

            log.debug("成功删除检查清单项，ID: {}", checklistItemId);
            return new RequestResponse(true, "检查清单项删除成功");
        } catch (Exception e) {
            log.error("删除检查清单项时发生错误: {}", e.getMessage());
            return new RequestResponse(false, "删除检查清单项时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public RequestResponse deleteProjectService(Integer projectId, Integer projectServiceId, Integer companyId) {
        log.debug("删除项目ID为 {} 的服务，服务ID: {}", projectId, projectServiceId);

        // 验证项目是否存在且属于该公司
        validateProjectBelongsToCompany(projectId, companyId);

        try {
            // 1. 验证项目服务是否存在
            ProjectService projectService = projectServiceRepository.findById(projectServiceId)
                .orElseThrow(() -> new EntityNotFoundException("项目服务不存在: " + projectServiceId));

            // 2. 验证项目服务是否属于指定的项目
            if (!projectService.getProjectId().equals(projectId)) {
                throw new IllegalArgumentException("项目服务不属于该项目");
            }

            // 3. 删除项目服务本身
            projectServiceRepository.deleteById(projectServiceId);

            log.debug("成功删除项目服务，项目ID: {}, 服务ID: {}", projectId, projectServiceId);
            return new RequestResponse(true, "项目服务删除成功");
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            log.error("删除项目服务时发生错误: {}", e.getMessage());
            return new RequestResponse(false, e.getMessage());
        } catch (Exception e) {
            log.error("删除项目服务时发生错误: {}", e.getMessage());
            return new RequestResponse(false, "删除项目服务时发生错误: " + e.getMessage());
        }
    }

    /**
     * 验证项目是否存在且属于指定的公司
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @throws EntityNotFoundException 如果项目不存在
     * @throws AccessDeniedException 如果项目不属于指定的公司
     */
    private void validateProjectBelongsToCompany(Integer projectId, Integer companyId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            log.error("项目不存在: {}", projectId);
            throw new EntityNotFoundException("项目不存在: " + projectId);
        }

        Project project = projectOpt.get();
        if (!project.getCompanyId().equals(companyId)) {
            log.error("无权访问项目: {}，该项目属于公司: {}", projectId, project.getCompanyId());
            throw new AccessDeniedException("无权访问此项目");
        }
    }

    /**
     * 清除与项目检查清单相关的所有缓存
     *
     * @param projectId 项目ID
     * @param checklistId 检查清单ID
     */
    private void clearProjectChecklistCache(Integer projectId, Integer checklistId) {
        if (cacheManager != null) {
            // 清除项目检查清单缓存
            if (cacheManager.getCache("projectChecklists") != null) {
                cacheManager.getCache("projectChecklists").evict("project_" + projectId);
            }

            // 清除单个检查清单缓存
            if (cacheManager.getCache("projectChecklist") != null) {
                cacheManager.getCache("projectChecklist").evict(checklistId);
            }

            // 清除检查清单项缓存
            if (cacheManager.getCache("checklistItems") != null) {
                cacheManager.getCache("checklistItems").evict(checklistId);
            }
        }
    }

    /**
     * 将ProjectChecklist实体转换为DTO
     */
    private ProjectChecklistDto convertToDto(ProjectChecklist checklist) {
        if (checklist == null) {
            return null;
        }

        List<ChecklistItem> items = checklistItemRepository.findByChecklistId(checklist.getId());
        List<ChecklistItemDto> itemDtos = items.stream()
                .parallel()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ProjectChecklistDto.builder()
                .id(checklist.getId())
                .projectId(checklist.getProjectId())
                .sortOrder(checklist.getSortOrder())
                .checklistName(checklist.getChecklistName())
                .startDate(checklist.getStartDate())
                .endDate(checklist.getEndDate())
                .comment(checklist.getComment())
                .checklistItems(itemDtos)
                .build();
    }

    /**
     * 将ProjectChecklistDto转换为实体
     */
    private ProjectChecklist convertToEntity(ProjectChecklistDto dto) {
        if (dto == null) {
            return null;
        }

        return ProjectChecklist.builder()
                .id(dto.getId())
                .projectId(dto.getProjectId())
                .sortOrder(dto.getSortOrder())
                .checklistName(dto.getChecklistName())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .comment(dto.getComment())
                .build();
    }

    /**
     * 将ChecklistItem实体转换为DTO
     */
    private ChecklistItemDto convertToDto(ChecklistItem item) {
        if (item == null) {
            return null;
        }

        List<ChecklistItemImage> images = checklistItemImageRepository.findByChecklistItemId(item.getId());
        List<ChecklistItemImageDto> imageDtos = images.stream()
                .parallel()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ChecklistItemDto.builder()
                .id(item.getId())
                .checklistId(item.getChecklistId())
                .title(item.getTitle())
                .sortOrder(item.getSortOrder())
                .status(item.getStatus())
                .comment(item.getComment())
                .fixDate(item.getFixDate())
                .wasDev(item.getWasDev())
                .emailPartyDate(item.getEmailPartyDate())
                .partyUploadedImgDate(item.getPartyUploadedImgDate())
                .emailTempToPartiesIds(item.getEmailTempToPartiesIds())
                .isImageUploadedByParty(item.getIsImageUploadedByParty())
                .images(imageDtos)
                .build();
    }

    /**
     * 将ChecklistItemDto转换为实体
     */
    private ChecklistItem convertToEntity(ChecklistItemDto dto) {
        if (dto == null) {
            return null;
        }

        return ChecklistItem.builder()
                .id(dto.getId())
                .checklistId(dto.getChecklistId())
                .title(dto.getTitle())
                .sortOrder(dto.getSortOrder())
                .status(dto.getStatus())
                .comment(dto.getComment())
                .fixDate(dto.getFixDate())
                .wasDev(dto.getWasDev())
                .emailPartyDate(dto.getEmailPartyDate())
                .partyUploadedImgDate(dto.getPartyUploadedImgDate())
                .emailTempToPartiesIds(dto.getEmailTempToPartiesIds())
                .isImageUploadedByParty(dto.getIsImageUploadedByParty())
                .build();
    }

    /**
     * 将ChecklistItemImage实体转换为DTO
     */
    private ChecklistItemImageDto convertToDto(ChecklistItemImage image) {
        if (image == null) {
            return null;
        }

        return ChecklistItemImageDto.builder()
                .id(image.getId())
                .checklistItemId(image.getChecklistItemId())
                .imageName(image.getImageName())
                .captureDate(image.getCaptureDate())
                .imageSize(image.getImageSize())
                .imageType(image.getImageType())
                .partyId(image.getPartyId())
                .isOkForFinalPdf(image.getIsOkForFinalPdf())
                .build();
    }
}
