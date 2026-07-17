package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "S3Bucket", schema = "dbo")
public class S3Bucket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "S3bucketName")
    private String s3bucketName;

    @Column(name = "S3urlStaticPart")
    private String s3urlStaticPart;

    @Column(name = "IsActive")
    private Boolean isActive;
} 