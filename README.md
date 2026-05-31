# 暖厨菜单，可部署版本

这是从本地静态原型升级出来的公网版本。它解决三个问题：

- 朋友有固定公网点单链接：`/m/warm-kitchen`
- 菜单存在 Supabase 数据库里，你更新后朋友刷新即可看到最新菜品
- 朋友提交订单后，订单写入数据库，并通过 Email 或 Webhook 通知你

## 1. 项目结构

```text
app/
  admin/page.tsx              主人后台
  m/[slug]/page.tsx           朋友点单页
  api/menu                    菜单 API
  api/orders                  订单 API
components/
  AdminApp.tsx
  FriendMenu.tsx
database/
  schema.sql                  Supabase 建表和示例菜品
lib/
  notify.ts                   Email/Webhook 通知
  supabaseAdmin.ts            服务端数据库客户端
```

## 2. 你需要准备的账号

本地 Node.js 建议使用 20.9 或更高版本；这个项目已经按 Next.js 16 配好。

必需：

- GitHub，用来放代码
- Vercel，用来部署 Next.js
- Supabase，用来存菜单和订单

通知二选一：

- Resend，用来发邮件通知
- 一个 Webhook，例如 Telegram、PushPlus、企业微信机器人或你自己的自动化服务

## 3. 创建 Supabase 数据库

1. 打开 Supabase，创建一个新项目。
2. 进入 `SQL Editor`。
3. 打开本项目的 `database/schema.sql`。
4. 整段复制进去并运行。
5. 进入 `Project Settings -> API`，复制：
   - `Project URL`
   - `service_role` key

注意：`service_role` key 只能放在 Vercel 环境变量里，不要放到前端代码或公开仓库。

## 4. 配置环境变量

复制 `.env.example` 为 `.env.local`，本地开发时填写：

```bash
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_KITCHEN_SLUG=warm-kitchen
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
ADMIN_TOKEN=一个很长的后台密码
RESEND_API_KEY=你的 Resend API key
ORDER_NOTIFY_EMAIL=你的收件邮箱
ORDER_FROM_EMAIL=Warm Kitchen <orders@你的域名.com>
NOTIFY_WEBHOOK_URL=
```

如果先不做邮件通知，可以暂时不填 `RESEND_API_KEY`。订单仍会进入后台订单板。

## 5. 本地运行

```bash
npm install
npm run dev
```

打开：

- 主人后台：`http://localhost:3000/admin`
- 朋友点单页：`http://localhost:3000/m/warm-kitchen`

进入后台时输入 `.env.local` 里的 `ADMIN_TOKEN`。

## 6. 部署到 Vercel

1. 把 `warm-kitchen-deployable` 目录上传到一个 GitHub 仓库。
2. 在 Vercel 选择 `Add New Project`。
3. 导入这个仓库。
4. 在 Vercel 的 `Environment Variables` 填入 `.env.example` 里的变量。
5. 点击 Deploy。

部署成功后，你会得到：

```text
https://your-site.vercel.app/admin
https://your-site.vercel.app/m/warm-kitchen
```

以后朋友只需要打开第二个链接。

官方文档：

- Vercel Git 部署：https://vercel.com/docs/git
- Supabase 数据库：https://supabase.com/docs/guides/database/overview
- Next.js Route Handlers：https://nextjs.org/docs/app/api-reference/file-conventions/route
- Resend 发邮件 API：https://resend.com/docs/api-reference/emails/send-email

## 7. 配置邮件通知

推荐用 Resend：

1. 创建 Resend 账号。
2. 生成 API Key，填到 `RESEND_API_KEY`。
3. 把你的邮箱填到 `ORDER_NOTIFY_EMAIL`。
4. `ORDER_FROM_EMAIL` 需要使用 Resend 允许的发件地址。

如果你没有配置 Resend，订单仍会保存，只是不发邮件。

## 8. 配置 Webhook 通知

如果你更想用即时推送，把 `NOTIFY_WEBHOOK_URL` 填成你的 Webhook 地址。

订单创建后会 POST 这种 JSON：

```json
{
  "text": "暖厨新订单...",
  "order": {},
  "items": []
}
```

不同通知工具的格式可能不一样。如果目标工具要求特殊格式，可以改 `lib/notify.ts`。

## 9. 使用流程

1. 打开 `/admin`。
2. 输入 `ADMIN_TOKEN`。
3. 在菜单管理里新增、编辑、暂停菜品。
4. 把 `/m/warm-kitchen` 发给朋友。
5. 朋友提交订单。
6. 你会在 `/admin` 的订单板看到订单。
7. 如果配置了通知，你会收到 Email 或 Webhook 推送。

## 10. 后续可升级

- 图片上传到 Supabase Storage
- 订单实时刷新
- 下单截止时间
- 每日库存扣减
- 多套菜单，比如周末菜单、节日菜单
- 微信/短信通知
- 支付或定金
