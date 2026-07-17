package no.nks.repository;

import no.nks.entity.ProjectService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectServiceRepository extends JpaRepository<ProjectService, Integer> {
    
    /**
     * Finds services associated with a project.
     * @param projectId ID of the project
     * @return List of project services
     */
    List<ProjectService> findByProjectId(Integer projectId);
    
    /**
     * 根据项目ID批量查询项目服务及其关联服务信息
     */
    @Query("SELECT ps FROM ProjectService ps LEFT JOIN FETCH ps.service WHERE ps.projectId = :projectId")
    List<ProjectService> findByProjectIdWithService(@Param("projectId") Integer projectId);
    
    /**
     * 根据项目ID和服务ID查找项目服务
     */
    ProjectService findByProjectIdAndServiceId(Integer projectId, Integer serviceId);
    
    /**
     * 根据项目ID和服务ID列表查找服务
     */
    List<ProjectService> findByProjectIdAndServiceIdIn(Integer projectId, List<Integer> serviceIds);
    
    /**
     * 根据项目ID和ID列表查找服务
     */
    List<ProjectService> findByProjectIdAndIdIn(Integer projectId, List<Integer> ids);
    
    /**
     * 根据项目ID和isNewAdded标志查找服务
     */
    @Query("SELECT ps FROM ProjectService ps WHERE ps.projectId = :projectId AND ps.isNewAdded = :isNewAdded")
    List<ProjectService> findByProjectIdAndIsNewAdded(@Param("projectId") Integer projectId, @Param("isNewAdded") Boolean isNewAdded);
    
    /**
     * 根据项目ID删除项目服务
     */
    void deleteByProjectId(Integer projectId);
    
    /**
     * Checks if a service is already associated with a project.
     * @param projectId ID of the project
     * @param serviceId ID of the service
     * @return True if the association exists, false otherwise
     */
    boolean existsByProjectIdAndServiceId(Integer projectId, Integer serviceId);
} 