package no.nks.service;

import no.nks.dto.WrapperMultiProjectPartyDto;
import no.nks.dto.WrapperProjectPartyDto;
import no.nks.entity.RequestResponse;

/**
 * 项目参与方服务接口
 */
public interface ProjectPartyService {

    /**
     * 获取项目所有参与方
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @return 项目参与方列表包装对象
     */
    WrapperMultiProjectPartyDto getAllProjectPartiesByProjectID(Integer projectId, Integer companyId);

    /**
     * 关联参与方与项目参与方类型
     *
     * @param param 参与方信息包装对象
     * @param companyId 公司ID
     * @return 操作结果
     */
    RequestResponse associatePartyWithProjectPartyType(WrapperProjectPartyDto param, Integer companyId);
}
