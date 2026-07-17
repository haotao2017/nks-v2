package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperS3Bucket {
    
    @JsonProperty("S3bucket")
    private S3Bucket s3bucket;
} 