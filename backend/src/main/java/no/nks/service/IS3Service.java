package no.nks.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.concurrent.CompletableFuture;

/**
 * S3服务接口
 */
public interface IS3Service {

    /**
     * 异步上传文件到S3
     *
     * @param bucketFolder 桶文件夹
     * @param file 文件
     * @param fileName 文件名
     * @return 操作结果的CompletableFuture
     */
    CompletableFuture<String> uploadFileAsync(String bucketFolder, MultipartFile file, String fileName);

    /**
     * 创建公共URL
     *
     * @param bucketName 桶名称
     * @param urlStaticPart URL静态部分
     * @param bucketFolder 桶文件夹
     * @param fileName 文件名
     * @return 公共URL
     */
    String createPublicURL(String bucketName, String urlStaticPart, String bucketFolder, String fileName);

    /**
     * 从S3中删除文件
     *
     * @param bucketFolder 桶文件夹
     * @param fileName 文件名
     * @return 删除成功返回true，失败返回false
     */
    boolean deleteFile(String bucketFolder, String fileName);

    /**
     * 获取公司S3文件夹路径
     *
     * @param companyId 公司ID
     * @return 公司文件夹路径
     */
    String getCompanyS3Folder(Integer companyId);
}
