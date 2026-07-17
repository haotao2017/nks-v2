package no.nks.service;

import no.nks.dto.*;
import no.nks.entity.RequestResponse;

import java.util.List;

/**
 * 项目检查清单服务接口
 */
public interface ProjectChecklistService {

    /**
     * 获取项目所有检查清单
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目检查清单列表
     */
    List<ProjectChecklistDto> getAllProjectChecklists(Integer projectId, Integer companyId);

    /**
     * 获取单个项目检查清单
     *
     * @param checklistId 检查清单ID
     * @param companyId 公司ID
     * @return 项目检查清单
     */
    ProjectChecklistDto getSingleProjectChecklist(Integer checklistId, Integer companyId);

    /**
     * 创建项目检查清单
     *
     * @param checklistDto 检查清单DTO
     * @param companyId 公司ID
     * @return 创建后的检查清单
     */
    ProjectChecklistDto createSingleProjectChecklist(ProjectChecklistDto checklistDto, Integer companyId);

    /**
     * 更新项目检查清单
     *
     * @param checklistDto 检查清单DTO
     * @param companyId 公司ID
     * @return 更新后的检查清单
     */
    ProjectChecklistDto updateSingleProjectChecklist(ProjectChecklistDto checklistDto, Integer companyId);

    /**
     * 删除项目检查清单
     *
     * @param checklistId 检查清单ID
     * @param companyId 公司ID
     * @return 删除结果
     */
    RequestResponse deleteSingleProjectChecklist(Integer checklistId, Integer companyId);

    /**
     * 创建检查清单项
     *
     * @param checklistItemDto 检查清单项DTO
     * @param companyId 公司ID
     * @return 创建后的检查清单项
     */
    ChecklistItemDto createSingleProjectChecklistItem(ChecklistItemDto checklistItemDto, Integer companyId);

    /**
     * 更新检查清单项
     *
     * @param checklistItemDto 检查清单项DTO
     * @param companyId 公司ID
     * @return 更新后的检查清单项
     */
    ChecklistItemDto updateSingleProjectChecklistItem(ChecklistItemDto checklistItemDto, Integer companyId);

    /**
     * 删除检查清单项
     *
     * @param checklistItemId 检查清单项ID
     * @param companyId 公司ID
     * @return 删除结果
     */
    RequestResponse deleteSingleProjectChecklistItem(Integer checklistItemId, Integer companyId);

    /**
     * 删除项目服务
     *
     * @param projectId 项目ID
     * @param projectServiceId 项目服务ID
     * @param companyId 公司ID
     * @return 删除结果
     */
    RequestResponse deleteProjectService(Integer projectId, Integer projectServiceId, Integer companyId);
}
