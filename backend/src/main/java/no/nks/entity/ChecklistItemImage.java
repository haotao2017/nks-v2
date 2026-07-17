package no.nks.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 检查清单项图片实体类
 */
@Entity
@Table(name = "ChecklistItemImage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemImage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;
    
    @Column(name = "ChecklistItemID")
    private Integer checklistItemId;
    
    @Column(name = "ImageName", columnDefinition = "nvarchar(255)")
    private String imageName;
    
    @Column(name = "CaptureDate")
    private LocalDateTime captureDate;
    
    @Column(name = "ImageSize")
    private String imageSize;
    
    @Column(name = "ImageType", length = 50)
    private String imageType;
    
    @Column(name = "PartyId")
    private Integer partyId;
    
    @Column(name = "isOkForFinalPDF")
    private Boolean isOkForFinalPdf;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ChecklistItemID", referencedColumnName = "ID", insertable = false, updatable = false)
    private ChecklistItem checklistItem;
} 