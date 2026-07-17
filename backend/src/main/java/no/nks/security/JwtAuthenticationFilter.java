package no.nks.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.service.JwtService;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UrlPathHelper;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // 公开路径列表，不需要 JWT 验证
    private final List<String> publicPaths = Arrays.asList(
            "/api/users/Authenticate",
            "/api/users/authenticate"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final UrlPathHelper urlPathHelper = new UrlPathHelper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestPath = urlPathHelper.getPathWithinApplication(request);

        // OPTIONS 请求直接跳过
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            log.debug("Skipping JWT filter for OPTIONS request: {}", requestPath);
            return true;
        }

        boolean isPublicPath = publicPaths.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));

        if (isPublicPath) {
            log.debug("Skipping JWT filter for public path: {}", requestPath);
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestPath = urlPathHelper.getPathWithinApplication(request);
        log.debug("Processing JWT validation for path: {}", requestPath);

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final Integer userId;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            if (!jwtService.validateToken(jwt)) {
                log.warn("Invalid JWT token for path: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            userId = jwtService.getUserIdFromToken(jwt);
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userId.toString());
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication for path {}: {}", requestPath, e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
