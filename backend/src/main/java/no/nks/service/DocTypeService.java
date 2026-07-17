package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.entity.DocType;
import no.nks.entity.WrapperDocType;
import no.nks.entity.WrapperMultiDocTypes;

public interface DocTypeService {

    /**
     * 获取单个文档类型（按公司隔离）
     *
     * @param id 文档类型ID
     * @param companyId 认证用户所属公司ID（用于租户隔离）
     * @return 包装后的文档类型
     */
    WrapperDocType getSingleDocType(Integer id, Integer companyId);

    /**
     * 获取当前公司的所有文档类型
     *
     * @param companyId 认证用户所属公司ID
     * @return 包装后的文档类型列表
     */
    WrapperMultiDocTypes getAllDocType(Integer companyId);

    /**
     * 更新文档类型（按公司隔离）
     *
     * @param docType 待更新的文档类型
     * @param companyId 认证用户所属公司ID
     * @return 包装后的更新结果
     */
    WrapperDocType updateSingleDocType(DocType docType, Integer companyId);

    /**
     * 创建文档类型
     *
     * @param docType 待创建的文档类型
     * @param companyId 认证用户所属公司ID
     * @return 包装后的创建结果
     */
    WrapperDocType createSingleDocType(DocType docType, Integer companyId);

    /**
     * 删除文档类型（按公司隔离）
     *
     * @param id 文档类型ID
     * @param companyId 认证用户所属公司ID
     * @return 删除结果
     */
    RequestResponse deleteSingleDocType(Integer id, Integer companyId);
}
