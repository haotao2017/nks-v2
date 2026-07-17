package no.nks.service;

import no.nks.dto.*;

import java.util.List;

public interface ProjectService {
    /**
     * 获取项目计数，按未归档未删除、已删除、已归档分类
     * @param companyId 公司ID
     * @return 包含各类型项目数量的DTO
     */
    ProjectCountDto getProjectsCount(Integer companyId);

    /**
     * 获取所有项目列表（分页）
     * @param companyId 公司ID
     * @param entriesFrom 起始项（从1开始）
     * @param entriesTill 结束项
     * @return 项目列表
     */
    List<ProjectDto> getAllProjects(Integer companyId, int entriesFrom, int entriesTill);

    /**
     * 获取未归档未删除的项目列表（分页）
     * @param companyId 公司ID
     * @param entriesFrom 起始项（从1开始）
     * @param entriesTill 结束项
     * @return 项目列表
     */
    List<ProjectListDto> getActiveProjects(Integer companyId, int entriesFrom, int entriesTill);

    /**
     * 获取已归档的项目列表（分页）
     * @param companyId 公司ID
     * @param entriesFrom 起始项（从1开始）
     * @param entriesTill 结束项
     * @return 项目列表
     */
    List<ProjectDto> getArchivedProjects(Integer companyId, int entriesFrom, int entriesTill);

    /**
     * 获取已删除的项目列表（分页）
     * @param companyId 公司ID
     * @param entriesFrom 起始项（从1开始）
     * @param entriesTill 结束项
     * @return 项目列表
     */
    List<ProjectDto> getDeletedProjects(Integer companyId, int entriesFrom, int entriesTill);

    /**
     * 获取单个项目详情
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目详情
     */
    ProjectDto getProjectById(Integer projectId, Integer companyId);

    /**
     * 更新项目
     * @param projectDto 项目DTO
     * @param companyId 公司ID
     * @return 更新后的项目
     */
    ProjectDto updateProject(ProjectDto projectDto, Integer companyId);

    /**
     * 创建项目
     * @param projectDto 项目DTO
     * @param companyId 公司ID
     * @return 创建的项目
     */
    ProjectDto createProject(ProjectDto projectDto, Integer companyId);

    /**
     * 删除项目（更新删除状态）
     * @param projectId 项目ID
     * @param isDelete 是否删除
     * @param companyId 公司ID
     * @return 操作结果
     */
    DeleteProjectResponseDto deleteProject(Integer projectId, boolean isDelete, Integer companyId);

    /**
     * 归档项目
     * @param projectId 项目ID
     * @param isArchive 是否归档
     * @param companyId 公司ID
     * @return 操作结果
     */
    DeleteProjectResponseDto archiveProject(Integer projectId, boolean isArchive, Integer companyId);

    /**
     * 获取项目联系客户提醒日期
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目联系客户日期包装DTO
     */
    WrapperProjectContactCustomerDto getProjectContactCustomerReminderDate(Integer projectId, Integer companyId);

    /**
     * 关联项目负责人与项目
     * @param param 项目负责人DTO
     * @param companyId 公司ID
     * @return 项目负责人包装DTO
     */
    WrapperProjectLeaderDto associateProjectLeaderWithProject(WrapperProjectLeaderDto param, Integer companyId);

    /**
     * 获取项目负责人信息
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目负责人包装DTO
     */
    WrapperProjectLeaderDto getProjectLeaderWithProjectID(Integer projectId, Integer companyId);

    /**
     * 获取项目工作流10步骤保存的详细信息
     * @param workflowId 工作流ID
     * @param workflowStepId 工作流步骤ID
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目工作流10步骤保存详情包装DTO
     */
    WrapperProjectWFTenSavedDetailsDto getProjectWFTenSavedDetails(
            Integer workflowId, Integer workflowStepId, Integer projectId, Integer companyId);

    /**
     * 更新项目的控制声明PDF日期
     * @param projectId 项目ID
     * @param companyId 公司ID
     */
    void updateProjectKontrollerklaeringPdfDate(Integer projectId, Integer companyId);

    /**
     * 更新项目的最终报告PDF日期
     * @param projectId 项目ID
     * @param companyId 公司ID
     */
    void updateProjectFinalReportPdfDate(Integer projectId, Integer companyId);

    /**
     * 更新项目的发票设置日期
     * @param projectId 项目ID
     */
    void updateProjectInvoiceSetDate(Integer projectId);

    /**
     * 获取检查员用户列表（新格式）
     * 注：旧后端此方法位于 UserProfileService，新后端 UserProfileService 接口已精简且不含此方法，
     * 故在 Project 域内复刻以保证 /api/Project/GetInspectorUsers 端点契约不变。
     * @param companyId 公司ID
     * @return 检查员用户包装DTO
     */
    WrapperMultiUserInspectorDto getInspectorsInNewFormat(Integer companyId);
}
