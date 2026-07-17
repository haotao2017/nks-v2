package no.nks.repository;

import no.nks.entity.ContactBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // Not strictly needed for findById/findAllById but good practice if other list methods are added.

@Repository
public interface ContactBookRepository extends JpaRepository<ContactBook, Integer> {
    // findById(Integer id) is inherited
    // findAllById(Iterable<Integer> ids) is inherited
} 