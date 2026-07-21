package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.*;
import no.nks.entity.Project;
import no.nks.entity.ContactBook;
import no.nks.entity.BuildingSupplier;
import no.nks.entity.ProjectParty;
import no.nks.entity.ProjectService;
import no.nks.entity.Service;
import no.nks.entity.ServiceWorkflowCategory;
import no.nks.entity.PartyType;
import no.nks.entity.User;
import no.nks.entity.ChecklistTemplate;
import no.nks.entity.ChecklistItemTemplate;
import no.nks.entity.ProjectChecklist;
import no.nks.entity.ChecklistItem;
import no.nks.repository.ContactRepository;
import no.nks.repository.ProjectRepository;
import no.nks.repository.BuildingSupplierRepository;
import no.nks.repository.ProjectPartyRepository;
import no.nks.repository.ProjectServiceRepository;
import no.nks.repository.ServiceRepository;
import no.nks.repository.ServiceWorkflowCategoryRepository;
import no.nks.repository.PartyTypeRepository;
import no.nks.repository.UserRepository;
import no.nks.repository.ProjectChecklistRepository;
import no.nks.repository.ChecklistItemRepository;
import no.nks.util.SoftDeleteFlags;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Qualifier;

@org.springframework.stereotype.Service
@Slf4j
public class ProjectServiceImpl implements no.nks.service.ProjectService {

    private final ProjectRepository projectRepository;
    private final ContactRepository contactRepository;
    private final BuildingSupplierRepository buildingSupplierRepository;
    private final ProjectPartyRepository projectPartyRepository;
    private final ProjectServiceRepository projectServiceRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceWorkflowCategoryRepository serviceWorkflowCategoryRepository;
    private final PartyTypeRepository partyTypeRepository;
    private final Executor projectDetailExecutor;
    private final UserRepository userRepository;
    private final ProjectChecklistRepository projectChecklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final CacheManager cacheManager;

    private static final long COMPLETABLE_FUTURE_TIMEOUT_SECONDS = 10;

    public ProjectServiceImpl(
            ProjectRepository projectRepository,
            ContactRepository contactRepository,
            BuildingSupplierRepository buildingSupplierRepository,
            ProjectPartyRepository projectPartyRepository,
            ProjectServiceRepository projectServiceRepository,
            ServiceRepository serviceRepository,
            ServiceWorkflowCategoryRepository serviceWorkflowCategoryRepository,
            PartyTypeRepository partyTypeRepository,
            @Qualifier("projectDetailExecutor") Executor projectDetailExecutor,
            UserRepository userRepository,
            ProjectChecklistRepository projectChecklistRepository,
            ChecklistItemRepository checklistItemRepository,
            CacheManager cacheManager) {
        this.projectRepository = projectRepository;
        this.contactRepository = contactRepository;
        this.buildingSupplierRepository = buildingSupplierRepository;
        this.projectPartyRepository = projectPartyRepository;
        this.projectServiceRepository = projectServiceRepository;
        this.serviceRepository = serviceRepository;
        this.serviceWorkflowCategoryRepository = serviceWorkflowCategoryRepository;
        this.partyTypeRepository = partyTypeRepository;
        this.projectDetailExecutor = projectDetailExecutor;
        this.userRepository = userRepository;
        this.projectChecklistRepository = projectChecklistRepository;
        this.checklistItemRepository = checklistItemRepository;
        this.cacheManager = cacheManager;
    }

    @Override
    @Cacheable(value = "projectCountsCache", key = "#companyId")
    public ProjectCountDto getProjectsCount(Integer companyId) {
        return ProjectCountDto.builder()
                .notArchivedOrDeleted(projectRepository.countByNotArchivedOrDeletedAndCompanyId(companyId))
                .deleted(projectRepository.countByDeletedAndCompanyId(companyId))
                .archived(projectRepository.countByArchivedAndCompanyId(companyId))
                .build();
    }

    @Override
    public List<ProjectDto> getAllProjects(Integer companyId, int entriesFrom, int entriesTill) {
        int skip = entriesFrom - 1;
        int pageSize = entriesTill - skip;

        Pageable pageable = PageRequest.of(0, pageSize);

        List<Project> projects = projectRepository.findByCompanyIdOrderByIdDesc(companyId, pageable);

        return projects.stream()
                .map(this::mapProjectToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectListDto> getActiveProjects(Integer companyId, int entriesFrom, int entriesTill) {
        int skip = entriesFrom - 1;
        int pageSize = entriesTill - entriesFrom + 1;
        Pageable pageable = PageRequest.of(0, pageSize);

        List<Project> projects = projectRepository.findActiveProjects(companyId, pageable);
        return projects.stream()
                .map(this::mapProjectToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectDto> getArchivedProjects(Integer companyId, int entriesFrom, int entriesTill) {
        int skip = entriesFrom - 1;
        int pageSize = entriesTill - entriesFrom + 1;
        Pageable pageable = PageRequest.of(0, pageSize);

        List<Project> projects = projectRepository.findArchivedProjects(companyId, pageable);
        return projects.stream()
                .map(this::mapProjectToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectDto> getDeletedProjects(Integer companyId, int entriesFrom, int entriesTill) {
        int skip = entriesFrom - 1;
        int pageSize = entriesTill - entriesFrom + 1;
        Pageable pageable = PageRequest.of(0, pageSize);

        List<Project> projects = projectRepository.findDeletedProjects(companyId, pageable);
        return projects.stream()
                .map(this::mapProjectToDto)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.cache.annotation.Cacheable(value = "projectCache", key = "#projectId + '_' + #companyId", unless = "#result == null")
    public ProjectDto getProjectById(Integer projectId, Integer companyId) {
        Project project = projectRepository.findProjectWithBasicInfo(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

        if (!project.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Du har ikke tilgang til dette prosjektet");
        }

        ProjectDto projectDto = mapProjectToDto(project);

        try {
            CompletableFuture<Void> customerFuture = loadCustomerData(project, projectDto);
            CompletableFuture<Void> servicesFuture = loadProjectServices(projectId, projectDto);
            CompletableFuture<Void> partiesFuture = loadProjectParties(projectId, projectDto);

            CompletableFuture.allOf(customerFuture, servicesFuture, partiesFuture)
                .get(COMPLETABLE_FUTURE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("获取项目 {} 关联信息时发生异常或超时", projectId, e);
        }

        return projectDto;
    }

    private CompletableFuture<Void> loadCustomerData(Project project, ProjectDto projectDto) {
        return CompletableFuture.runAsync(() -> {
            try {
                Optional.ofNullable(project.getCustomerId())
                        .flatMap(contactRepository::findById)
                        .ifPresent(customer -> projectDto.setCustomer(mapContactToDto(customer)));

                Optional.ofNullable(project.getContactPersonId())
                        .flatMap(contactRepository::findById)
                        .ifPresent(contactPerson -> projectDto.setContactPerson(mapContactToDto(contactPerson)));

                Optional.ofNullable(project.getBuildingSupplierId())
                        .flatMap(buildingSupplierRepository::findById)
                        .ifPresent(supplier -> projectDto.setBuildingSupplier(mapBuildingSupplierToDto(supplier)));
            } catch (Exception e) {
                log.warn("加载客户数据时发生异常, 项目ID: {}, 客户ID: {}, 联系人ID: {}, 建筑商ID: {}", project != null ? project.getId() : "N/A", project != null ? project.getCustomerId() : "N/A", project != null ? project.getContactPersonId() : "N/A", project != null ? project.getBuildingSupplierId() : "N/A" , e);
            }
        }, projectDetailExecutor);
    }

    private CompletableFuture<Void> loadProjectServices(Integer projectId, ProjectDto projectDto) {
        return CompletableFuture.runAsync(() -> {
            try {
                List<ProjectService> projectServices = projectServiceRepository.findByProjectIdWithService(projectId);
                if (projectServices.isEmpty()) {
                    return;
                }

                List<ProjectServiceDto> projectServiceDtos = projectServices.stream()
                        .filter(ps -> ps.getService() != null)
                        .map(ps -> mapProjectServiceToDto(ps, ps.getService()))
                        .collect(Collectors.toList());

                projectDto.setProjectService(projectServiceDtos);

                List<Integer> serviceIds = projectServices.stream()
                        .map(ProjectService::getServiceId)
                        .collect(Collectors.toList());

                if (!serviceIds.isEmpty()) {
                    List<ServiceWorkflowCategory> workflowCategories = serviceWorkflowCategoryRepository.findByServiceIdIn(serviceIds);
                    if (!workflowCategories.isEmpty()) {
                        projectDto.setProjectServiceWorkflowList(mapWorkflowCategoriesToDto(workflowCategories));
                    }
                }
            } catch (Exception e) {
                log.warn("加载项目服务数据时发生异常, 项目ID: {}", projectId, e);
            }
        }, projectDetailExecutor);
    }

    private CompletableFuture<Void> loadProjectParties(Integer projectId, ProjectDto projectDto) {
        return CompletableFuture.runAsync(() -> {
            try {
                List<ProjectParty> projectParties = projectPartyRepository.findByProjectIdWithPartyType(projectId);
                if (projectParties.isEmpty()) {
                    return;
                }

                List<Integer> partyIds = projectParties.stream()
                        .map(ProjectParty::getPartyId)
                        .filter(id -> id != null)
                        .collect(Collectors.toList());

                Map<Integer, ContactBook> contactMap = new HashMap<>();
                if (!partyIds.isEmpty()) {
                    List<ContactBook> contacts = contactRepository.findAllById(partyIds);
                    contactMap = contacts.stream()
                            .collect(Collectors.toMap(ContactBook::getId, contact -> contact));
                }

                Map<String, Object> result = new HashMap<>();
                List<Map<String, Object>> partiesList = new ArrayList<>();

                for (ProjectParty pp : projectParties) {
                    Map<String, Object> party = new HashMap<>();
                    party.put("id", pp.getId());
                    party.put("projectId", pp.getProjectId());
                    party.put("partyId", pp.getPartyId());
                    party.put("partyTypeId", pp.getPartyTypeId());

                    if (pp.getPartyType() != null) {
                        party.put("partyTypeName", pp.getPartyType().getName());
                    } else {
                        party.put("partyTypeName", null);
                    }

                    Integer partyId = pp.getPartyId();
                    if (partyId != null) {
                        ContactBook contact = contactMap.get(partyId);
                        if (contact != null) {
                            party.put("partyName", contact.getName());
                            party.put("email", contact.getEmail());
                            party.put("contactNumber", contact.getContactNo());
                        }
                    }

                    partiesList.add(party);
                }

                result.put("multiProjectParty", partiesList);
                projectDto.setProjectParties(result);
            } catch (Exception e) {
                log.warn("加载项目参与方数据时发生异常, 项目ID: {}", projectId, e);
            }
        }, projectDetailExecutor);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "projectCache", key = "#projectDto.id + '_' + #companyId")
    public ProjectDto updateProject(ProjectDto projectDto, Integer companyId) {
        if (projectDto.getId() == null) {
            throw new IllegalArgumentException("Prosjekt-ID mangler");
        }

        Project existingProject = projectRepository.findProjectWithBasicInfo(projectDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectDto.getId()));

        if (!existingProject.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Du har ikke tilgang til å oppdatere dette prosjektet");
        }

        updateProjectFields(existingProject, projectDto);

        existingProject.setModifiedDate(LocalDateTime.now());

        Project updatedProject = projectRepository.save(existingProject);

        ProjectDto resultDto = mapProjectToDto(updatedProject);

        List<ProjectServiceDto> projectServices = projectDto.getProjectService();
        if (projectServices != null && !projectServices.isEmpty()) {
            processProjectServicesAsync(projectServices, updatedProject.getId())
                .thenAccept(updatedServices -> {
                    resultDto.setProjectService(updatedServices);
                })
                .exceptionally(ex -> {
                    log.error("处理项目服务时En feil oppstod, 项目ID: {}", updatedProject.getId(), ex);
                    return null;
                });
        }

        return resultDto;
    }

    @Async
    @Transactional
    public CompletableFuture<List<ProjectServiceDto>> processProjectServicesAsync(List<ProjectServiceDto> servicesList, Integer projectId) {
        List<ProjectServiceDto> result = new ArrayList<>();

        if (servicesList == null || servicesList.isEmpty()) {
            return CompletableFuture.completedFuture(result);
        }

        List<ProjectServiceDto> newAddedServices = servicesList.stream()
                .filter(ps -> Boolean.TRUE.equals(ps.getIsNewAdded()) || ps.getId() == null)
                .collect(Collectors.toList());

        try {
            List<ProjectService> newServices = new ArrayList<>();
            for (ProjectServiceDto dto : newAddedServices) {
                ProjectService newService = createProjectService(projectId, dto);
                newServices.add(newService);
            }

            if (!newServices.isEmpty()) {
                List<ProjectService> savedServices = projectServiceRepository.saveAll(newServices);

                for (int i = 0; i < savedServices.size(); i++) {
                    ProjectServiceDto dto = newAddedServices.get(i);
                    dto.setId(savedServices.get(i).getId());
                    dto.setIsNewAdded(false);
                    result.add(dto);
                }

                createProjectChecklistsForNewServices(projectId, newAddedServices);
            }

            List<ProjectServiceDto> existingServices = servicesList.stream()
                    .filter(ps -> !Boolean.TRUE.equals(ps.getIsNewAdded()) && ps.getId() != null)
                    .collect(Collectors.toList());

            if (!existingServices.isEmpty()) {
                List<Integer> serviceIds = existingServices.stream()
                        .map(ProjectServiceDto::getId)
                        .collect(Collectors.toList());

                List<ProjectService> existingProjectServices = projectServiceRepository.findAllById(serviceIds);
                Map<Integer, ProjectService> serviceMap = existingProjectServices.stream()
                        .collect(Collectors.toMap(ProjectService::getId, ps -> ps));

                List<ProjectService> servicesToUpdate = new ArrayList<>();
                for (ProjectServiceDto dto : existingServices) {
                    ProjectService service = serviceMap.get(dto.getId());
                    if (service != null) {
                        updateProjectService(service, dto);
                        servicesToUpdate.add(service);
                        result.add(dto);
                    }
                }

                if (!servicesToUpdate.isEmpty()) {
                    projectServiceRepository.saveAll(servicesToUpdate);
                }
            }
        } catch (Exception e) {
            log.error("处理项目服务失败, 项目ID: {}", projectId, e);
            throw e;
        }

        return CompletableFuture.completedFuture(result);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projectCountsCache", key = "#companyId"),
            @CacheEvict(value = "projectCache", key = "#result.id + '_' + #companyId", condition = "#result != null && #result.id != null")
    })
    public ProjectDto createProject(ProjectDto projectDto, Integer companyId) {
        Project project = new Project();

        Integer maxId = getProjectsMaxId();
        project.setId(maxId + 1);
        projectDto.setId(project.getId());

        updateProjectFields(project, projectDto);

        project.setCompanyId(companyId);

        project.setDated(LocalDateTime.now());
        project.setIsDeleted(null);
        project.setIsArchived(null);

        String address = project.getAddress() != null ? project.getAddress() : "";
        String gardsNo = project.getGardsNo() != null ? project.getGardsNo() : "";
        String bruksnmmer = project.getBruksnmmer() != null ? project.getBruksnmmer() : "";
        project.setTitle(project.getId() + " - " + address + " - " + gardsNo + "/" + bruksnmmer);

        Project savedProject = projectRepository.save(project);

        ProjectDto resultDto = mapProjectToDto(savedProject);

        if (projectDto.getProjectService() != null && !projectDto.getProjectService().isEmpty()) {
            resultDto.setProjectService(insertProjectServices(projectDto.getProjectService(), savedProject.getId()));

            List<ServiceWorkflowCategory> workflowCategories = getServiceWorkflowCategoryByServiceId(projectDto.getProjectService());

            addProjectParties(savedProject.getId(), workflowCategories, companyId);

            resultDto.setProjectServiceWorkflowList(mapWorkflowCategoriesToDto(workflowCategories));

            // 为新项目的服务创建检查清单
            createProjectChecklistsForNewServices(savedProject.getId(), projectDto.getProjectService());
        }

        return resultDto;
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projectCountsCache", key = "#companyId"),
            @CacheEvict(value = "projectCache", key = "#projectId + '_' + #companyId")
    })
    public DeleteProjectResponseDto deleteProject(Integer projectId, boolean isDelete, Integer companyId) {
        try {
            Project project = projectRepository.findProjectWithBasicInfo(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

            if (!project.getCompanyId().equals(companyId)) {
                log.warn("权限不足：用户的公司ID{}与项目的公司ID{}不匹配, 项目ID: {}", companyId, project.getCompanyId(), projectId);
                return new DeleteProjectResponseDto("Du har ikke tilgang til dette prosjektet", false);
            }

            project.setIsDeleted(SoftDeleteFlags.toFlag(isDelete));
            projectRepository.saveAndFlush(project);

            return new DeleteProjectResponseDto(
                    isDelete ? "Prosjektet er slettet" : "Prosjektet er gjenopprettet",
                    true);
        } catch (EntityNotFoundException e) {
            log.error("删除项目失败: {}", e.getMessage());
            return new DeleteProjectResponseDto(e.getMessage(), false);
        } catch (Exception e) {
            log.error("删除项目时En feil oppstod: {}", e.getMessage(), e);
            return new DeleteProjectResponseDto("Handlingen mislyktes: " + e.getMessage(), false);
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projectCountsCache", key = "#companyId"),
            @CacheEvict(value = "projectCache", key = "#projectId + '_' + #companyId")
    })
    public DeleteProjectResponseDto archiveProject(Integer projectId, boolean isArchive, Integer companyId) {
        try {
            Project project = projectRepository.findProjectWithBasicInfo(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

            if (!project.getCompanyId().equals(companyId)) {
                log.warn("权限不足：用户的公司ID{}与项目的公司ID{}不匹配, 项目ID: {}", companyId, project.getCompanyId(), projectId);
                return new DeleteProjectResponseDto("Du har ikke tilgang til dette prosjektet", false);
            }

            project.setIsArchived(SoftDeleteFlags.toFlag(isArchive));
            projectRepository.saveAndFlush(project);

            return new DeleteProjectResponseDto(
                    isArchive ? "Prosjektet er arkivert" : "Prosjektet er hentet ut av arkivet",
                    true);
        } catch (EntityNotFoundException e) {
            log.error("归档项目失败: {}", e.getMessage());
            return new DeleteProjectResponseDto(e.getMessage(), false);
        } catch (Exception e) {
            log.error("归档项目时En feil oppstod: {}", e.getMessage(), e);
            return new DeleteProjectResponseDto("Handlingen mislyktes: " + e.getMessage(), false);
        }
    }

    private void updateProjectFields(Project project, ProjectDto projectDto) {
        if (projectDto.getTitle() != null) project.setTitle(projectDto.getTitle());
        if (projectDto.getDated() != null) project.setDated(projectDto.getDated());
        if (projectDto.getCustomerId() != null) project.setCustomerId(projectDto.getCustomerId());
        if (projectDto.getContactPersonId() != null) project.setContactPersonId(projectDto.getContactPersonId());
        if (projectDto.getBuildingSupplierId() != null) project.setBuildingSupplierId(projectDto.getBuildingSupplierId());
        if (projectDto.getGardsNo() != null) project.setGardsNo(projectDto.getGardsNo());
        if (projectDto.getBruksnmmer() != null) project.setBruksnmmer(projectDto.getBruksnmmer());
        if (projectDto.getAddress() != null) project.setAddress(projectDto.getAddress());
        if (projectDto.getPostNo() != null) project.setPostNo(projectDto.getPostNo());
        if (projectDto.getPoststed() != null) project.setPoststed(projectDto.getPoststed());
        if (projectDto.getKommune() != null) project.setKommune(projectDto.getKommune());
        if (projectDto.getComments() != null) project.setComments(projectDto.getComments());
        if (projectDto.getInspectorId() != null) project.setInspectorId(projectDto.getInspectorId());
        if (projectDto.getProjectLeaderId() != null) project.setProjectLeaderId(projectDto.getProjectLeaderId());
        if (projectDto.getDescription() != null) project.setDescription(projectDto.getDescription());
        if (projectDto.getLongitude() != null) project.setLongitude(projectDto.getLongitude());
        if (projectDto.getLatitude() != null) project.setLatitude(projectDto.getLatitude());
        if (projectDto.getVismaInvoiceId() != null) project.setVismaInvoiceId(projectDto.getVismaInvoiceId());
        if (projectDto.getSkipInspection() != null) project.setSkipInspection(projectDto.getSkipInspection());
    }

    private ProjectDto mapProjectToDto(Project project) {
        if (project == null) return null;

        ProjectDto projectDto = ProjectDto.builder()
                .id(project.getId())
                .vismaId(project.getVismaId())
                .title(project.getTitle())
                .dated(project.getDated())
                .customerId(project.getCustomerId())
                .contactPersonId(project.getContactPersonId())
                .buildingSupplierId(project.getBuildingSupplierId())
                .gardsNo(project.getGardsNo())
                .bruksnmmer(project.getBruksnmmer())
                .address(project.getAddress())
                .postNo(project.getPostNo())
                .poststed(project.getPoststed())
                .kommune(project.getKommune())
                .comments(project.getComments())
                .inspectorId(project.getInspectorId())
                .projectLeaderId(project.getProjectLeaderId())
                .remContactCustomerDate(project.getRemContactCustomerDate())
                .description(project.getDescription())
                .completeDate(project.getCompleteDate())
                .isSubmitted(project.getIsSubmitted())
                .longitude(project.getLongitude())
                .latitude(project.getLatitude())
                .inspectionEventComment(project.getInspectionEventComment())
                .inspectionDate(project.getInspectionDate())
                .godkjensDate(project.getGodkjensDate())
                .projectStatus(project.getProjectStatus())
                .projectImage(project.getProjectImage())
                .inspectorComment(project.getInspectorComment())
                .inspectorSignature(project.getInspectorSignature())
                .takkBestillingenCdate(project.getTakkBestillingenCDate())
                .soknadOmAnsvarsrettCdate(project.getSoknadOmAnsvarsrettCDate())
                .ansvarligSokerCdate(project.getAnsvarligSokerCDate())
                .gratulererGodkjentCdate(project.getGratulererGodkjentCDate())
                .createChecklistCdate(project.getCreateChecklistCDate())
                .addPartiesCdate(project.getAddPartiesCDate())
                .setProLeaderContactCustomerCdate(project.getSetProLeaderContactCustomerCDate())
                .emailCustomerUpInspectionCd(project.getEmailCustomerUpInspectionCD())
                .upcomingInspectionCdate(project.getUpcomingInspectionCDate())
                .partiesDataCdate(project.getPartiesDataCDate())
                .assignInspectorCdate(project.getAssignInspectorCDate())
                .projectSubProcessCdate(project.getProjectSubProcessCDate())
                .projectSubCompleteCd(project.getProjectSubCompleteCD())
                .reviewInspReportCd(project.getReviewInspReportCD())
                .invoiceSetCd(project.getInvoiceSetCD())
                .submitInspectionRepRemindCd(project.getSubmitInspectionRepRemindCD())
                .submitInspectionRepRemindAgainCd(project.getSubmitInspectionRepRemindAgainCD())
                .kontrollerklaeringPdfCd(project.getKontrollerklaeringPdfCD())
                .finalReportPdfCdate(project.getFinalReportPdfCDate())
                .modifiedDate(project.getModifiedDate())
                .isDeleted(project.getIsDeleted())
                .isArchived(project.getIsArchived())
                .isApprovedInspReport(project.getIsApprovedInspReport())
                .takkBestillingenIsCompleted(project.getTakkBestillingenIsCompleted())
                .soknadOmAnsvarsrettIsCompleted(project.getSoknadOmAnsvarsrettIsCompleted())
                .ansvarligSokerIsCompleted(project.getAnsvarligSokerIsCompleted())
                .gratulererGodkjentIsCompleted(project.getGratulererGodkjentIsCompleted())
                .createChecklistIsCompleted(project.getCreateChecklistIsCompleted())
                .addPartiesIsCompleted(project.getAddPartiesIsCompleted())
                .setProLeaderContactCustomerIsCompleted(project.getSetProLeaderContactCustomerIsCompleted())
                .emailCustomerUpInspectionIsCompleted(project.getEmailCustomerUpInspectionIsCompleted())
                .partiesDataIsCompleted(project.getPartiesDataIsCompleted())
                .assignInspectorIsCompleted(project.getAssignInspectorIsCompleted())
                .isApprovedInspReportIsCompleted(project.getIsApprovedInspReportIsCompleted())
                .vismaInvoiceId(project.getVismaInvoiceId())
                .invoiceTripletexID(project.getInvoiceTripletexID())
                .tepmlateValue(project.getTepmlateValue())
                .avvik(project.getAvvik())
                .avvikSendtKommune("true".equalsIgnoreCase(project.getAvvikSendtKommune()))
                .skipInspection(project.getSkipInspection())
                .companyId(project.getCompanyId())
                .userId(project.getUserId())
                .build();

        projectDto.setInvoiceTripletexID(project.getInvoiceTripletexID());
        return projectDto;
    }

    private ProjectListDto mapProjectToListDto(Project project) {
        if (project == null) return null;

        return ProjectListDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .dated(project.getDated())
                .build();
    }

    private ProjectService createProjectService(Integer projectId, ProjectServiceDto serviceDto) {
        ProjectService newService = new ProjectService();
        newService.setProjectId(projectId);
        newService.setServiceId(serviceDto.getServiceId());
        newService.setQuantity(serviceDto.getQuantity());
        newService.setPrice(serviceDto.getPrice());
        newService.setIsNewAdded(false);
        return newService;
    }

    private void updateProjectService(ProjectService existingService, ProjectServiceDto serviceDto) {
        existingService.setServiceId(serviceDto.getServiceId());
        existingService.setQuantity(serviceDto.getQuantity());
        existingService.setPrice(serviceDto.getPrice());
        existingService.setIsNewAdded(false);
    }

    /**
     * 清除项目检查清单相关的缓存
     *
     * @param projectId 项目ID
     */
    private void clearProjectChecklistCache(Integer projectId) {
        if (cacheManager != null) {
            // 清除项目检查清单缓存
            if (cacheManager.getCache("projectChecklists") != null) {
                cacheManager.getCache("projectChecklists").evict("project_" + projectId);
                log.debug("已清理缓存 project_{}", projectId);
            }
        }
    }

    @Transactional
    private void createProjectChecklistsForNewServices(Integer projectId, List<ProjectServiceDto> newServices) {
        log.debug("为项目ID {} 的新服务创建检查清单", projectId);

        for (ProjectServiceDto serviceDto : newServices) {
            Integer serviceId = serviceDto.getServiceId();
            if (serviceId == null) {
                continue;
            }

            // 获取服务详情，包括检查清单模板ID
            Service service = serviceRepository.findById(serviceId).orElse(null);
            if (service == null) {
                log.warn("服务ID {} 不存在，无法创建检查清单", serviceId);
                continue;
            }

            // 计算需要创建的检查清单数量，至少为1
            int quantity = serviceDto.getQuantity() != null && serviceDto.getQuantity() > 0
                    ? serviceDto.getQuantity() : 1;

            // 获取检查清单模板（如果存在）
            Integer checklistTemplateId = service.getChecklistTempId();
            String checklistName;

            if (checklistTemplateId != null) {
                ChecklistTemplate template = service.getChecklistTemplate();
                checklistName = template != null && template.getTitle() != null
                        ? template.getTitle()
                        : "Checklist for " + service.getName();
            } else {
                checklistName = "Checklist for " + service.getName();
            }

            log.debug("为服务 {} 创建 {} 个检查清单", service.getName(), quantity);

            // 为每个数量创建一个检查清单
            for (int i = 0; i < quantity; i++) {
                try {
                    // 创建检查清单
                    ProjectChecklist checklist = new ProjectChecklist();
                    checklist.setProjectId(projectId);
                    checklist.setChecklistName(checklistName);
                    checklist.setSortOrder(i + 1); // 设置排序顺序

                    ProjectChecklist savedChecklist = projectChecklistRepository.save(checklist);
                    log.debug("成功创建检查清单，ID: {}", savedChecklist.getId());

                    // 如果有检查清单模板，复制模板项到新检查清单
                    if (checklistTemplateId != null) {
                        // 获取模板中的所有检查项
                        List<ChecklistItemTemplate> templateItems = service.getChecklistTemplate() != null
                                ? service.getChecklistTemplate().getChecklistItemTemplates()
                                : null;

                        if (templateItems != null && !templateItems.isEmpty()) {
                            List<ChecklistItem> itemsToSave = new ArrayList<>();

                            for (ChecklistItemTemplate templateItem : templateItems) {
                                ChecklistItem item = new ChecklistItem();
                                item.setChecklistId(savedChecklist.getId());
                                item.setTitle(templateItem.getTitle());
                                item.setSortOrder(templateItem.getSortOrder());

                                itemsToSave.add(item);
                            }

                            if (!itemsToSave.isEmpty()) {
                                checklistItemRepository.saveAll(itemsToSave);
                                log.debug("成功为检查清单 {} 创建 {} 个检查项", savedChecklist.getId(), itemsToSave.size());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("为服务 {} 创建检查清单时En feil oppstod: {}", service.getName(), e.getMessage(), e);
                }
            }

            // 更新服务状态为非新增
            if (serviceDto.getId() != null) {
                ProjectService projectService = projectServiceRepository.findById(serviceDto.getId()).orElse(null);
                if (projectService != null) {
                    projectService.setIsNewAdded(false);
                    projectServiceRepository.save(projectService);
                    log.debug("已将服务 {} 标记为非新增", serviceDto.getId());
                }
            }
        }

        // 清除项目检查清单缓存，确保前端能够立即看到新创建的检查清单
        clearProjectChecklistCache(projectId);
    }

    private ContactDto mapContactToDto(ContactBook contact) {
        return ContactDto.builder()
                .id(contact.getId())
                .name(contact.getName())
                .contactNo(contact.getContactNo())
                .email(contact.getEmail())
                .companyName(contact.getCompanyName())
                .build();
    }

    private BuildingSupplierDto mapBuildingSupplierToDto(BuildingSupplier supplier) {
        BuildingSupplierDto dto = new BuildingSupplierDto();
        dto.setId(supplier.getId());
        dto.setTitle(supplier.getTitle());
        return dto;
    }

    private ProjectServiceDto mapProjectServiceToDto(ProjectService ps, Service service) {
        return ProjectServiceDto.builder()
                .id(ps.getId())
                .projectId(ps.getProjectId())
                .serviceId(ps.getServiceId())
                .quantity(ps.getQuantity())
                .price(ps.getPrice())
                .isNewAdded(ps.getIsNewAdded())
                .service(ServiceDto.builder()
                        .id(service.getId())
                        .name(service.getName())
                        .description(service.getDescription())
                        .serviceTypeId(service.getServiceTypeId())
                        .serviceChargedAs(service.getServiceChargedAs())
                        .rate(service.getRate())
                        .build())
                .build();
    }

    private List<ServiceWorkflowCategoryDto> mapWorkflowCategoriesToDto(List<ServiceWorkflowCategory> categories) {
        return categories.stream()
                .map(wc -> {
                    ServiceWorkflowCategoryDto dto = new ServiceWorkflowCategoryDto();
                    dto.setId(wc.getId());
                    dto.setWorkflowCategoryId(wc.getWorkflowCategoryId());
                    dto.setServiceId(wc.getServiceId());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private Integer getProjectsMaxId() {
        Integer maxId = projectRepository.findMaxId();
        return maxId != null ? maxId : 0;
    }

    private List<ProjectServiceDto> insertProjectServices(List<ProjectServiceDto> servicesList, Integer projectId) {
        if (servicesList == null || servicesList.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProjectServiceDto> resultList = new ArrayList<>();

        for (ProjectServiceDto serviceDto : servicesList) {
            // 兼容未带 isNewAdded 的客户端:无 id 即视为新行
            if (Boolean.TRUE.equals(serviceDto.getIsNewAdded()) || serviceDto.getId() == null) {
                ProjectService service = new ProjectService();
                service.setProjectId(projectId);
                service.setServiceId(serviceDto.getServiceId());
                service.setQuantity(serviceDto.getQuantity());
                service.setPrice(serviceDto.getPrice());
                service.setIsNewAdded(false);

                ProjectService savedService = projectServiceRepository.save(service);

                serviceDto.setId(savedService.getId());
                serviceDto.setIsNewAdded(false);
                serviceDto.setProjectId(projectId);

                serviceRepository.findById(serviceDto.getServiceId()).ifPresent(s -> {
                    ServiceDto sDto = new ServiceDto();
                    sDto.setId(s.getId());
                    sDto.setName(s.getName());
                    sDto.setDescription(s.getDescription());
                    sDto.setServiceTypeId(s.getServiceTypeId());
                    sDto.setServiceChargedAs(s.getServiceChargedAs());
                    sDto.setRate(s.getRate());
                    serviceDto.setService(sDto);
                });

                resultList.add(serviceDto);
            }
        }

        return resultList;
    }

    private List<ServiceWorkflowCategory> getServiceWorkflowCategoryByServiceId(List<ProjectServiceDto> servicesList) {
        if (servicesList == null || servicesList.isEmpty()) {
            return new ArrayList<>();
        }

        List<Integer> serviceIds = servicesList.stream()
                .map(ProjectServiceDto::getServiceId)
                .filter(id -> id != null)
                .collect(Collectors.toList());

        if (serviceIds.isEmpty()) {
            return new ArrayList<>();
        }

        return serviceWorkflowCategoryRepository.findByServiceIdIn(serviceIds);
    }

    private void addProjectParties(Integer projectId, List<ServiceWorkflowCategory> workflowCategories, Integer companyId) {
        if (workflowCategories == null || workflowCategories.isEmpty()) {
            return;
        }

        try {
            List<Integer> workflowCategoryIds = workflowCategories.stream()
                    .map(ServiceWorkflowCategory::getWorkflowCategoryId)
                    .filter(id -> id != null)
                    .collect(Collectors.toList());

            if (workflowCategoryIds.isEmpty()) {
                return;
            }

            List<PartyType> defaultPartyTypes = partyTypeRepository.findDefaultByCompanyIdAndWorkflowCategoryIdIn(
                    companyId, workflowCategoryIds);

            if (defaultPartyTypes.isEmpty()) {
                return;
            }

            ContactBook dummyContact = contactRepository.findByName("Dummy Contact").orElse(null);

            if (dummyContact == null) {
                log.warn("无法创建默认参与方，虚拟联系人'Dummy Contact'不存在, 项目ID: {}", projectId);
                return;
            }

            List<ProjectParty> partiesToSave = new ArrayList<>();
            for (PartyType partyType : defaultPartyTypes) {
                ProjectParty projectParty = new ProjectParty();
                projectParty.setProjectId(projectId);
                projectParty.setPartyId(dummyContact.getId());
                projectParty.setPartyTypeId(partyType.getId());

                partiesToSave.add(projectParty);
            }

            if (!partiesToSave.isEmpty()) {
                projectPartyRepository.saveAll(partiesToSave);
            }
        } catch (Exception e) {
            log.error("添加项目参与方时En feil oppstod, 项目ID: {}", projectId, e);
        }
    }

    @Override
    @Cacheable(value = "projectLeaderCache", key = "#projectId + '_' + #companyId", unless = "#result == null")
    public WrapperProjectLeaderDto getProjectLeaderWithProjectID(Integer projectId, Integer companyId) {
        log.debug("获取项目负责人信息，项目ID: {}, 公司ID: {}", projectId, companyId);

        Integer projectLeaderId = projectRepository.findProjectLeaderIdByIdAndCompanyId(projectId, companyId)
                .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

        ProjectProjectLeaderDto leaderDto = new ProjectProjectLeaderDto();
        leaderDto.setProjectId(projectId);
        leaderDto.setProjectLeaderID(projectLeaderId);

        WrapperProjectLeaderDto response = new WrapperProjectLeaderDto();
        response.setProjectLeader(leaderDto);

        log.debug("成功获取项目负责人信息，项目ID: {}, 负责人ID: {}", projectId, projectLeaderId);
        return response;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"projectLeaderCache", "projectCache"}, key = "#param.projectLeader.projectId + '_' + #companyId")
    public WrapperProjectLeaderDto associateProjectLeaderWithProject(WrapperProjectLeaderDto param, Integer companyId) {
        log.debug("关联项目负责人与项目，项目ID: {}, 公司ID: {}", param.getProjectLeader().getProjectId(), companyId);

        Integer projectId = param.getProjectLeader().getProjectId();
        Integer projectLeaderId = param.getProjectLeader().getProjectLeaderID();

        if (!projectRepository.existsByIdAndCompanyId(projectId, companyId)) {
            log.warn("权限不足：用户的公司ID{}与项目不匹配, 项目ID: {}", companyId, projectId);
            throw new AccessDeniedException("Du har ikke tilgang til å oppdatere dette prosjektet");
        }

        projectRepository.updateProjectLeaderId(projectId, projectLeaderId, LocalDateTime.now());

        ProjectProjectLeaderDto leaderDto = new ProjectProjectLeaderDto();
        leaderDto.setProjectId(projectId);
        leaderDto.setProjectLeaderID(projectLeaderId);

        WrapperProjectLeaderDto response = new WrapperProjectLeaderDto();
        response.setProjectLeader(leaderDto);

        log.debug("成功关联项目负责人与项目，项目ID: {}, 负责人ID: {}", projectId, projectLeaderId);
        return response;
    }

    @Override
    public WrapperProjectContactCustomerDto getProjectContactCustomerReminderDate(Integer projectId, Integer companyId) {
        log.debug("获取项目联系客户提醒日期，项目ID: {}, 公司ID: {}", projectId, companyId);

        Project project = projectRepository.findProjectWithBasicInfo(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

        if (!project.getCompanyId().equals(companyId)) {
            log.warn("权限不足：用户的公司ID{}与项目的公司ID{}不匹配, 项目ID: {}", companyId, project.getCompanyId(), projectId);
            throw new AccessDeniedException("Du har ikke tilgang til dette prosjektet");
        }

        ProjectContactCustomerDto contactCustomerDto = new ProjectContactCustomerDto();
        contactCustomerDto.setProjectId(projectId);
        contactCustomerDto.setContactCustomerDate(project.getRemContactCustomerDate() != null
                ? java.util.Date.from(project.getRemContactCustomerDate().atZone(java.time.ZoneId.systemDefault()).toInstant())
                : null);

        WrapperProjectContactCustomerDto response = new WrapperProjectContactCustomerDto();
        response.setContactCustomer(contactCustomerDto);

        log.debug("成功获取项目联系客户提醒日期，项目ID: {}", projectId);
        return response;
    }

    @Override
    public WrapperProjectWFTenSavedDetailsDto getProjectWFTenSavedDetails(
            Integer workflowId, Integer workflowStepId, Integer projectId, Integer companyId) {
        log.debug("获取项目工作流10步骤保存的详细信息，工作流ID: {}, 工作流步骤ID: {}, 项目ID: {}, 公司ID: {}",
                workflowId, workflowStepId, projectId, companyId);

        Project project = projectRepository.findProjectWithBasicInfo(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Prosjektet ble ikke funnet, ID: " + projectId));

        if (!project.getCompanyId().equals(companyId)) {
            log.warn("权限不足：用户的公司ID{}与项目的公司ID{}不匹配, 项目ID: {}", companyId, project.getCompanyId(), projectId);
            throw new AccessDeniedException("Du har ikke tilgang til dette prosjektet");
        }

        ProjectProjectWFTenSavedDetailsDto detailsDto = new ProjectProjectWFTenSavedDetailsDto();
        detailsDto.setProjectId(projectId);
        detailsDto.setInspectorId(project.getInspectorId());
        detailsDto.setInspectionDate(project.getInspectionDate() != null
                ? java.util.Date.from(project.getInspectionDate().atZone(java.time.ZoneId.systemDefault()).toInstant())
                : null);
        detailsDto.setInspectionEventComment(project.getInspectionEventComment());
        detailsDto.setSkipInspection(project.getSkipInspection());

        if (project.getInspectorId() != null) {
            try {
                contactRepository.findById(project.getInspectorId())
                        .ifPresent(contact -> {
                            String inspectorName = contact.getName() != null && !contact.getName().isEmpty()
                                    ? contact.getName()
                                    : contact.getContactName();
                            detailsDto.setInspectorName(inspectorName);
                        });
            } catch (Exception e) {
                log.warn("获取检查员信息失败，检查员ID: {}", project.getInspectorId(), e);
            }
        }

        WrapperProjectWFTenSavedDetailsDto response = new WrapperProjectWFTenSavedDetailsDto();
        response.setProjectWFTenSavedDetails(detailsDto);

        log.debug("成功获取项目工作流10步骤保存的详细信息，项目ID: {}", projectId);
        return response;
    }

    @Override
    public void updateProjectKontrollerklaeringPdfDate(Integer projectId, Integer companyId) {
        ProjectDto projectDto = getProjectById(projectId, companyId);
        if (projectDto != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));
            project.setKontrollerklaeringPdfCD(LocalDateTime.now());
            projectRepository.save(project);
        }
    }

    @Override
    public void updateProjectFinalReportPdfDate(Integer projectId, Integer companyId) {
        ProjectDto projectDto = getProjectById(projectId, companyId);
        if (projectDto != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));
            project.setFinalReportPdfCDate(LocalDateTime.now());
            projectRepository.save(project);
        }
    }

    @Override
    public void updateProjectInvoiceSetDate(Integer projectId) {
        if (projectId == null) {
            return;
        }

        ProjectDto project = getProjectById(projectId, null);
        if (project != null) {
            project.setInvoiceSetCd(LocalDateTime.now());
            updateProject(project, null);
        }
    }

    @Override
    @Cacheable(value = "inspectorsNewFormatCache", key = "#companyId", unless = "#result == null || #result.multiUserInspectors.isEmpty()")
    public WrapperMultiUserInspectorDto getInspectorsInNewFormat(Integer companyId) {
        log.info("Fetching inspector users in new format for company ID: {}", companyId);

        // 查询所有该公司的用户类型为2或3的用户
        List<User> inspectorUsers = userRepository.findByCompanyIDAndUserTypeIDIn(companyId, List.of(2, 3));

        // 使用流式API转换，减少循环和对象创建
        List<UserInspectorDto> inspectors = inspectorUsers.stream()
                .map(user -> {
                    UserInspectorDto inspector = new UserInspectorDto();
                    inspector.setId(user.getId());
                    inspector.setDesignation(user.getDesignation());
                    inspector.setUserTypeId(user.getUserTypeID());
                    inspector.setIsActive(user.getIsActive());
                    inspector.setContactId(user.getContactId());
                    inspector.setCompanyId(user.getCompanyID());
                    inspector.setFullName(user.getFullName() != null && !user.getFullName().isEmpty()
                            ? user.getFullName() : user.getUsername());

                    return inspector;
                })
                .collect(Collectors.toList());

        log.info("Found {} inspector users for company ID: {}", inspectors.size(), companyId);

        // 使用新DTO封装结果
        WrapperMultiUserInspectorDto wrapperDto = new WrapperMultiUserInspectorDto();
        wrapperDto.setMultiUserInspectors(inspectors);

        return wrapperDto;
    }
}
