package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "DocFolders", schema = "dbo")
public class DocFolders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "CompanyId")
    private Integer companyId;

    @Column(name = "FolderName")
    private String folderName;

    @Column(name = "FolderPath")
    private String folderPath;

    @Column(name = "CreateDate")
    private LocalDateTime createDate;

    @Column(name = "IsActive")
    private Boolean isActive;
} 