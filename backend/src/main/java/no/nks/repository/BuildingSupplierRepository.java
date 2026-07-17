package no.nks.repository;

import no.nks.entity.BuildingSupplier;
import no.nks.entity.ProjectAssociatedWithBuildingSup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingSupplierRepository extends JpaRepository<BuildingSupplier, Integer> {
    
    List<BuildingSupplier> findByCompanyId(Integer companyId);
    
    @Query("SELECT new no.nks.entity.ProjectAssociatedWithBuildingSup(p.id, p.title) FROM Project p WHERE p.buildingSupplierId = :buildingSupplierId")
    List<ProjectAssociatedWithBuildingSup> findProjectsAssociatedWithBuildingSupplier(@Param("buildingSupplierId") Integer buildingSupplierId);
} 