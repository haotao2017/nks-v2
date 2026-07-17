package no.nks.repository;

import no.nks.entity.DocFolders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocFoldersRepository extends JpaRepository<DocFolders, Integer> {
    
    List<DocFolders> findAll();
    
    // 修改返回类型为List，以处理可能存在的多条记录情况
    List<DocFolders> findByCompanyId(int companyId);
} 