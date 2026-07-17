package no.nks.repository;

import no.nks.entity.S3Bucket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface S3bucketRepository extends JpaRepository<S3Bucket, Integer> {
    
    S3Bucket findByIsActiveTrue();
} 