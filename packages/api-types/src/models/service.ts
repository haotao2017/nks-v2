/**
 * 服务(Service)域类型 —— 对齐 no.nks.dto.Service* 系列 DTO。
 */

/** 服务按区间计价明细。 */
export interface ServicePerSlabDto {
  id?: number;
  serviceId?: number;
  rangeFrom?: number;
  rangeTo?: number;
  rate?: string;
}

/** 服务关联工作流类别。 */
export interface ServiceWorkflowCategoryDto {
  id?: number;
  workflowCategoryId?: number;
  serviceId?: number;
}

/** 服务。rate 为 String(不是 number)。@JsonInclude(NON_NULL)。 */
export interface ServiceDto {
  id?: number;
  name?: string;
  description?: string;
  serviceTypeId?: number;
  serviceChargedAs?: number;
  rate?: string;
  checklistTempId?: number;
  servicePerSlabList?: ServicePerSlabDto[];
  serviceWorkflowCategory?: ServiceWorkflowCategoryDto[];
}

/** 单个服务包装。 */
export interface WrapperService {
  service?: ServiceDto;
}

/** 多个服务包装。 */
export interface WrapperMultiService {
  multiService?: ServiceDto[];
}
