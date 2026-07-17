package no.nks.repository;

import no.nks.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // JPA query method to get top 5 users, ordered by ID ascending
    List<User> findTop5ByOrderByIdAsc();

    // Find user by username
    Optional<User> findByUserName(String userName);

    // Find users by company ID and active status
    List<User> findByCompanyIDAndIsActive(Integer companyID, Boolean isActive);

    // Find users by company ID and user type IDs
    List<User> findByCompanyIDAndUserTypeIDIn(Integer companyID, List<Integer> userTypeIDs);

    // findById(Integer) 已由 JpaRepository 提供
}
