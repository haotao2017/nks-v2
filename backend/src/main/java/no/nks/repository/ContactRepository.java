package no.nks.repository;

import no.nks.entity.ContactBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<ContactBook, Integer> {
    // Spring Data JPA will provide implementation for basic CRUD operations
    // Add custom query methods here if needed later
    List<ContactBook> findByCompanyId(Integer companyId);
    
    /**
     * 根据名称查询联系人
     * @param name 联系人名称
     * @return 包含联系人的Optional对象，如果找不到则为empty
     */
    Optional<ContactBook> findByName(String name);
} 