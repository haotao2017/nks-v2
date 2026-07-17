package no.nks.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.Enumeration;
import java.util.Map;

/**
 * HttpServletRequest包装器，用于处理大小写不敏感的参数。
 * 契约中 query 参数为 PascalCase，客户端大小写不一，需保留此兼容层。
 */
public class CaseInsensitiveHttpServletRequestWrapper extends HttpServletRequestWrapper {

    public CaseInsensitiveHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getParameter(String name) {
        Map<String, String[]> parameterMap = getParameterMap();
        for (String paramName : parameterMap.keySet()) {
            if (paramName.equalsIgnoreCase(name)) {
                String[] values = parameterMap.get(paramName);
                if (values != null && values.length > 0) {
                    return values[0];
                }
            }
        }
        return super.getParameter(name);
    }

    @Override
    public Map<String, String[]> getParameterMap() {
        return super.getParameterMap();
    }

    @Override
    public Enumeration<String> getParameterNames() {
        return super.getParameterNames();
    }

    @Override
    public String[] getParameterValues(String name) {
        Map<String, String[]> parameterMap = getParameterMap();
        for (String paramName : parameterMap.keySet()) {
            if (paramName.equalsIgnoreCase(name)) {
                return parameterMap.get(paramName);
            }
        }
        return super.getParameterValues(name);
    }
}
