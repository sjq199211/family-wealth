FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# 数据目录（挂载 volume 持久化）
ENV DATABASE_URL="file:/app/data/sqlite.db"
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动时初始化数据库并执行 seed（若库已存在则跳过），再启动应用
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'if [ ! -f /app/data/sqlite.db ]; then npx prisma db push --skip-generate && npx prisma db seed; fi' >> /entrypoint.sh && \
    echo 'exec node node_modules/.bin/next start' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
