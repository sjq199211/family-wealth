# family-wealth 部署步骤（从零开始）

部署后**可以随时修改内容**：你改完代码并推送到 GitHub，Vercel 会自动重新部署，几分钟后线上就是新版本。也可以只在 Vercel 后台点「Redeploy」用同一份代码重新部署。

---

## 你需要准备的账号（全部免费）

1. **GitHub** — 放代码用  
2. **Neon** — 云数据库（PostgreSQL）  
3. **Vercel** — 托管并发布网站  

下面按顺序做即可。

---

## 第一步：注册 GitHub 并上传代码

### 1.1 注册 GitHub

1. 打开 [https://github.com](https://github.com)
2. 点 **Sign up**，用邮箱注册一个账号并验证

### 1.2 用 Homebrew 安装 Git 和 Node.js（如果还没装）

你已经装了 Homebrew，在「终端」里按下面做即可。

**1) 安装 Git**

```bash
brew install git
```

装好后执行（把邮箱和名字换成你的）：

```bash
git config --global user.email "你的邮箱@example.com"
git config --global user.name "你的名字"
```

**2) 安装 Node.js**（若本地还没装或 `node -v` 报错）

```bash
brew install node
```

部署时 Vercel 会在云端用自带的 Node 构建，本机 Node 主要用来本地开发、跑 Prisma。若你本地已经能 `npm run dev`，可跳过这一步。

### 1.3 在 GitHub 上新建仓库

1. 登录 GitHub，右上角 **+** → **New repository**
2. **Repository name** 填：`family-wealth`（或任意英文名）
3. 选 **Public**，**不要**勾选 "Add a README"
4. 点 **Create repository**

### 1.4 把本地的 family-wealth 推送到 GitHub

在终端里依次执行（路径按你电脑实际位置改）：

```bash
cd /Users/jshen/Desktop/Cursor
```

如果当前整个 Cursor 文件夹**还没有**用 Git 管理，先初始化并只提交 family-wealth 所在仓库的一种做法是：**只把 family-wealth 当作一个独立仓库**推上去。可以这样：

```bash
cd /Users/jshen/Desktop/Cursor/family-wealth
git init
git add .
git status
```

确认列表里**没有** `.env` 文件（.env 已在 .gitignore 里，不应被提交）。若有，不要 add 它。

```bash
git commit -m "Initial commit: family-wealth"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/family-wealth.git
git push -u origin main
```

把 `你的GitHub用户名` 换成你在 GitHub 的登录名。推送时可能会要求登录 GitHub（浏览器弹出或命令行输用户名/密码或 Token）。  
若提示用 Token：在 GitHub → **Settings → Developer settings → Personal access tokens** 新建一个 token，用 token 当密码。

---

## 第二步：注册 Neon 并创建数据库

### 2.1 注册并建库

1. 打开 [https://neon.tech](https://neon.tech)，用 **Sign up with GitHub** 登录（最省事）
2. 登录后点 **New Project**
3. **Project name** 随便填，例如 `family-wealth`
4. **Region** 选 **Singapore** 或 **US East**（离国内选 Singapore 稍好）
5. 点 **Create project**

### 2.2 复制数据库连接字符串

1. 项目建好后会有一个 **Connection string**
2. 选择 **Pooled connection**（推荐），复制整串，形如：  
   `postgresql://用户名:密码@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`  
3. 把这段**保存到记事本**，后面在 Vercel 里要填（不要泄露到公开地方）

---

## 第三步：把项目改成用 PostgreSQL

你的项目已经支持 PostgreSQL，只需在部署时用 Neon 的地址即可（见下一步）。  
本地若也想用同一套数据库，可在本机建一个 `.env`，把 `DATABASE_URL` 改成上面复制的 Neon 地址再执行：

```bash
cd /Users/jshen/Desktop/Cursor/family-wealth
npx prisma db push
npx prisma db seed
```

（可选）这样本地和线上共用一个数据库；若只想本地用 SQLite，可继续用现在的 `.env`，只在 Vercel 里填 Neon 的 `DATABASE_URL`。

---

## 第四步：注册 Vercel 并部署

### 4.1 注册并导入项目

1. 打开 [https://vercel.com](https://vercel.com)
2. 点 **Sign Up**，选 **Continue with GitHub**，授权 Vercel 访问 GitHub
3. 登录后点 **Add New…** → **Project**
4. 在列表里找到你刚推送的 **family-wealth** 仓库，点 **Import**

### 4.2 配置项目

1. **Project Name** 可保持 `family-wealth`
2. **Root Directory**：点 **Edit**，填 **family-wealth**，再点 **Continue**  
   （若你建的 GitHub 仓库根目录就是 family-wealth 的代码，这里留空即可）
3. **Framework Preset** 保持 **Next.js**
4. **Build and Output Settings** 保持默认即可（Vercel 会自动识别）

### 4.3 添加环境变量（必做）

在 **Environment Variables** 区域，逐个添加（Name / Value）：

| Name           | Value |
|----------------|--------|
| `DATABASE_URL` | 第二步复制的 Neon 连接字符串（整段粘贴） |
| `SESSION_SECRET` | 一串随机字符（至少 32 位），例如用：`openssl rand -hex 32` 生成 |
| `ACCESS_CODE` | 你现在的进门码，例如 `family2025` |

若你用了智谱等 AI，在本地 `.env` 里有的变量，线上也要在这里加同样的名字和值（例如 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`）。  
**注意**：不要在这里粘贴你本地 `.env` 的完整内容，只按需复制**值**，且不要提交到 GitHub。

添加完后点 **Deploy**。

### 4.4 首次部署后执行数据库迁移（若表还没建）

若部署日志里没有自动跑迁移，你需要**在本地**用 Neon 的地址建一次表（只做一次）：

```bash
cd /Users/jshen/Desktop/Cursor/family-wealth
# 临时使用 Neon 地址（把下面的替换成你的 Neon 连接字符串）
DATABASE_URL="你复制的Neon连接字符串" npx prisma db push
DATABASE_URL="你复制的Neon连接字符串" npx prisma db seed
```

之后刷新 Vercel 给的网站链接，应能正常打开并使用。

---

## 第五步：拿到网站链接并用手机访问

1. 部署成功后，Vercel 会给你一个地址，例如：  
   `https://family-wealth-xxx.vercel.app`
2. 用电脑浏览器打开该链接即可使用
3. 用手机浏览器输入同一链接，也可以访问（无需额外配置）

---

## 部署后如何修改内容？

- **改代码**：在 Cursor 里改好 → 保存 → 在终端执行：
  ```bash
  cd /Users/jshen/Desktop/Cursor/family-wealth
  git add .
  git commit -m "描述你的修改"
  git push
  ```
  Vercel 检测到 GitHub 有新提交会自动重新部署，几分钟后线上就是新版本。

- **只重新部署、不改代码**：在 Vercel 网站里打开你的项目 → **Deployments** → 某次部署右侧 **⋯** → **Redeploy**。

- **改环境变量**：Vercel 项目 → **Settings** → **Environment Variables**，改完后在 **Deployments** 里对最新一次点 **Redeploy** 使新变量生效。

---

## 本地开发说明（已改为 PostgreSQL 后）

项目的数据库已改为 PostgreSQL（用于连接 Neon）。**本地开发**时请二选一：

- **推荐**：在本地 `.env` 里把 `DATABASE_URL` 改成你在 Neon 复制的连接字符串，这样本地和线上共用一个数据库，无需再装数据库。
- 或者：在电脑上安装 PostgreSQL，新建一个数据库，把该库的连接字符串写在 `.env` 的 `DATABASE_URL` 中。

然后执行一次：`npx prisma db push` 和（如需）`npx prisma db seed`，再 `npm run dev` 即可。

---

## 注意事项

1. **附件/上传文件**：当前报告附件、Word 等是存在服务器本地的。Vercel 是无状态环境，**重启或重新部署后这些文件会丢失**。若需要长期保存附件，后续要改成用对象存储（如 Vercel Blob、云存储），这一步先以能部署、能访问为主。
2. **.env 不要提交**：敏感信息只放在 Vercel 的 Environment Variables 和本机 `.env`，不要推到 GitHub。
3. **数据库**：用户、报告、笔记等数据都存在 Neon 里，不会因为重新部署而丢失。

按以上步骤做完，你就有一个可随时修改、可分享的 family-wealth 线上版了。若某一步报错，把报错信息或截图发出来，我可以按具体错误帮你排查。
