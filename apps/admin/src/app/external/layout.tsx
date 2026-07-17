/**
 * 外部参与方免登录区布局。
 *
 * - 极简、居中、无侧栏(与后台 (dashboard) 布局完全隔离)。
 * - 全局 Providers(QueryClient / 主题 / Toaster)已在根 layout 提供,此处无需重复。
 * - 路由 /external/** 已在 middleware.ts 放行,外部第三方靠 URL 里的 UrlKey 访问。
 */
export default function ExternalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">NKS</span>
          <span className="text-muted-foreground text-sm">Byggekontroll</span>
        </header>
        {children}
      </div>
    </div>
  );
}
