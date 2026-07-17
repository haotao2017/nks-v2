package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.service.IS3Service;
import no.nks.service.S3Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;

/**
 * S3 服务实现（AWS SDK v2）。
 *
 * <p>由 org.example.nbk 的 AWS SDK v1 实现迁移而来，方法签名与行为逐一保持一致：
 * 目录结构、公开 URL 格式、异常吞并语义均未改变。区别仅在于：底层由
 * {@code com.amazonaws.AmazonS3} 切换为 {@code software.amazon.awssdk} 的
 * {@link S3Client}/{@link S3Presigner}，并对所有上传统一启用 SSE-S3(AES256)。</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3ServiceImpl implements S3Service, IS3Service {

    // 旧实现中来自 StaticDetails 的 S3 目录常量，此处内联以保持自包含、与旧行为一致。
    private static final String S3_BUCKET_FOLDER_FOR_PDF = "Files/";
    private static final String S3_BUCKET_FOLDER_FOR_INSPECTION_CHECKLIST_IMAGES = "ChecklistTypeImages/";
    private static final String S3_BUCKET_FOLDER_FOR_INSPECTION_THIRD_PARTY_PDF = "DevChecklistPdfs/";
    private static final String S3_BUCKET_FOLDER_FOR_CALANDER_ICS = "ICS/";
    private static final String S3_BUCKET_FOLDER_FOR_PDF_HTML_FILES = "PdfHtml/";
    private static final String S3_BUCKET_FOLDER_FOR_PROJECT_SITE_IMAGES = "ProjectSiteImages/";

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket.name:nksystem-storage}")
    private String bucketName;

    @Value("${aws.s3.url.static-part:.s3.amazonaws.com/}")
    private String urlStaticPart;

    @Override
    public CompletableFuture<String> uploadFileAsync(String bucketFolder, MultipartFile file, String fileName) {
        log.debug("异步上传文件到S3，桶文件夹: {}, 文件名: {}", bucketFolder, fileName);

        return CompletableFuture.supplyAsync(() -> {
            try {
                InputStream inputStream = file.getInputStream();
                String result = putObject(bucketFolder, inputStream, fileName, file.getContentType(), file.getSize());
                log.debug("文件上传成功: {}", result);
                return result;
            } catch (Exception e) {
                log.error("文件上传失败: {}", e.getMessage(), e);
                throw new RuntimeException(e);
            }
        }, Executors.newCachedThreadPool());
    }

    @Override
    public String createPublicURL(String bucketName, String urlStaticPart, String bucketFolder, String fileName) {
        log.debug("创建公共URL，桶名称: {}, URL静态部分: {}, 桶文件夹: {}, 文件名: {}",
                bucketName, urlStaticPart, bucketFolder, fileName);

        return createPublicUrl(bucketName, urlStaticPart, bucketFolder, fileName);
    }

    @Override
    public String uploadFile(String bucketFolder, MultipartFile file, String fileName) {
        try {
            return putObject(bucketFolder, file.getInputStream(), fileName, file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public String uploadFileFromStream(String bucketFolder, InputStream stream, String fileName) {
        // 无法获取流的大小，contentLength 传 null（读入内存后上传），与旧的空 metadata 行为等价
        return putObject(bucketFolder, stream, fileName, null, null);
    }

    /**
     * 使用 AWS SDK v2 将文件上传到 S3。
     *
     * <p>统一启用 SSE-S3(AES256)。当 {@code contentLength} 已知时使用
     * {@link RequestBody#fromInputStream(InputStream, long)} 流式上传；未知时先读入内存，
     * 以复刻旧版对未知长度流的兼容行为。</p>
     *
     * @param bucketFolder  S3 存储桶中的文件夹路径
     * @param stream        文件输入流
     * @param fileName      文件名
     * @param contentType   MIME 类型，可为 null
     * @param contentLength 内容长度，可为 null（未知）
     * @return 上传结果，成功返回 "Success"
     */
    private String putObject(String bucketFolder, InputStream stream, String fileName,
                             String contentType, Long contentLength) {
        try {
            // 确保文件夹路径正确格式化（去除多余斜杠）
            String normalizedBucketFolder = normalizePath(bucketFolder);
            String normalizedFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            String key = normalizedBucketFolder + normalizedFileName; // 文件路径组合为 key

            PutObjectRequest.Builder requestBuilder = PutObjectRequest.builder()
                    .bucket(bucketName) // 使用固定桶名
                    .key(key)
                    .serverSideEncryption(ServerSideEncryption.AES256);
            if (contentType != null) {
                requestBuilder.contentType(contentType);
            }

            RequestBody body;
            if (contentLength != null) {
                body = RequestBody.fromInputStream(stream, contentLength);
            } else {
                body = RequestBody.fromBytes(stream.readAllBytes());
            }

            s3Client.putObject(requestBuilder.build(), body);
            return "Success";
        } catch (SdkException | IOException e) {
            throw new RuntimeException("Error uploading file to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public String createPublicUrl(String bucketName, String urlStaticPart, String bucketFolder, String fileName) {
        // 规范化路径，避免重复的"/"
        String normalizedBucketFolder = normalizePath(bucketFolder);
        String normalizedFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;

        // 使用固定的桶名，忽略传入的参数
        return "https://" + this.bucketName + this.urlStaticPart + normalizedBucketFolder + normalizedFileName;
    }

    @Override
    public InputStream getFileFromS3(String bucketFolder, String fileName) {
        try {
            // 规范化路径
            String normalizedBucketFolder = normalizePath(bucketFolder);
            String normalizedFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            String key = normalizedBucketFolder + normalizedFileName;

            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            // ResponseInputStream<GetObjectResponse> 本身即 InputStream
            return s3Client.getObject(request);
        } catch (SdkException e) {
            return null;
        }
    }

    @Override
    public boolean createFolder(String folderPath) {
        try {
            // 规范化路径，确保以"/"结尾
            String normalizedPath = normalizePath(folderPath);
            if (!normalizedPath.endsWith("/")) {
                normalizedPath = normalizedPath + "/";
            }

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(normalizedPath)
                            .serverSideEncryption(ServerSideEncryption.AES256)
                            .build(),
                    RequestBody.empty());
            return true;
        } catch (SdkException e) {
            return false;
        }
    }

    @Override
    public boolean folderExists(String folderPath) {
        try {
            // 规范化路径，确保以"/"结尾
            String normalizedPath = normalizePath(folderPath);
            if (!normalizedPath.endsWith("/")) {
                normalizedPath = normalizedPath + "/";
            }

            return objectExists(normalizedPath);
        } catch (SdkException e) {
            return false;
        }
    }

    @Override
    public String getCompanyBucketName(Integer companyId) {
        // 返回固定桶名，忽略companyId
        return bucketName;
    }

    @Override
    public String getCompanyS3Folder(Integer companyId) {
        return "company/" + (companyId == null ? 1 : companyId) + "/";
    }

    @Override
    public String getCompanyS3UrlStaticPart(Integer companyId) {
        return urlStaticPart;
    }

    @Override
    public Map<String, String> getAllS3Paths(Integer companyId) {
        Integer effectiveCompanyId = companyId == null ? 1 : companyId;

        Map<String, String> paths = new HashMap<>();
        paths.put("bucketName", bucketName);
        paths.put("companyFolder", getCompanyS3Folder(effectiveCompanyId));
        paths.put("urlStaticPart", urlStaticPart);
        paths.put("pdfFolder", S3_BUCKET_FOLDER_FOR_PDF);
        paths.put("checklistTypeImagesFolder", S3_BUCKET_FOLDER_FOR_INSPECTION_CHECKLIST_IMAGES);
        paths.put("devChecklistPdfsFolder", S3_BUCKET_FOLDER_FOR_INSPECTION_THIRD_PARTY_PDF);
        paths.put("icsFolder", S3_BUCKET_FOLDER_FOR_CALANDER_ICS);
        paths.put("pdfHtmlFolder", S3_BUCKET_FOLDER_FOR_PDF_HTML_FILES);
        paths.put("projectSiteImagesFolder", S3_BUCKET_FOLDER_FOR_PROJECT_SITE_IMAGES);
        paths.put("resourcesFolder", "Resources/");

        return paths;
    }

    @Override
    public boolean initializeCompanyFolders(Integer companyId, String resourceFile) {
        Integer effectiveCompanyId = companyId == null ? 1 : companyId;
        String companyBaseFolder = getCompanyS3Folder(effectiveCompanyId);

        // 创建匹配 C# 版本 StaticDetails 中定义的所有文件夹
        boolean success = true;

        // 1. 创建公司基础文件夹
        success &= createFolder(companyBaseFolder);

        // 2. 创建各种子文件夹，对应 C# 版本的各种路径
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_PDF);
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_INSPECTION_CHECKLIST_IMAGES);
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_INSPECTION_THIRD_PARTY_PDF);
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_CALANDER_ICS);
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_PDF_HTML_FILES);
        success &= createFolder(companyBaseFolder + S3_BUCKET_FOLDER_FOR_PROJECT_SITE_IMAGES);
        success &= createFolder(companyBaseFolder + "Resources/");

        // 如果提供了 resourceFile，则创建该文件（空占位对象）
        if (resourceFile != null && !resourceFile.isEmpty()) {
            try {
                String normalizedResourcePath = normalizePath(
                        companyBaseFolder + "Resources/" + resourceFile);

                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(bucketName)
                                .key(normalizedResourcePath)
                                .serverSideEncryption(ServerSideEncryption.AES256)
                                .build(),
                        RequestBody.empty());
            } catch (Exception e) {
                success = false;
            }
        }

        return success;
    }

    /**
     * 规范化路径，避免重复的"/"
     *
     * @param path 原始路径
     * @return 规范化后的路径
     */
    private String normalizePath(String path) {
        if (path == null || path.isEmpty()) {
            return "";
        }

        // 去除开头的"/"
        String normalizedPath = path.startsWith("/") ? path.substring(1) : path;

        // 去除多余的"/"
        normalizedPath = normalizedPath.replaceAll("/+", "/");

        return normalizedPath;
    }

    /**
     * 判断对象是否存在（等价于 v1 的 {@code doesObjectExist}）。
     * 通过 {@code headObject} 实现，捕获 {@link NoSuchKeyException} 与 404。
     */
    private boolean objectExists(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw e;
        }
    }

    @Override
    public boolean deleteFile(String bucketFolder, String fileName) {
        try {
            log.debug("正在删除S3文件，桶文件夹: {}, 文件名: {}", bucketFolder, fileName);

            // 规范化路径
            String normalizedBucketFolder = normalizePath(bucketFolder);
            String normalizedFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            String key = normalizedBucketFolder + normalizedFileName;

            // 检查文件是否存在 - 为了兼容旧版本，不存在也返回true
            if (!objectExists(key)) {
                log.debug("S3文件不存在，跳过删除: {}", key);
                return true; // 返回true，表示操作"成功"
            }

            // 删除文件
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            log.debug("S3文件已成功删除: {}", key);
            return true;
        } catch (SdkException e) {
            log.debug("删除S3文件时发生错误(不影响业务): {}", e.getMessage());
            return true; // 即使出现异常也返回true，确保上层调用不受影响
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            log.debug("通过URL删除S3文件: {}", fileUrl);

            // 尝试从URL中提取桶文件夹路径和文件名
            if (fileUrl == null || fileUrl.isEmpty()) {
                return false;
            }

            // 预期URL格式为：https://{bucketName}{urlStaticPart}{bucketFolder}{fileName}
            String urlPrefix = "https://" + bucketName + urlStaticPart;
            if (!fileUrl.startsWith(urlPrefix)) {
                log.warn("无效的S3文件URL格式: {}", fileUrl);
                return false;
            }

            // 提取相对路径（去除URL前缀）
            String relativePath = fileUrl.substring(urlPrefix.length());

            // 查找最后一个斜杠来分离文件夹和文件名
            int lastSlashIndex = relativePath.lastIndexOf('/');
            if (lastSlashIndex < 0) {
                // 没有文件夹部分，直接删除文件
                return deleteFile("", relativePath);
            }

            String bucketFolder = relativePath.substring(0, lastSlashIndex + 1); // 包含末尾斜杠
            String fileName = relativePath.substring(lastSlashIndex + 1);

            return deleteFile(bucketFolder, fileName);
        } catch (Exception e) {
            log.error("删除S3文件时发生错误: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public String generatePresignedUrl(String fileUrl, int expirationTimeInMinutes) {
        try {
            log.debug("生成S3文件预签名URL，文件URL: {}，过期时间: {} 分钟", fileUrl, expirationTimeInMinutes);

            // 检查参数有效性
            if (fileUrl == null || fileUrl.isEmpty() || expirationTimeInMinutes <= 0) {
                log.warn("生成预签名URL的参数无效，fileUrl: {}, expirationTimeInMinutes: {}",
                        fileUrl, expirationTimeInMinutes);
                return null;
            }

            // 从URL中提取S3对象键
            String urlPrefix = "https://" + bucketName + urlStaticPart;
            if (!fileUrl.startsWith(urlPrefix)) {
                log.warn("无效的S3文件URL格式: {}", fileUrl);
                return null;
            }

            // 提取S3对象键（相对路径）
            String s3Key = fileUrl.substring(urlPrefix.length());

            // 验证对象是否存在
            if (!objectExists(s3Key)) {
                log.warn("S3文件不存在: {}", s3Key);
                return null;
            }

            // 生成预签名 GET URL
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(expirationTimeInMinutes))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            if (presignedRequest != null && presignedRequest.url() != null) {
                String presignedUrl = presignedRequest.url().toString();
                log.debug("成功生成预签名URL: {}", presignedUrl);
                return presignedUrl;
            } else {
                log.warn("生成预签名URL失败");
                return null;
            }
        } catch (SdkException e) {
            log.error("生成预签名URL时发生Amazon服务异常: {}", e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("生成预签名URL时发生异常: {}", e.getMessage(), e);
            return null;
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String path) {
        log.info("上传文件到S3，路径: {}", path);
        try {
            // 解析路径，分离出文件夹和文件名
            int lastSlashIndex = path.lastIndexOf('/');
            String bucketFolder = "";
            String fileName = path;

            if (lastSlashIndex > 0) {
                bucketFolder = path.substring(0, lastSlashIndex + 1);
                fileName = path.substring(lastSlashIndex + 1);
            }

            // 调用具体的上传实现
            return uploadFile(bucketFolder, file, fileName);
        } catch (Exception e) {
            log.error("上传文件失败: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getBucketNameByCompanyId(Integer companyId) {
        // 与getCompanyBucketName实现相同，返回固定的桶名
        return bucketName;
    }

    @Override
    public String getFileContentAsString(String bucketFolder, String fileName) {
        InputStream inputStream = getFileFromS3(bucketFolder, fileName);
        if (inputStream == null) {
            return null;
        }
        try (java.util.Scanner scanner = new java.util.Scanner(inputStream, java.nio.charset.StandardCharsets.UTF_8.name())) {
            return scanner.useDelimiter("\\A").next();
        } catch (java.util.NoSuchElementException e) {
            return "";
        }
    }

    @Override
    public void uploadFile(String bucketFolder, InputStream stream, String fileName, String contentType) {
        putObject(bucketFolder, stream, fileName, contentType, null);
    }

    @Override
    public String getFileAsBase64(String bucketFolder, String fileName) {
        try (InputStream inputStream = getFileFromS3(bucketFolder, fileName)) {
            if (inputStream == null) {
                log.warn("File not found in S3: bucket={}, key={}", bucketFolder, fileName);
                return "";
            }
            byte[] fileBytes = inputStream.readAllBytes();
            return Base64.getEncoder().encodeToString(fileBytes);
        } catch (IOException e) {
            log.error("Failed to read file from S3 and encode to Base64: bucket={}, key={}", bucketFolder, fileName, e);
            return "";
        }
    }
}
