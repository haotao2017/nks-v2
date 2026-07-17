package no.nks.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.Map;

public interface S3Service {
    /**
     * Upload file to S3 or other storage
     *
     * @param file file to upload
     * @param path path/folder in the storage where file should be saved
     * @return URL of the uploaded file
     */
    String uploadFile(MultipartFile file, String path);

    /**
     * Upload file to S3 storage with specified bucket folder
     *
     * @param bucketFolder folder in S3 bucket
     * @param file file to upload
     * @param fileName name of the file in S3
     * @return URL of the uploaded file
     */
    String uploadFile(String bucketFolder, MultipartFile file, String fileName);

    /**
     * Upload file from input stream to S3
     *
     * @param bucketFolder folder in S3 bucket
     * @param stream input stream with file data
     * @param fileName name of the file in S3
     * @return URL of the uploaded file
     */
    String uploadFileFromStream(String bucketFolder, InputStream stream, String fileName);

    /**
     * Create a public URL for a file in S3
     *
     * @param bucketName S3 bucket name
     * @param region region of the S3 bucket
     * @param folder folder in S3 bucket
     * @param fileName name of the file
     * @return public URL for the file
     */
    String createPublicUrl(String bucketName, String region, String folder, String fileName);

    /**
     * Get file from S3 as input stream
     *
     * @param bucketFolder folder in S3 bucket
     * @param fileName name of the file
     * @return InputStream with file content
     */
    InputStream getFileFromS3(String bucketFolder, String fileName);

    /**
     * Create a folder in S3
     *
     * @param folderPath path of the folder to create
     * @return true if creation was successful
     */
    boolean createFolder(String folderPath);

    /**
     * Check if a folder exists in S3
     *
     * @param folderPath path of the folder to check
     * @return true if folder exists, false otherwise
     */
    boolean folderExists(String folderPath);

    /**
     * Get the bucket name by company ID
     *
     * @param companyId company ID
     * @return bucket name
     */
    String getBucketNameByCompanyId(Integer companyId);

    /**
     * Get company bucket name (alternative method)
     *
     * @param companyId company ID
     * @return bucket name
     */
    String getCompanyBucketName(Integer companyId);

    /**
     * Get company S3 folder path
     *
     * @param companyId company ID
     * @return folder path
     */
    String getCompanyS3Folder(Integer companyId);

    /**
     * Get all S3 paths for a company
     *
     * @param companyId company ID
     * @return map of path keys and values
     */
    Map<String, String> getAllS3Paths(Integer companyId);

    /**
     * Initialize company folders in S3
     *
     * @param companyId company ID
     * @param resourceFile resource file containing folder structure
     * @return true if initialization was successful
     */
    boolean initializeCompanyFolders(Integer companyId, String resourceFile);

    /**
     * Get company S3 URL static part
     *
     * @param companyId company ID
     * @return S3 URL static part
     */
    String getCompanyS3UrlStaticPart(Integer companyId);

    /**
     * Delete a file from S3 bucket
     *
     * @param bucketFolder folder in S3 bucket
     * @param fileName name of the file to delete
     * @return true if deletion was successful
     */
    boolean deleteFile(String bucketFolder, String fileName);

    /**
     * Delete file from S3 using file URL
     *
     * @param fileUrl URL of the file to delete
     * @return true if file was deleted successfully
     */
    boolean deleteFile(String fileUrl);

    /**
     * Generate pre-signed URL for file download
     *
     * @param fileUrl URL of the file
     * @param expirationTimeInMinutes expiration time in minutes
     * @return pre-signed URL for file download
     */
    String generatePresignedUrl(String fileUrl, int expirationTimeInMinutes);

    /**
     * Get file content from S3 as a String
     *
     * @param bucketFolder folder in S3 bucket
     * @param fileName name of the file
     * @return String with file content
     */
    String getFileContentAsString(String bucketFolder, String fileName);

    /**
     * Upload file from InputStream to S3 with content type
     *
     * @param bucketFolder folder in S3 bucket
     * @param stream input stream with file data
     * @param fileName name of the file in S3
     * @param contentType MIME type of the file
     */
    void uploadFile(String bucketFolder, InputStream stream, String fileName, String contentType);

    String getFileAsBase64(String bucketFolder, String fileName);
}
