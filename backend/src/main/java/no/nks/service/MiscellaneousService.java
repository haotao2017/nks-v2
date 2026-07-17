package no.nks.service;

import no.nks.dto.PostCodeDto;
import no.nks.dto.WrapperPostCodeDto;

public interface MiscellaneousService {

    /**
     * 获取所有邮政编码信息
     * @return 包含所有邮政编码的 DTO 对象
     */
    WrapperPostCodeDto getAllPostCodes();

    /**
     * 根据邮政编码获取单个邮政编码信息
     * @param postNumber 邮政编码
     * @return 邮政编码 DTO 对象
     */
    PostCodeDto getPostCodeByPostNumber(String postNumber);
}
