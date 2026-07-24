package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ProjectPartyDto;
import no.nks.dto.WrapperMultiProjectPartyDto;
import no.nks.dto.WrapperProjectPartyDto;
import no.nks.entity.ProjectParty;
import no.nks.entity.RequestResponse;
import no.nks.repository.ProjectPartyRepository;
import no.nks.repository.ProjectRepository;
import no.nks.service.ProjectPartyService;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 项目参与方服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "projectPartyCache")
public class ProjectPartyServiceImpl implements ProjectPartyService {

    private final ProjectPartyRepository projectPartyRepository;
    private final ProjectRepository projectRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Cacheable(key = "'parties_' + #projectId + '_' + #companyId", unless = "#result.multiProjectParty == null || #result.multiProjectParty.isEmpty()")
    public WrapperMultiProjectPartyDto getAllProjectPartiesByProjectID(Integer projectId, Integer companyId) {
        log.debug("获取项目ID为 {} 的所有参与方", projectId);

        // 验证项目是否存在且属于该公司
        validateProjectBelongsToCompany(projectId, companyId);

        // 获取项目参与方列表（优化查询，一次性获取关联数据）
        List<ProjectParty> projectParties = projectPartyRepository.findByProjectId(projectId);

        // 同一角色只保留最新一条(兼容历史「更换=插入」叠出来的重复)
        Map<Integer, ProjectParty> uniqueByType = new LinkedHashMap<>();
        projectParties.stream()
                .sorted(Comparator.comparing(ProjectParty::getId, Comparator.nullsLast(Integer::compareTo)))
                .forEach(pp -> {
                    if (pp.getPartyTypeId() != null) {
                        uniqueByType.put(pp.getPartyTypeId(), pp);
                    }
                });

        List<ProjectPartyDto> projectPartyDtos = uniqueByType.values().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        log.debug("成功获取 {} 个项目参与方", projectPartyDtos.size());
        return new WrapperMultiProjectPartyDto(projectPartyDtos);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    @CacheEvict(key = "'parties_' + #param.projectParty.projectId + '_' + #companyId")
    public RequestResponse associatePartyWithProjectPartyType(WrapperProjectPartyDto param, Integer companyId) {
        log.debug("关联参与方 {} 与项目参与方类型 {}",
                param.getProjectParty().getPartyId(), param.getProjectParty().getPartyTypeId());

        try {
            ProjectPartyDto incoming = param.getProjectParty();
            if (incoming == null
                    || incoming.getProjectId() == null
                    || incoming.getPartyId() == null
                    || incoming.getPartyTypeId() == null) {
                return RequestResponse.failure("Prosjekt, part og parttype er påkrevd");
            }

            validateProjectBelongsToCompany(incoming.getProjectId(), companyId);

            Integer projectId = incoming.getProjectId();
            Integer partyId = incoming.getPartyId();
            Integer partyTypeId = incoming.getPartyTypeId();

            // 同一项目+角色只保留一条：已是同一联系人则直接成功；否则替换 partyId 并清理多余行
            List<ProjectParty> forType =
                    projectPartyRepository.findByProjectIdAndPartyTypeId(projectId, partyTypeId);

            if (!forType.isEmpty()) {
                ProjectParty keep = forType.stream()
                        .max(java.util.Comparator.comparing(
                                ProjectParty::getId, java.util.Comparator.nullsLast(Integer::compareTo)))
                        .orElse(forType.get(0));

                if (partyId.equals(keep.getPartyId())) {
                    // 清理历史上同角色的重复行
                    List<ProjectParty> extras = forType.stream()
                            .filter(pp -> keep.getId() == null || !keep.getId().equals(pp.getId()))
                            .collect(Collectors.toList());
                    if (!extras.isEmpty()) {
                        projectPartyRepository.deleteAll(extras);
                    }
                    log.debug("Part allerede koblet til parttype, ingen endring");
                    return RequestResponse.success("Part koblet til prosjektets parttype");
                }

                keep.setPartyId(partyId);
                projectPartyRepository.save(keep);

                List<ProjectParty> extras = forType.stream()
                        .filter(pp -> keep.getId() == null || !keep.getId().equals(pp.getId()))
                        .collect(Collectors.toList());
                if (!extras.isEmpty()) {
                    projectPartyRepository.deleteAll(extras);
                }

                log.debug("Parttype-binding oppdatert (erstattet kontakt)");
                return RequestResponse.success("Part koblet til prosjektets parttype");
            }

            ProjectParty projectParty = convertToEntity(incoming);
            projectParty.setId(null);
            projectPartyRepository.save(projectParty);

            log.debug("Part koblet til prosjektets parttype");
            return RequestResponse.success("Part koblet til prosjektets parttype");
        } catch (Exception e) {
            log.error("Kunne ikke koble part til parttype: {}", e.getMessage(), e);
            return RequestResponse.failure("Kunne ikke koble part til parttype: " + e.getMessage());
        }
    }

    /**
     * 验证项目是否存在且属于指定的公司
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @throws IllegalArgumentException 如果项目不存在或不属于该公司
     */
    private void validateProjectBelongsToCompany(Integer projectId, Integer companyId) {
        if (projectId == null || companyId == null) {
            throw new IllegalArgumentException("Prosjekt-ID og firma-ID mangler");
        }

        boolean exists = projectRepository.existsByIdAndCompanyId(projectId, companyId);
        if (!exists) {
            log.warn("项目 {} 不存在或不属于公司 {}", projectId, companyId);
            throw new IllegalArgumentException("Prosjektet finnes ikke eller tilgang mangler");
        }
    }

    /**
     * 将实体转换为DTO
     *
     * @param entity 实体对象
     * @return DTO对象
     */
    private ProjectPartyDto convertToDto(ProjectParty entity) {
        ProjectPartyDto dto = new ProjectPartyDto();
        dto.setId(entity.getId());
        dto.setProjectId(entity.getProjectId());
        dto.setPartyId(entity.getPartyId());
        dto.setPartyTypeId(entity.getPartyTypeId());

        // 获取关联实体的数据
        if (entity.getPartyType() != null) {
            dto.setPartyTypeName(entity.getPartyType().getName());
        } else {
            dto.setPartyTypeName(entity.getPartyTypeName());
        }

        if (entity.getParty() != null) {
            dto.setPartyName(entity.getParty().getName());
            dto.setEmail(entity.getParty().getEmail());
            dto.setContactNumber(entity.getParty().getContactNo());
        } else {
            dto.setPartyName(entity.getPartyName());
            dto.setEmail(entity.getEmail());
            dto.setContactNumber(entity.getContactNumber());
        }

        return dto;
    }

    /**
     * 将DTO转换为实体
     *
     * @param dto DTO对象
     * @return 实体对象
     */
    private ProjectParty convertToEntity(ProjectPartyDto dto) {
        ProjectParty entity = new ProjectParty();
        entity.setId(dto.getId());
        entity.setProjectId(dto.getProjectId());
        entity.setPartyId(dto.getPartyId());
        entity.setPartyTypeId(dto.getPartyTypeId());

        // 设置Transient字段，这些字段不会被持久化到数据库
        entity.setPartyTypeName(dto.getPartyTypeName());
        entity.setPartyName(dto.getPartyName());
        entity.setEmail(dto.getEmail());
        entity.setContactNumber(dto.getContactNumber());

        return entity;
    }
}
