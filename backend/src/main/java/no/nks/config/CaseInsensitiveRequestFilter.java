package no.nks.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 过滤器，用于包装HttpServletRequest，使其能够处理大小写不敏感的参数。
 */
@Component
@Order(1)
public class CaseInsensitiveRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CaseInsensitiveHttpServletRequestWrapper wrapper = new CaseInsensitiveHttpServletRequestWrapper(request);
        filterChain.doFilter(wrapper, response);
    }
}
