/**
 * 公司(Company)域类型 —— 多数来自 no.nks.entity 包。
 */

/**
 * 公司资料(CompanyProfile,POJO)。所有字段均有 @JsonProperty(camelCase),无 @JsonIgnore。
 * 含 SMTP 相关字段(compEmail*)。
 */
export interface CompanyProfile {
  id?: number;
  companyName?: string;
  organizationalNumber?: string;
  address?: string;
  ownerName?: string;
  postCode?: number;
  telephone?: string;
  mobile?: string;
  nameOnEmailAddress?: string;
  senderEmailAddress?: string;
  emailAddress?: string;
  isSystemOwner?: boolean;
  signatureImageName?: string;
  compEmailHost?: string;
  compEmailPort?: string;
  compEmailUserName?: string;
  compEmailPassword?: string;
  compEmailDisplayName?: string;
  isActive?: boolean;
}

/**
 * 通用设置(GeneralSetting 实体)。含 SMTP 字段(compEmail*)。
 * 无 @JsonIgnore,全字段序列化。
 */
export interface GeneralSetting {
  id?: number;
  companyName?: string;
  organizationalNumber?: string;
  address?: string;
  ownerName?: string;
  postCode?: number;
  cityID?: number;
  emailAddress?: string;
  telephone?: string;
  mobile?: string;
  emailSenderName?: string;
  senderEmailAddress?: string;
  isSystemOwner?: boolean;
  signatureImageName?: string;
  compEmailHost?: string;
  compEmailPort?: string;
  compEmailUserName?: string;
  compEmailPassword?: string;
  compEmailDisplayName?: string;
  isActive?: boolean;
}

/**
 * 公司包装(CompanyWrapper,POJO,兼容旧 C# 契约)。
 * 同时存在 companyId 与 companyID 两个字段;isSystemOwner 另有手写 getSystemOwner()。
 * 见文件末尾存疑说明。
 */
export interface CompanyWrapper {
  companyId?: number;
  companyName?: string;
  description?: string;
  address?: string;
  companyID?: number;
  isSystemOwner?: boolean;
  /** 手写 getSystemOwner() 可能额外产生此键。 */
  systemOwner?: boolean;
}

/** 单个公司资料包装。 */
export interface WrapperCompanyProfile {
  companyProfile?: CompanyProfile;
}

/** 多个公司资料包装。 */
export interface WrapperMultiCompanyProfile {
  multiCompanyProfile?: CompanyProfile[];
}

/** S3 存储桶(S3Bucket 实体)。 */
export interface S3Bucket {
  id?: number;
  s3bucketName?: string;
  s3urlStaticPart?: string;
  isActive?: boolean;
}

/** S3 存储桶包装,根键 "S3bucket"(@JsonProperty)。 */
export interface WrapperS3Bucket {
  S3bucket?: S3Bucket;
}

/** 文档文件夹(DocFolders 实体)。 */
export interface DocFolders {
  id?: number;
  companyId?: number;
  folderName?: string;
  folderPath?: string;
  createDate?: string;
  isActive?: boolean;
}

/** 文档文件夹包装,根键 "DocFolders"(@JsonProperty)。 */
export interface WrapperDocFolders {
  DocFolders?: DocFolders;
}
