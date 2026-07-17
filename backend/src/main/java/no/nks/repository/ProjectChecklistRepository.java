package no.nks.repository;

import no.nks.entity.ProjectChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 项目检查清单仓库接口
 */
@Repository
public interface ProjectChecklistRepository extends JpaRepository<ProjectChecklist, Integer> {
    
    /**
     * 根据项目ID查找所有检查清单
     * 
     * @param projectId 项目ID
     * @return 检查清单列表
     */
    List<ProjectChecklist> findByProjectId(Integer projectId);
} 