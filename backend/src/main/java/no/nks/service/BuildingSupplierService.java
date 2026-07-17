package no.nks.service;

import no.nks.entity.*;

public interface BuildingSupplierService {
    WrapperBuildingSupplier getSingleBuildingSupplier(Integer id);
    WrapperMultiBuildingSuppliers getAllBuildingSupplier(CompanyWrapper dataCompany);
    WrapperBuildingSupplier updateSingleBuildingSupplier(BuildingSupplier buildingSupplier, CompanyWrapper dataCompany);
    WrapperBuildingSupplier createSingleBuildingSupplier(BuildingSupplier buildingSupplier, CompanyWrapper dataCompany);
    ResponseBuildingSupplier deleteSingleBuildingSupplier(Integer id);
}
