package no.nks.entity;

/**
 * RequestResponse类，用于兼容性目的，继承自dto包中的RequestResponse类
 * @deprecated 请使用 {@link no.nks.dto.RequestResponse} 代替
 */
@Deprecated
public class RequestResponse extends no.nks.dto.RequestResponse {
    
    /**
     * 默认构造函数
     */
    public RequestResponse() {
        super();
    }
    
    /**
     * 构造一个两参数的响应对象
     * 
     * @param isSuccess 是否成功
     * @param message 消息
     */
    public RequestResponse(Boolean isSuccess, String message) {
        super(isSuccess, message);
    }
    
    /**
     * 构造一个三参数的响应对象
     * 
     * @param isSuccess 是否成功
     * @param message 消息
     * @param data 数据
     */
    public RequestResponse(Boolean isSuccess, String message, Object data) {
        super(isSuccess, message, data);
    }
    
    /**
     * 构造一个成功响应
     * 
     * @param message 成功消息
     * @return 成功响应对象
     */
    public static RequestResponse success(String message) {
        return new RequestResponse(true, message, null);
    }
    
    /**
     * 构造一个成功响应，带数据
     * 
     * @param message 成功消息
     * @param data 响应数据
     * @return 成功响应对象
     */
    public static RequestResponse success(String message, Object data) {
        return new RequestResponse(true, message, data);
    }
    
    /**
     * 构造一个失败响应
     * 
     * @param message 失败消息
     * @return 失败响应对象
     */
    public static RequestResponse failure(String message) {
        return new RequestResponse(false, message, null);
    }
} 