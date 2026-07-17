package no.nks.service.impl;

import lombok.extern.slf4j.Slf4j;
import no.nks.entity.*;
import no.nks.repository.BuildingSupplierRepository;
import no.nks.service.BuildingSupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class BuildingSupplierServiceImpl implements BuildingSupplierService {

    private final BuildingSupplierRepository buildingSupplierRepository;

    @Autowired
    public BuildingSupplierServiceImpl(BuildingSupplierRepository buildingSupplierRepository) {
        this.buildingSupplierRepository = buildingSupplierRepository;
    }

    @Override
    public WrapperBuildingSupplier getSingleBuildingSupplier(Integer id) {
        WrapperBuildingSupplier data = new WrapperBuildingSupplier();
        Optional<BuildingSupplier> buildingSupplierOpt = buildingSupplierRepository.findById(id);
        if (buildingSupplierOpt.isPresent()) {
            data.setBuildingSupplier(buildingSupplierOpt.get());
        }
        return data;
    }

    @Override
    public WrapperMultiBuildingSuppliers getAllBuildingSupplier(CompanyWrapper dataCompany) {
        WrapperMultiBuildingSuppliers data = new WrapperMultiBuildingSuppliers();
        List<BuildingSupplier> suppliers = buildingSupplierRepository.findByCompanyId(dataCompany.getCompanyID());
        data.setMultiBuildingSuppliers(suppliers);
        return data;
    }

    @Override
    public WrapperBuildingSupplier updateSingleBuildingSupplier(BuildingSupplier buildingSupplier, CompanyWrapper dataCompany) {
        WrapperBuildingSupplier data = new WrapperBuildingSupplier();
        buildingSupplier.setCompanyId(dataCompany.getCompanyID());
        BuildingSupplier updatedSupplier = buildingSupplierRepository.save(buildingSupplier);
        data.setBuildingSupplier(updatedSupplier);
        return data;
    }

    @Override
    public WrapperBuildingSupplier createSingleBuildingSupplier(BuildingSupplier buildingSupplier, CompanyWrapper dataCompany) {
        WrapperBuildingSupplier data = new WrapperBuildingSupplier();
        buildingSupplier.setCompanyId(dataCompany.getCompanyID());
        BuildingSupplier createdSupplier = buildingSupplierRepository.save(buildingSupplier);
        data.setBuildingSupplier(createdSupplier);
        return data;
    }

    @Override
    public ResponseBuildingSupplier deleteSingleBuildingSupplier(Integer id) {
        ResponseBuildingSupplier responseBuildingSupplier = new ResponseBuildingSupplier();
        RequestResponse requestResponse = new RequestResponse();
        // 显式设置dataCompany为null，避免在响应中返回
        requestResponse.setDataCompany(null);

        try {
            // 检查是否关联了项目
            List<ProjectAssociatedWithBuildingSup> associatedProjects =
                buildingSupplierRepository.findProjectsAssociatedWithBuildingSupplier(id);

            responseBuildingSupplier.setProjectAssociatedWithBuildingSupplier(associatedProjects);

            if (associatedProjects != null && !associatedProjects.isEmpty()) {
                requestResponse.setMessage("Can not delete. Building supplier is asociated with project");
                requestResponse.setSuccess(false);
                responseBuildingSupplier.setRequestResponse(requestResponse);
                return responseBuildingSupplier;
            }

            // 删除供应商
            buildingSupplierRepository.deleteById(id);

            requestResponse.setMessage("Record deleted");
            requestResponse.setSuccess(true);
        } catch (Exception ex) {
            log.error("Error deleting building supplier: {}", ex.getMessage(), ex);
            requestResponse.setMessage(ex.getMessage());
            requestResponse.setSuccess(false);
        }

        responseBuildingSupplier.setRequestResponse(requestResponse);
        return responseBuildingSupplier;
    }
}
