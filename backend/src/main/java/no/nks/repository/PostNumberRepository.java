package no.nks.repository;

import no.nks.entity.PostNumber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PostNumberRepository extends JpaRepository<PostNumber, Integer> {
    
    /**
     * 根据邮政编码查找 PostNumber 实体
     * @param postnummer 邮政编码
     * @return 包含 PostNumber 的 Optional
     */
    Optional<PostNumber> findByPostnummer(Integer postnummer);
} 