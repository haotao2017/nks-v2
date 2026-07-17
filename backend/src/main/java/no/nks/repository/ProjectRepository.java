package no.nks.repository;

import no.nks.entity.Project;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 项目数据访问接口
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {
    boolean existsByContactPersonIdAndCompanyId(Integer contactPersonId, Integer companyId);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.isDeleted IS NULL AND p.isArchived IS NULL AND p.companyId = :companyId")
    Integer countByNotArchivedOrDeletedAndCompanyId(@Param("companyId") Integer companyId);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.isDeleted = true AND p.companyId = :companyId")
    Integer countByDeletedAndCompanyId(@Param("companyId") Integer companyId);
    
    @Query("SELECT COUNT(p) FROM Project p WHERE p.isArchived = true AND p.companyId = :companyId")
    Integer countByArchivedAndCompanyId(@Param("companyId") Integer companyId);
    
    /**
     * 查询最大项目ID
     * 用于手动生成新项目的ID
     */
    @Query("SELECT MAX(p.id) FROM Project p")
    Integer findMaxId();
    
    // 查询所有项目
    @Query("SELECT p FROM Project p WHERE p.companyId = :companyId ORDER BY p.id DESC")
    List<Project> findByCompanyIdOrderByIdDesc(@Param("companyId") Integer companyId, Pageable pageable);
    
    // 查询未归档未删除的项目
    @Query("SELECT p FROM Project p WHERE p.isDeleted IS NULL AND p.isArchived IS NULL AND p.companyId = :companyId ORDER BY p.id DESC")
    List<Project> findActiveProjects(@Param("companyId") Integer companyId, Pageable pageable);
    
    // 查询已归档的项目
    @Query("SELECT p FROM Project p WHERE p.isArchived = true AND p.companyId = :companyId ORDER BY p.id DESC")
    List<Project> findArchivedProjects(@Param("companyId") Integer companyId, Pageable pageable);
    
    // 查询已删除的项目
    @Query("SELECT p FROM Project p WHERE p.isDeleted = true AND p.companyId = :companyId ORDER BY p.id DESC")
    List<Project> findDeletedProjects(@Param("companyId") Integer companyId, Pageable pageable);
    
    /**
     * 根据项目ID获取项目及其所有关联数据
     * 包括项目服务、项目参与方等
     */
    @Query(value = "SELECT p.* FROM [nbkUser].[Project] p WHERE p.ID = :id", nativeQuery = true)
    Optional<Project> findProjectWithBasicInfo(@Param("id") Integer id);
    
    /**
     * 检查指定ID和公司ID的项目是否存在
     * 
     * @param id 项目ID
     * @param companyId 公司ID
     * @return 如果项目存在则返回true，否则返回false
     */
    boolean existsByIdAndCompanyId(Integer id, Integer companyId);
    
    /**
     * 获取项目负责人ID
     * 
     * @param id 项目ID
     * @param companyId 公司ID
     * @return 项目负责人ID
     */
    @Query("SELECT p.projectLeaderId FROM Project p WHERE p.id = :id AND p.companyId = :companyId")
    Optional<Integer> findProjectLeaderIdByIdAndCompanyId(@Param("id") Integer id, @Param("companyId") Integer companyId);
    
    /**
     * 更新项目负责人ID
     * 
     * @param id 项目ID
     * @param projectLeaderId 项目负责人ID
     * @param modifiedDate 修改日期
     * @return 受影响的行数
     */
    @Modifying
    @Query("UPDATE Project p SET p.projectLeaderId = :projectLeaderId, p.modifiedDate = :modifiedDate WHERE p.id = :id")
    int updateProjectLeaderId(@Param("id") Integer id, @Param("projectLeaderId") Integer projectLeaderId, @Param("modifiedDate") LocalDateTime modifiedDate);
    
    /**
     * 查询指定检查员和公司的有效项目
     * 
     * @param inspectorId 检查员ID
     * @param companyId 公司ID
     * @return 满足条件的项目列表
     */
    @Query("SELECT p FROM Project p WHERE p.inspectorId = :inspectorId AND p.companyId = :companyId " +
           "AND (p.isArchived IS NULL OR p.isArchived = false) " +
           "AND (p.isDeleted IS NULL OR p.isDeleted = false) " +
           "AND (p.skipInspection IS NULL OR p.skipInspection = false) " +
           "AND (p.completeDate IS NULL OR p.completeDate > :oneHourAgo) " +
           "ORDER BY p.inspectionDate DESC")
    List<Project> findActiveProjectsByInspectorAndCompany(
            @Param("inspectorId") Integer inspectorId, 
            @Param("companyId") Integer companyId,
            @Param("oneHourAgo") LocalDateTime oneHourAgo);
    
    /**
     * 根据ID和公司ID查询项目，并预加载所有关联集合
     * 
     * @param id 项目ID
     * @param companyId 公司ID
     * @return 项目对象及其关联数据
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN FETCH p.projectParties " +
           "LEFT JOIN FETCH p.projectChecklists " +
           "WHERE p.id = :id AND p.companyId = :companyId")
    Optional<Project> findByIdAndCompanyIdWithAllAssociations(
            @Param("id") Integer id,
            @Param("companyId") Integer companyId);
            
    /**
     * 根据ID和公司ID查询项目并预加载项目参与方
     * 解决MultipleBagFetchException问题
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN FETCH p.projectParties " +
           "WHERE p.id = :id AND p.companyId = :companyId")
    Optional<Project> findByIdAndCompanyIdWithParties(
            @Param("id") Integer id,
            @Param("companyId") Integer companyId);
            
    /**
     * 优化查询：获取项目检查表及其项目数量
     * 避免N+1查询问题
     */
    @Query(value = "SELECT pc.ID as checklistId, pc.ChecklistName as name, " +
           "(SELECT COUNT(ci.ID) FROM [nbkUser].[ChecklistItems] ci WHERE ci.ChecklistId = pc.ID) as itemCount " +
           "FROM [nbkUser].[ProjectChecklist] pc WHERE pc.ProjectId = :projectId", 
           nativeQuery = true)
    List<Object[]> findChecklistsWithItemCount(@Param("projectId") Integer projectId);
            
    /**
     * 根据ID和公司ID查询项目并预加载检查表
     * 解决MultipleBagFetchException问题
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN FETCH p.projectChecklists " +
           "WHERE p.id = :id AND p.companyId = :companyId")
    Optional<Project> findByIdAndCompanyIdWithChecklists(
            @Param("id") Integer id,
            @Param("companyId") Integer companyId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.customer WHERE p.id = :projectId")
    Optional<Project> findByIdWithCustomer(@Param("projectId") Integer projectId);

    @Query("SELECT p FROM Project p " +
           "LEFT JOIN FETCH p.customer " +
           "LEFT JOIN FETCH p.projectServices ps " +
           "LEFT JOIN FETCH ps.service " +
           "WHERE p.id = :projectId")
    Optional<Project> findByIdWithDetailsForTripletex(@Param("projectId") Integer projectId);
} 