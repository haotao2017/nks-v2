package no.nks.repository;

import no.nks.entity.InspectionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionLogRepository extends JpaRepository<InspectionLog, Integer> {
    List<InspectionLog> findByProjectId(Integer projectId);
} 