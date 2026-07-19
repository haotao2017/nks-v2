package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.dto.ServiceDto;
import no.nks.dto.WrapperMultiService;
import no.nks.dto.WrapperService;

public interface ServiceService {

    /**
     * 设置公司信息上下文，对应C#中的DataCompany属性
     */
    void setDataCompany(RequestResponse.CompanyInfo dataCompany);

    /**
     * Clear ThreadLocal company context after request handling.
     */
    void clearDataCompany();

    /**
     * 获取单个服务
     * 对应C#中的GetSingleService方法
     */
    WrapperService getSingleService(int id);

    /**
     * 获取所有服务
     * 对应C#中的GetAllService方法
     */
    WrapperMultiService getAllService(int pageNo, String searchByName, String searchByDescription);

    /**
     * 更新单个服务
     * 对应C#中的UpdateSingleService方法
     */
    WrapperService updateSingleService(ServiceDto serviceDto);

    /**
     * 创建单个服务
     * 对应C#中的CreateSingleService方法
     */
    WrapperService createSingleService(ServiceDto serviceDto, String serviceName);

    /**
     * 删除单个服务
     * 对应C#中的DeleteSingleService方法
     */
    RequestResponse deleteSingleService(int id);
}
