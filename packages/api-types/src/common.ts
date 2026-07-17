/**
 * 共享基础类型 —— 对齐后端 no.nks.dto 的通用响应/错误结构。
 *
 * 线上形状映射规则(所有 model 文件遵循):
 *  - TS 字段名 = JSON 线上字段名 = Java 的 @JsonProperty 值(若有),否则 Java 字段名(camelCase,Jackson 默认)。
 *  - @JsonIgnore 字段不出现在 TS 类型里(如各 DTO 的 companyId)。
 *  - Integer/Long/int/BigDecimal → number;String → string;Boolean/boolean → boolean。
 *  - LocalDateTime/LocalDate/Date → string(ISO-8601)。
 *  - List<X> → X[];嵌套 DTO → 其接口。
 *  - 字段默认可选(?):后端多处 @JsonInclude(NON_NULL) 且支持部分更新,宽松更贴合实际线上表现。
 */

/** GlobalExceptionHandler 的 ApiError 响应体。 */
export interface ApiError {
  status?: number;
  message?: string;
  timestamp?: string;
  path?: string;
  errors?: Record<string, unknown> | string[] | null;
}

/** 通用成功/失败响应(no.nks.dto.RequestResponse)。 */
export interface RequestResponse {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  data?: unknown;
}

/** {message, success} 形状(DeleteContactResponseDto / GenericApiResponseDto / ResponseDto)。 */
export interface MessageSuccessResponse {
  message?: string;
  success?: boolean;
}

/** 分页/区间参数(Project 列表用 EntriesFrom/EntriesTill;Service/Checklist 用 PageNo)。 */
export interface RangeParams {
  EntriesFrom?: number;
  EntriesTill?: number;
}
