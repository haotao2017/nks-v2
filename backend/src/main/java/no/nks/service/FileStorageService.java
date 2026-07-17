package no.nks.service;

import no.nks.entity.Doc;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

/**
 * Service for handling file storage operations
 */
public interface FileStorageService {

    /**
     * Upload a file to the storage system
     *
     * @param file the file to upload
     * @param fileName the name to save the file as
     * @param folderPath the folder path within the storage system
     * @return true if upload successful, false otherwise
     */
    boolean uploadFile(MultipartFile file, String fileName, String folderPath);

    /**
     * Get a public URL for accessing a file
     *
     * @param fileName the name of the file
     * @param folderPath the folder path within the storage system
     * @return the public URL as a string
     */
    String getPublicUrl(String fileName, String folderPath);

    /**
     * Get a document by project ID and document type
     *
     * @param projectId the project ID
     * @param docTypeId the document type ID
     * @return optional document if found
     */
    Optional<Doc> getDocument(Integer projectId, Integer docTypeId);
}
