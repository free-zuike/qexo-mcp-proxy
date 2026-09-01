# Qexo MCP 代理

将 Qexo 博客的 Public API 包装成 MCP 工具，供 AI 助手（如微信机器人）调用。

## 部署

```bash
npm install
npx wrangler deploy
```

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `QEXO_BASE_URL` | ✅ | Qexo 管理后台地址，如 `https://blog-admin.zuike.qzz.io` |
| `BLOG_PUBLIC_URL` | ❌ | 博客前台地址，如 `https://blog.zuike.qzz.io`，用于读取文章全文 |

API Token 通过 `Authorization: Bearer` 头传入（在微信机器人管理后台的 MCP 服务器 API Key 字段配置）。

## 配置 MCP 工具

在微信机器人管理后台 → MCP 服务添加：

| 字段 | 值 |
|---|---|
| URL | 部署后的 Worker 地址，如 `https://qexo-mcp-proxy.xxx.workers.dev` |
| API Key | Qexo 的 API Token（在 Qexo 设置 → API 配置生成） |

## 可用工具

| 工具 | 功能 | 需要 BLOG_PUBLIC_URL |
|---|---|---|
| `qexo_list_posts` | 列出文章 | ❌ |
| `qexo_get_post` | 获取文章内容（通过博客前台读取） | ✅ |
| `qexo_save_post` | 保存/更新文章 | ❌ |
| `qexo_delete_post` | 删除文章 | ❌ |
| `qexo_list_pages` | 列出页面 | ❌ |
| `qexo_list_configs` | 列出配置文件 | ❌ |
| `qexo_blog_status` | 博客状态 | ❌ |
| `qexo_list_friends` | 友链列表 | ❌ |
| `qexo_add_friend` | 添加友链 | ❌ |
| `qexo_edit_friend` | 编辑友链 | ❌ |
| `qexo_delete_friend` | 删除友链 | ❌ |
| `qexo_list_talks` | 说说列表 | ❌ |
| `qexo_save_talk` | 发表/编辑说说 | ❌ |
| `qexo_delete_talk` | 删除说说 | ❌ |
| `qexo_list_images` | 图片列表 | ❌ |

## 使用示例

在微信里说：

- "列出我的博客文章" → `qexo_list_posts`
- "我的Word打印文章讲了什么" → `qexo_get_post`
- "帮我写一篇博客，标题是xxx，内容是xxx" → `qexo_save_post`