# 家庭财富管理工具

三人家庭内网使用的 Web 应用：研报广场、每周研报、个人空间（交易心得与交易成绩）。

## 功能

- **研报广场**：分享研报（标题、正文、截图与附件），按时间线展示。
- **每周研报**：由指定成员每周发布一篇，首页置顶展示。
- **个人空间**：每人独立记录交易心得与交易成绩，仅本人可见。

## 技术栈

- Next.js (App Router)、React、TypeScript、Tailwind CSS
- SQLite + Prisma
- Session + Cookie 认证（无注册，固定 3 个账号由种子脚本创建）

## 本地开发

```bash
# 安装依赖
npm install

# 配置数据库（在项目根目录）
echo 'DATABASE_URL="file:./dev.db"' > .env

# 初始化数据库并创建 3 个用户
npm run db:push
npm run db:seed

# 启动开发服务
npm run dev
```

浏览器访问 http://localhost:3000 ，未登录会跳转登录页。种子默认账号：`member1` / `member2` / `member3`，默认密码为环境变量 `SEED_PASSWORD` 或 `family2025`。

## 部署（内网 / NAS / 云主机）

### 方式一：Node 直接运行

```bash
# 构建
npm run build

# 生产环境需设置 DATABASE_URL（建议绝对路径，便于备份）
export DATABASE_URL="file:/path/to/data/sqlite.db"
mkdir -p /path/to/data /path/to/uploads

# 首次部署：初始化数据库与用户
npx prisma db push --skip-generate
npx prisma db seed

# 启动（默认 3000 端口）
npm start
```

若需对外通过 Nginx 反代并启用 HTTPS，在 Nginx 中配置 `proxy_pass http://127.0.0.1:3000` 即可。

### 方式二：Docker

```bash
# 构建镜像
docker build -t family-wealth .

# 运行（挂载数据与上传目录）
docker run -d \
  --name family-wealth \
  -p 3000:3000 \
  -v /path/on/host/data:/app/data \
  -v /path/on/host/uploads:/app/uploads \
  -e DATABASE_URL="file:/app/data/sqlite.db" \
  family-wealth
```

首次运行时会自动执行 `prisma db push` 与 `prisma db seed`（仅当 `/app/data/sqlite.db` 不存在时）。默认密码同本地，可通过 `SEED_PASSWORD` 环境变量覆盖（需在 seed 首次执行前设定；若库已存在，修改 env 后需自行在库中改密码或重新建库）。

### 备份

- **数据库**：复制 `DATABASE_URL` 指向的 SQLite 文件（如 `dev.db` 或 `/app/data/sqlite.db`）即可。
- **上传文件**：备份 `uploads/` 目录（或 Docker 挂载的 `/app/uploads` 对应宿主机目录）。

定期备份上述两者即可恢复数据。

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | SQLite 连接，例如 `file:./dev.db` 或 `file:/app/data/sqlite.db` |
| `SESSION_SECRET` | 会话签名密钥，至少 16 字符（用于登录态 Cookie 签名） |
| `SEED_PASSWORD` | 种子脚本创建用户时的默认密码（仅首次 seed 时生效） |

## 默认用户

种子脚本会创建 3 个成员：

- `member1`：角色为「每周研报发布者」，可发布每周研报。
- `member2`、`member3`：普通成员。

修改密码需在数据库中更新 `Member.passwordHash`（使用 bcrypt 哈希），或重新执行 seed（会先清空成员时再创建，慎用）。
