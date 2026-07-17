package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import no.nks.entity.CompanyWrapper;

/**
 * 请求响应实体类
 * 用于表示API请求的通用响应格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponse {

    private Boolean isSuccess;

    private String message;

    private Object data;

    @JsonIgnore
    private Integer userProfileID;

    @JsonIgnore
    private boolean isAdminUser = false;

    @JsonIgnore
    private CompanyWrapper dataCompany = new CompanyWrapper();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfo {
        private Integer companyID;
        private String companyName;
        private String organizationalNumber;
        private String address;
        private String ownerName;
        private Integer postCode;
        private Integer cityID;
        private String emailAddress;
        private String telephone;
        private String mobile;
    }

    public RequestResponse(Boolean isSuccess, String message) {
        this.isSuccess = isSuccess;
        this.message = message;
        this.data = null;
    }

    public RequestResponse(Boolean isSuccess, String message, Object data) {
        this.isSuccess = isSuccess;
        this.message = message;
        this.data = data;
    }

    public boolean isSuccess() {
        return Boolean.TRUE.equals(isSuccess);
    }

    public void setSuccess(boolean success) {
        this.isSuccess = success;
    }

    public static RequestResponse success(String message) {
        return new RequestResponse(true, message, null);
    }

    public static RequestResponse success(String message, Object data) {
        return new RequestResponse(true, message, data);
    }

    public static RequestResponse failure(String message) {
        return new RequestResponse(false, message, null);
    }
}
