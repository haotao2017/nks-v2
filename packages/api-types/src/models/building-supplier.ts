/**
 * 建筑供应商(BuildingSupplier)域类型 —— 来自 no.nks.entity 包。
 */
import type { RequestResponse } from '../common';

/**
 * 建筑供应商模板实体。
 * sortOrder / companyId 为 @JsonIgnore,不出现在线上。
 */
export interface BuildingSupplierDto {
  id?: number;
  title?: string;
}

/** 单个建筑供应商包装。 */
export interface WrapperBuildingSupplier {
  buildingSupplier?: BuildingSupplierDto;
}

/** 与建筑供应商关联的项目(精简)。 */
export interface ProjectAssociatedWithBuildingSup {
  id?: number;
  title?: string;
}

/** 删除/关联校验响应:通用响应 + 关联项目列表。 */
export interface ResponseBuildingSupplier {
  requestResponse?: RequestResponse;
  projectAssociatedWithBuildingSupplier?: ProjectAssociatedWithBuildingSup[];
}

/** 多个建筑供应商包装。 */
export interface WrapperMultiBuildingSuppliers {
  multiBuildingSuppliers?: BuildingSupplierDto[];
}
