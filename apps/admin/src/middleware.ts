import { NextResponse, type NextRequest } from 'next/server';

import { TOKEN_COOKIE } from '@/lib/auth-storage';

const LOGIN_PATH = '/login';

/** 外部参与方免登录路由前缀:靠 URL 参数(含 UrlKey)鉴权,不走 token 守卫。 */
const PUBLIC_PREFIXES = ['/external'];

/**
 * 路由守卫:
 *  - /external/** 为免登录公开路由(外部参与方靠 UrlKey),直接放行。
 *  - 无 token cookie 访问受保护路由 → 重定向 /login(带 from 参数)。
 *  - 已登录访问 /login → 重定向 /。
 * matcher 已排除 API、静态资源、图片等,故此处只处理页面路由。
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  // 旧邮件链接 PascalCase 路径 → kebab 路由（大小写敏感服务器否则 404）
  if (pathname === '/external/UploadDocument') {
    const url = req.nextUrl.clone();
    url.pathname = '/external/upload-document';
    return NextResponse.redirect(url);
  }
  if (pathname === '/external/UpdateDeviation') {
    const url = req.nextUrl.clone();
    url.pathname = '/external/update-deviation';
    return NextResponse.redirect(url);
  }

  // 免登录公开路由:外部参与方无 token,不做守卫/重定向。
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (!token && !isLoginPage) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (token && isLoginPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
