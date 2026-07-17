package no.nks.repository;

import no.nks.entity.GeneralSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneralSettingRepository extends JpaRepository<GeneralSetting, Integer> {
    
    List<GeneralSetting> findAll();
    
    // Spring Data JPA 中 findById 已经定义，返回 Optional<GeneralSetting>
    Optional<GeneralSetting> findFirstBy();
} 