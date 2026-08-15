# Qexo MCP Proxy

将 [Qexo](https://github.com/Qexo/Qexo) 博客 API 包装为 MCP (Model Context Protocol) 工具，部署在 Cloudflare Workers 上，让 AI 助手（如微信机器人）直接管理你的 Hexo 博客。

## 功能

通过 MCP 协议暴露以下工具，AI 可直接调用：

| 工具 | 说明 |
|------|------|
| `qexo_list_posts` | 列出文章（支持关键词搜索） |
| `qexo_get_post` | 获取单篇文章信息 |
| `qexo_save_post` | 保存/更新文章（Markdown 格式） |
| `qexo_delete_post` | 删除文章 |
| `qexo_list_pages` | 列出页面 |
| `qexo_save_page` | 保存/更新页面 |
| `qexo_blog_status` | 获取博客状态（文章数、最后更新时间） |
| `qexo_list_friends` | 列出友链 |
| `qexo_add_friend` | 添加友链 |
| `qexo_list_talks` | 列出说说/动态（分页） |
| `qexo_save_talk` | 发表说说 |
| `qexo_list_images` | 列出图片 |

## 部署

### 前提

- 一个 [Cloudflare](https://cloudflare.com) 账号
- 一个已部署的 [Qexo](https://github.com/Qexo/Qexo) 博客实例
- Qexo 的 API Token（在 Qexo 后台获取）

### 步骤

1. **克隆并部署**

```bash
git clone https://github.com/free-zuike/qexo-mcp-proxy.git
cd qexo-mcp-proxy
npm install
npx wrangler deploy
```

2. **配置环境变量**

在 Cloudflare Dashboard 中为 Worker 添加环境变量：

| 变量 | 说明 |
|------|------|
| `QEXO_BASE_URL` | Qexo 博客地址，如 `https://your-blog.com` |

### 对接 MCP 客户端

在支持 MCP 的应用（如微信机器人管理后台）中添加 MCP 服务器：

- **URL**: `https://你的worker域名.workers.dev`
- **API Key**: 填入你的 Qexo API Token（通过 `Authorization: Bearer <token>` 头传入）

## 本地开发

```bash
npm install
npx wrangler dev
```

## 技术栈

- [Cloudflare Workers](https://workers.cloudflare.com/) — 部署平台
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) — AI 工具协议
- [Qexo Public API](https://github.com/Qexo/Qexo) — 博客后端 API
- TypeScript

## License

MIT