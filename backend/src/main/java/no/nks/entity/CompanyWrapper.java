package no.nks.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 公司包装类，用于响应中包含公司信息。
 * 注意：这是普通 POJO，不是 JPA 实体（不参与 ddl-auto=validate 校验）。
 * 仅为兼容 RequestResponse 的既有字段而保留。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyWrapper {
    private Integer companyId;
    private String companyName;
    private String description;
    private String address;

    // 兼容原 C# 代码的大写 ID 字段
    private Integer companyID;
    private Boolean isSystemOwner;

    public Integer getCompanyID() {
        return companyID != null ? companyID : companyId;
    }

    public void setCompanyID(Integer companyID) {
        this.companyID = companyID;
        this.companyId = companyID;
    }

    public Boolean getSystemOwner() {
        return isSystemOwner;
    }

    public void setSystemOwner(Boolean systemOwner) {
        this.isSystemOwner = systemOwner;
    }
}
