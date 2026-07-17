package no.nks.repository;

import no.nks.entity.ProjectParty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import no.nks.dto.ProjectPartyDetailsDto;

import java.util.List;

/**
 * 项目参与方数据访问接口
 */
@Repository
public interface ProjectPartyRepository extends JpaRepository<ProjectParty, Integer> {
    
    /**
     * 根据项目ID查找所有参与方
     * 
     * @param projectId 项目ID
     * @return 项目参与方列表
     */
    List<ProjectParty> findByProjectId(Integer projectId);
    
    /**
     * 根据项目ID、参与方ID和参与方类型ID查找项目参与方
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @return 项目参与方列表
     */
    List<ProjectParty> findByProjectIdAndPartyIdAndPartyTypeId(Integer projectId, Integer partyId, Integer partyTypeId);
    
    /**
     * 根据项目ID、参与方ID和参与方类型ID检查是否存在
     * 
     * @param projectId 项目ID
     * @param partyId 参与方ID
     * @param partyTypeId 参与方类型ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByProjectIdAndPartyIdAndPartyTypeId(Integer projectId, Integer partyId, Integer partyTypeId);
    
    @Query("SELECT pp FROM ProjectParty pp LEFT JOIN FETCH pp.partyType WHERE pp.projectId = :projectId")
    List<ProjectParty> findByProjectIdWithPartyType(@Param("projectId") Integer projectId);
    
    // 根据项目ID和参与方类型ID查找参与方
    List<ProjectParty> findByProjectIdAndPartyTypeId(Integer projectId, Integer partyTypeId);
    
    // 根据项目ID和参与方ID查找参与方
    List<ProjectParty> findByProjectIdAndPartyId(Integer projectId, Integer partyId);
    
    // 删除特定项目的所有参与方
    void deleteByProjectId(Integer projectId);
    
    // 检查特定参与方是否与项目关联
    boolean existsByProjectIdAndPartyId(Integer projectId, Integer partyId);

    @Query("SELECT new no.nks.dto.ProjectPartyDetailsDto(p.partyId, pt.id, cb.name, pt.name, cb.email) " +
           "FROM ProjectParty p " +
           "JOIN ContactBook cb ON p.partyId = cb.id " +
           "JOIN PartyType pt ON p.partyTypeId = pt.id " +
           "WHERE p.projectId = :projectId AND cb.name != 'Dummy Contact'")
    List<ProjectPartyDetailsDto> findProjectPartyDetailsByProjectId(@Param("projectId") Integer projectId);

    @Query("SELECT new no.nks.dto.ProjectPartyDetailsDto(p.partyId, pt.id, cb.name, pt.name, cb.email) " +
           "FROM ProjectParty p " +
           "JOIN ContactBook cb ON p.partyId = cb.id " +
           "JOIN PartyType pt ON p.partyTypeId = pt.id " +
           "WHERE p.projectId = :projectId AND pt.id = :partyTypeId AND cb.name != 'Dummy Contact'")
    List<ProjectPartyDetailsDto> findProjectPartyDetailsByProjectIdAndPartyType(@Param("projectId") Integer projectId, @Param("partyTypeId") Integer partyTypeId);
} 