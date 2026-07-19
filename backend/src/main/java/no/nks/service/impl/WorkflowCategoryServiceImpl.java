package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.dto.WorkflowCategoryDto;
import no.nks.dto.WorkflowCategoryStepDto;
import no.nks.dto.WrapperMultiWorkflowCategory;
import no.nks.dto.WrapperMultiWorkflowCategorySteps;
import no.nks.dto.WrapperWorkflowCategory;
import no.nks.dto.WrapperWorkflowCategoryStep;
import no.nks.entity.WorkflowCategory;
import no.nks.entity.WorkflowCategoryStep;
import no.nks.repository.WorkflowCategoryRepository;
import no.nks.repository.WorkflowCategoryStepRepository;
import no.nks.service.WorkflowCategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkflowCategoryServiceImpl implements WorkflowCategoryService {

    private final WorkflowCategoryRepository workflowCategoryRepository;
    private final WorkflowCategoryStepRepository workflowCategoryStepRepository;

    @Override
    public WrapperWorkflowCategory getSingleWorkflowCategory(Integer workflowCategoryId) {
        log.info("Finding workflow category with ID: {}", workflowCategoryId);
        WorkflowCategory workflowCategory = workflowCategoryRepository.findById(workflowCategoryId)
                .orElseThrow(() -> new EntityNotFoundException("Arbeidsflytkategori finnes ikke: ID=" + workflowCategoryId));

        return new WrapperWorkflowCategory(mapToDto(workflowCategory));
    }

    @Override
    @Transactional
    public WrapperWorkflowCategory updateSingleWorkflowCategory(WorkflowCategoryDto workflowCategoryDto) {
        log.info("Updating workflow category with ID: {}", workflowCategoryDto.getId());
        if (workflowCategoryDto.getId() == null) {
            throw new IllegalArgumentException("ID må oppgis ved oppdatering av arbeidsflytkategori");
        }

        WorkflowCategory existingCategory = workflowCategoryRepository.findById(workflowCategoryDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Arbeidsflytkategori finnes ikke: ID=" + workflowCategoryDto.getId()));

        // 先更新名称
        existingCategory.setName(workflowCategoryDto.getName());

        // 如果设置为默认，需要清除其他默认类别
        if (Boolean.TRUE.equals(workflowCategoryDto.getIsDefault())) {
            // 先清除所有默认类别
            int updatedCount = workflowCategoryRepository.clearAllDefaults();
            log.info("已清除{}个原默认工作流类别", updatedCount);

            // 然后再设置当前类别为默认
            existingCategory.setDefault(true);
        } else {
            // 否则按传入的值设置
            existingCategory.setDefault(workflowCategoryDto.getIsDefault() != null ? workflowCategoryDto.getIsDefault() : false);
        }

        WorkflowCategory updatedCategory = workflowCategoryRepository.save(existingCategory);
        return new WrapperWorkflowCategory(mapToDto(updatedCategory));
    }

    @Override
    @Transactional
    public RequestResponse deleteSingleWorkflowCategory(Integer workflowCategoryId) {
        log.info("Deleting workflow category with ID: {}", workflowCategoryId);
        if (workflowCategoryId == null) {
            return new RequestResponse(false, "Arbeidsflytkategori-ID mangler");
        }

        if (!workflowCategoryRepository.existsById(workflowCategoryId)) {
            return new RequestResponse(false, "Arbeidsflytkategori finnes ikke: ID=" + workflowCategoryId);
        }

        // 检查是否有关联的步骤
        List<WorkflowCategoryStep> steps = workflowCategoryStepRepository.findByWorkflowCategoryIdOrderByStepSequenceAsc(workflowCategoryId);
        if (!steps.isEmpty()) {
            return new RequestResponse(false, "Kategorien har tilknyttede steg og kan ikke slettes");
        }

        try {
            workflowCategoryRepository.deleteById(workflowCategoryId);
            return new RequestResponse(true, "Arbeidsflytkategori slettet");
        } catch (Exception e) {
            log.error("删除工作流类别时出错", e);
            return new RequestResponse(false, "Feil ved sletting av arbeidsflytkategori: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public WrapperWorkflowCategory createSingleWorkflowCategory(WorkflowCategoryDto workflowCategoryDto) {
        log.info("Creating new workflow category");
        if (workflowCategoryDto == null) {
            throw new IllegalArgumentException("Arbeidsflytkategori-data mangler");
        }

        // 确保创建时不带ID
        workflowCategoryDto.setId(null);

        WorkflowCategory newCategory = new WorkflowCategory();
        newCategory.setName(workflowCategoryDto.getName());

        // 如果设置为默认，需要清除其他默认类别
        if (Boolean.TRUE.equals(workflowCategoryDto.getIsDefault())) {
            // 先清除所有默认类别
            int updatedCount = workflowCategoryRepository.clearAllDefaults();
            log.info("已清除{}个原默认工作流类别", updatedCount);

            // 设置新类别为默认
            newCategory.setDefault(true);
        } else {
            // 否则按传入的值设置
            newCategory.setDefault(workflowCategoryDto.getIsDefault() != null ? workflowCategoryDto.getIsDefault() : false);
        }

        WorkflowCategory savedCategory = workflowCategoryRepository.save(newCategory);
        return new WrapperWorkflowCategory(mapToDto(savedCategory));
    }

    @Override
    public WrapperMultiWorkflowCategory getAllWorkflowCategory() {
        log.info("Retrieving all workflow categories");
        List<WorkflowCategory> categories = workflowCategoryRepository.findAll();
        List<WorkflowCategoryDto> categoryDtos = categories.stream().map(this::mapToDto).collect(Collectors.toList());

        return new WrapperMultiWorkflowCategory(categoryDtos);
    }

    @Override
    public WrapperMultiWorkflowCategorySteps getSingleWorkflowCategoryStepsForOneWorkflow(Integer workflowCategoryId) {
        log.info("Finding workflow category steps for category ID: {}", workflowCategoryId);
        // 首先检查工作流类别是否存在
        if (!workflowCategoryRepository.existsById(workflowCategoryId)) {
            throw new EntityNotFoundException("Arbeidsflytkategori finnes ikke: ID=" + workflowCategoryId);
        }

        List<WorkflowCategoryStep> steps = workflowCategoryStepRepository.findByWorkflowCategoryIdOrderByStepSequenceAsc(workflowCategoryId);
        List<WorkflowCategoryStepDto> stepDtos = steps.stream().map(this::mapToStepDto).collect(Collectors.toList());

        return new WrapperMultiWorkflowCategorySteps(stepDtos);
    }

    @Override
    @Transactional
    public WrapperWorkflowCategoryStep createSingleWorkflowCategoryStep(WorkflowCategoryStepDto stepDto) {
        log.info("Creating new workflow category step for category ID: {}", stepDto.getWorkflowCategoryId());
        // 检查关联的工作流类别是否存在
        if (!workflowCategoryRepository.existsById(stepDto.getWorkflowCategoryId())) {
            throw new EntityNotFoundException("Arbeidsflytkategori finnes ikke: ID=" + stepDto.getWorkflowCategoryId());
        }

        // 确保创建时不带ID
        stepDto.setId(null);

        WorkflowCategoryStep newStep = new WorkflowCategoryStep();
        newStep.setWorkflowCategoryId(stepDto.getWorkflowCategoryId());
        newStep.setStepName(stepDto.getStepName());
        newStep.setStepSequence(stepDto.getStepSequence());
        newStep.setActive(stepDto.getIsActive() != null ? stepDto.getIsActive() : true);
        newStep.setTransferable(stepDto.getIsTransferable() != null ? stepDto.getIsTransferable() : false);

        WorkflowCategoryStep savedStep = workflowCategoryStepRepository.save(newStep);
        return new WrapperWorkflowCategoryStep(mapToStepDto(savedStep));
    }

    @Override
    public WrapperWorkflowCategoryStep getSingleWorkflowCategoryStep(Integer workflowCategoryStepId) {
        log.info("Finding workflow category step with ID: {}", workflowCategoryStepId);
        WorkflowCategoryStep step = workflowCategoryStepRepository.findById(workflowCategoryStepId)
                .orElseThrow(() -> new EntityNotFoundException("Arbeidsflytsteg finnes ikke: ID=" + workflowCategoryStepId));

        return new WrapperWorkflowCategoryStep(mapToStepDto(step));
    }

    @Override
    @Transactional
    public WrapperWorkflowCategoryStep updateSingleWorkflowCategoryStep(WorkflowCategoryStepDto stepDto) {
        log.info("Updating workflow category step with ID: {}", stepDto.getId());
        if (stepDto.getId() == null) {
            throw new IllegalArgumentException("ID må oppgis ved oppdatering av arbeidsflytsteg");
        }

        WorkflowCategoryStep existingStep = workflowCategoryStepRepository.findById(stepDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Arbeidsflytsteg finnes ikke: ID=" + stepDto.getId()));

        // 检查关联的工作流类别是否存在
        if (!workflowCategoryRepository.existsById(stepDto.getWorkflowCategoryId())) {
            throw new EntityNotFoundException("Arbeidsflytkategori finnes ikke: ID=" + stepDto.getWorkflowCategoryId());
        }

        // 更新字段
        existingStep.setWorkflowCategoryId(stepDto.getWorkflowCategoryId());
        existingStep.setStepName(stepDto.getStepName());
        existingStep.setStepSequence(stepDto.getStepSequence());
        existingStep.setActive(stepDto.getIsActive() != null ? stepDto.getIsActive() : existingStep.isActive());
        existingStep.setTransferable(stepDto.getIsTransferable() != null ? stepDto.getIsTransferable() : existingStep.isTransferable());

        WorkflowCategoryStep updatedStep = workflowCategoryStepRepository.save(existingStep);
        return new WrapperWorkflowCategoryStep(mapToStepDto(updatedStep));
    }

    @Override
    @Transactional
    public RequestResponse deleteSingleWorkflowCategoryStep(Integer workflowCategoryStepId) {
        log.info("Deleting workflow category step with ID: {}", workflowCategoryStepId);
        if (workflowCategoryStepId == null) {
            return new RequestResponse(false, "Arbeidsflytsteg-ID mangler");
        }

        if (!workflowCategoryStepRepository.existsById(workflowCategoryStepId)) {
            return new RequestResponse(false, "Arbeidsflytsteg finnes ikke: ID=" + workflowCategoryStepId);
        }

        try {
            workflowCategoryStepRepository.deleteById(workflowCategoryStepId);
            return new RequestResponse(true, "Arbeidsflytsteg slettet");
        } catch (Exception e) {
            log.error("删除工作流步骤时出错", e);
            return new RequestResponse(false, "Feil ved sletting av arbeidsflytsteg: " + e.getMessage());
        }
    }

    // 辅助方法：实体转DTO
    private WorkflowCategoryDto mapToDto(WorkflowCategory entity) {
        return new WorkflowCategoryDto(
                entity.getId(),
                entity.getName(),
                entity.isDefault()
        );
    }

    // 辅助方法：实体转DTO（步骤）
    private WorkflowCategoryStepDto mapToStepDto(WorkflowCategoryStep entity) {
        return new WorkflowCategoryStepDto(
                entity.getId(),
                entity.getWorkflowCategoryId(),
                entity.getStepName(),
                entity.getStepSequence(),
                entity.isActive(),
                entity.isTransferable()
        );
    }
}
