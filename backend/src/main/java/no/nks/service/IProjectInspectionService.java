package no.nks.service;

import no.nks.dto.ProjectChecklistItemsInspDataDto;
import no.nks.dto.WrapperMultiProjectChecklistInspDataDto;
import no.nks.dto.WrapperProjectChecklistItemInspDataDto;
import no.nks.entity.RequestResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;

/**
 * 项目检查服务接口
 */
public interface IProjectInspectionService {

    /**
     * 获取项目所有检查清单检查数据
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @param s3Service S3服务接口
     * @return 项目检查清单检查数据包装对象
     */
    WrapperMultiProjectChecklistInspDataDto getAllProjectChecklistsInspData(
            Integer projectId, Integer companyId, IS3Service s3Service);

    /**
     * 更新单个项目检查清单项检查数据
     *
     * @param param 检查清单项检查数据参数
     * @param companyId 公司ID
     * @return 更新后的检查清单项检查数据包装对象
     */
    WrapperProjectChecklistItemInspDataDto updateSingleProjectChecklistItemInspData(
            WrapperProjectChecklistItemInspDataDto param, Integer companyId);

    /**
     * 删除单个项目检查单项目图片数据
     *
     * @param projectChecklistItemImageId 项目检查单项目图片ID
     * @param companyId 公司ID
     * @return 请求响应
     */
    RequestResponse deleteSingleProjectChecklistItemImageInspData(
            Integer projectChecklistItemImageId, Integer companyId);

    /**
     * 获取项目检查单数据
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目检查单数据包装对象
     */
    WrapperMultiProjectChecklistInspDataDto getProjectChecklistsInsDataForProject(Integer projectId, Integer companyId);

    /**
     * 更新项目检查单项目数据
     *
     * @param checklistItem 检查单项目数据
     * @param companyId 公司ID
     * @return 更新后的检查单项目数据包装对象
     */
    WrapperProjectChecklistItemInspDataDto updateProjectChecklistItemInspData(ProjectChecklistItemsInspDataDto checklistItem, Integer companyId);

    /**
     * 上传项目检查图片
     *
     * @param file 要上传的文件
     * @param bucketFolder 存储桶文件夹
     * @param fileName 文件名
     * @param companyId 公司ID
     * @return 异步处理结果
     */
    CompletableFuture<String> uploadProjectInspectionImage(
            MultipartFile file, String bucketFolder, String fileName, Integer companyId);
}
