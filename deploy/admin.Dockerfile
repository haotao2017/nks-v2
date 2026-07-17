# NKS Admin(Next.js 16)容器 —— monorepo pnpm workspace 构建。
# 构建上下文 = 仓库根(nks-v2/)。
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# 先拷贝 workspace 清单以利用缓存
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY packages/ packages/
COPY apps/admin/ apps/admin/

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* 必须在构建期注入(会被内联进产物)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN pnpm --filter @nks/admin build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["pnpm", "--filter", "@nks/admin", "start"]
