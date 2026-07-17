package no.nks.repository;

import no.nks.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Integer> {
    // 按公司ID查询所有邮件模板
    List<EmailTemplate> findByCompanyId(Integer companyId);
    
    // 按ID和公司ID查询单个邮件模板
    Optional<EmailTemplate> findByIdAndCompanyId(Integer id, Integer companyId);
} 