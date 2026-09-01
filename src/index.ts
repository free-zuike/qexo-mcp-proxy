// Qexo MCP 代理 - Cloudflare Worker 入口
// 实现 MCP 2026-07-28 无状态协议，将 Qexo REST API 包装为 MCP 工具
// 部署后在微信机器人管理后台添加 MCP 服务器即可使用

import { QexoConfig, listPosts, listPages, listConfigs, saveFile, deleteFile, listFriends, addFriend, editFriend, deleteFriend, listTalks, saveTalk, deleteTalk, getBlogStatus, listImages } from "./qexo-api";

// MCP 工具定义
const TOOLS = [
  {
    name: "qexo_list_posts",
    description: "【Qexo】列出博客文章列表。当用户想查看博客文章、列出文章、查看文章列表时调用",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "可选：搜索关键词，按标题过滤" },
      },
    },
  },
  {
    name: "qexo_get_post",
    description: "【Qexo】获取单篇文章的完整内容。当用户想查看某篇文章的详细内容、阅读文章时调用，支持按文章名或路径搜索",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "文章名，如 word打印小技巧（与 path 二选一）" },
        path: { type: "string", description: "文章路径，如 source/_posts/word打印小技巧.md（与 name 二选一）" },
      },
    },
  },
  {
    name: "qexo_save_post",
    description: "【Qexo】保存/更新文章。当用户想写文章、更新文章、修改文章时调用",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文章路径，如 source/_posts/my-article.md（必填）" },
        content: { type: "string", description: "文章内容，Markdown 格式（必填）" },
        commitMsg: { type: "string", description: "可选：提交信息，如 '更新文章'" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "qexo_delete_post",
    description: "【Qexo】删除文章。当用户想删除博客文章时调用",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文章路径，如 source/_posts/my-article.md（必填）" },
      },
      required: ["path"],
    },
  },
  {
    name: "qexo_list_pages",
    description: "【Qexo】列出博客页面列表。当用户想查看博客页面时调用",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "可选：搜索关键词" },
      },
    },
  },
  {
    name: "qexo_blog_status",
    description: "【Qexo】获取博客状态信息，包括文章数量和最后更新时间。当用户想了解博客概况时调用",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "qexo_list_friends",
    description: "【Qexo】列出友链列表。当用户想查看博客的友情链接时调用",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "可选：搜索关键词" },
      },
    },
  },
  {
    name: "qexo_add_friend",
    description: "【Qexo】添加友链。当用户想添加友情链接时调用",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "友链名称（必填）" },
        url: { type: "string", description: "友链 URL（必填）" },
        image: { type: "string", description: "可选：头像 URL" },
        description: { type: "string", description: "可选：描述" },
        status: { type: "string", description: "可选：显示/隐藏，默认显示" },
      },
      required: ["name", "url"],
    },
  },
  {
    name: "qexo_edit_friend",
    description: "【Qexo】编辑友链。当用户想修改友链的名称、链接、描述等信息时调用",
    inputSchema: {
      type: "object",
      properties: {
        time: { type: "string", description: "友链 ID（必填，通过 qexo_list_friends 获取，该接口返回的 time 字段即 ID）" },
        name: { type: "string", description: "友链名称（必填）" },
        url: { type: "string", description: "友链 URL（必填）" },
        image: { type: "string", description: "可选：头像 URL" },
        description: { type: "string", description: "可选：描述" },
        status: { type: "string", description: "可选：显示/隐藏" },
      },
      required: ["time", "name", "url"],
    },
  },
  {
    name: "qexo_delete_friend",
    description: "【Qexo】删除友链。当用户想删除友情链接时调用",
    inputSchema: {
      type: "object",
      properties: {
        time: { type: "string", description: "友链 ID（必填，通过 qexo_list_friends 获取）" },
      },
      required: ["time"],
    },
  },
  {
    name: "qexo_list_talks",
    description: "【Qexo】列出说说列表。当用户想查看博客的说说/动态时调用",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "可选：页码，默认 1" },
        limit: { type: "number", description: "可选：每页条数，默认 10" },
      },
    },
  },
  {
    name: "qexo_save_talk",
    description: "【Qexo】发表或编辑说说/动态。当用户想发说说、发动态、修改说说时调用",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "说说内容（必填）" },
        id: { type: "string", description: "可选：说说 ID。传入则为编辑指定说说，否则新建" },
        tags: { type: "string", description: "可选：标签，JSON 数组格式，如 [\"生活\",\"随笔\"]" },
        values: { type: "string", description: "可选：自定义字段，JSON 格式" },
      },
      required: ["content"],
    },
  },
  {
    name: "qexo_delete_talk",
    description: "【Qexo】删除说说/动态。当用户想删除某条说说时调用",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "说说 ID（必填，通过 qexo_list_talks 获取）" },
      },
      required: ["id"],
    },
  },
  {
    name: "qexo_list_configs",
    description: "【Qexo】列出博客配置文件列表（如 _config.yml 等）。当用户想查看博客配置文件时调用",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "可选：搜索关键词" },
      },
    },
  },
  {
    name: "qexo_list_images",
    description: "【Qexo】列出图片列表。当用户想查看博客上传的图片时调用",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "可选：搜索关键词" },
      },
    },
  },
];

// 获取 MCP 配置
function getConfig(env: any, authToken?: string): QexoConfig {
  const baseUrl = (env.QEXO_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("QEXO_BASE_URL 未配置，请在 Cloudflare 环境变量中设置");
  // 优先使用请求头中的 Authorization: Bearer token，兼容环境变量 QEXO_API_TOKEN
  const token = authToken || env.QEXO_API_TOKEN || "";
  if (!token) throw new Error("缺少 API Key，请在 MCP 服务器的 API Key 字段填入 Qexo API Token");
  return { baseUrl, token };
}

// 通过博客的搜索索引查找并读取文章内容
// 支持多种引擎格式：Hexo / Hugo / Jekyll / Valaxy，按顺序尝试
const SEARCH_INDEX_PATHS = ["/local-search.xml", "/search.json", "/index.json"];

async function fetchBlogPostContent(blogUrl: string, postName: string): Promise<string | null> {
  const base = blogUrl.endsWith("/") ? blogUrl.slice(0, -1) : blogUrl;
  const escaped = postName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const titleRe = new RegExp(escaped, "i");

  for (const path of SEARCH_INDEX_PATHS) {
    try {
      const resp = await fetch(`${base}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const text = await resp.text();

      if (path.endsWith(".xml")) {
        // Hexo local-search.xml 格式
        const entries = text.split("</entry>");
        for (const entry of entries) {
          const titleMatch = entry.match(/<title>\s*([^<]+)\s*<\/title>/i);
          if (!titleMatch || !titleRe.test(titleMatch[1])) continue;
          const contentMatch = entry.match(/<content[^>]*>([\s\S]*)<\/content>/i);
          if (contentMatch) return cleanHtml(contentMatch[1]);
          // 内容为空时通过 URL 抓取
          const urlMatch = entry.match(/<url>([^<]+)<\/url>/i);
          if (urlMatch) {
            const articleUrl = urlMatch[1].startsWith("http") ? urlMatch[1] : `${base}${urlMatch[1]}`;
            return await fetchArticleContent(articleUrl);
          }
        }
      } else {
        // JSON 格式（Hugo / Jekyll / Valaxy）
        try {
          const data = JSON.parse(text);
          const items = Array.isArray(data) ? data : (data.posts || data.pages || data.items || []);
          for (const item of items) {
            const title = item.title || "";
            if (!titleRe.test(title)) continue;
            const content = item.content || item.body || item.text || item.description || "";
            if (content) return cleanHtml(content);
            // 通过 URL 抓取
            if (item.url || item.link || item.permalink) {
              const url = item.url || item.link || item.permalink;
              const articleUrl = url.startsWith("http") ? url : `${base}${url.startsWith("/") ? url : "/" + url}`;
              return await fetchArticleContent(articleUrl);
            }
          }
        } catch {}
      }
    } catch {}
  }
  return null;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, "")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ").trim();
}

// 抓取文章页面并提取纯文本
async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    // 提取文章正文：找 <article> 或 post-content 容器
    let content = "";
    const articleMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
    if (articleMatch) {
      content = articleMatch[0];
    } else {
      // 兜底：找 class 包含 post 或 content 的 div
      const divMatch = html.match(/<div[^>]*(?:post|content|article)[^>]*>[\s\S]*?<\/div>/i);
      if (divMatch) content = divMatch[0];
      else content = html;
    }
    // 去 HTML 标签
    return content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, "")
      .replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

// 格式化时间：支持 Unix 秒级时间戳或已格式化的日期字符串
function formatTime(t: string | number | undefined): string {
  if (!t) return "未知";
  const n = Number(t);
  // 10位或13位数字视为 Unix 时间戳
  if (/^\d{10}$/.test(String(t)) || /^\d{13}$/.test(String(t))) {
    const d = new Date(n * (String(t).length === 10 ? 1000 : 1));
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return String(t);
}

async function executeTool(toolName: string, args: Record<string, any>, env: any, authToken?: string): Promise<string> {
  const cfg = getConfig(env, authToken);
  const blogUrl = (env.BLOG_PUBLIC_URL || "").trim().replace(/\/+$/, "");

  switch (toolName) {
    case "qexo_list_posts": {
      const posts = await listPosts(cfg, args.keyword);
      if (posts.length === 0) return "没有找到文章";
      return posts.map((p, i) =>
        `${i + 1}. ${p.name}\n   路径: ${p.path}\n   大小: ${p.size} 字节\n   日期: ${p.date}`
      ).join("\n\n");
    }

    case "qexo_get_post": {
      const posts = await listPosts(cfg);
      // 支持按 name 或 path 查找
      const searchName = (args.name || "").trim();
      const searchPath = (args.path || "").trim();
      let post;
      if (searchPath) {
        post = posts.find(p => p.path === searchPath || p.fullname === searchPath);
      } else if (searchName) {
        post = posts.find(p => p.name === searchName || p.name.includes(searchName));
      } else {
        return "请提供文章名（name）或路径（path）";
      }
      if (!post) {
        const hint = searchName || searchPath;
        return `未找到文章${hint ? `: ${hint}` : ""}\n可用文章列表请调用 qexo_list_posts 查看`;
      }
      // 如果配置了 BLOG_PUBLIC_URL，尝试从博客读取文章内容
      if (blogUrl) {
        const content = await fetchBlogPostContent(blogUrl, post.name);
        if (content) return `📄 ${post.name}\n路径: ${post.path}\n\n${content.slice(0, 8000)}`;
      }
      return `文章路径: ${post.path}\n文件名: ${post.name}\n大小: ${post.size} 字节\n最后更新: ${post.date}\n\n（未配置 BLOG_PUBLIC_URL，无法读取文章内容）`;
    }

    case "qexo_save_post": {
      const result = await saveFile(cfg, args.path, args.content, args.commitMsg);
      return `✅ ${result}\n路径: ${args.path}`;
    }

    case "qexo_delete_post": {
      const result = await deleteFile(cfg, args.path);
      return `✅ ${result}`;
    }

    case "qexo_list_pages": {
      const pages = await listPages(cfg, args.keyword);
      if (pages.length === 0) return "没有找到页面";
      return pages.map((p, i) =>
        `${i + 1}. ${p.name}\n   路径: ${p.path}\n   日期: ${p.date}`
      ).join("\n\n");
    }

    case "qexo_blog_status": {
      const status = await getBlogStatus(cfg);
      return `📊 博客状态\n文章数量: ${status.posts} 篇\n最后更新: ${formatTime(status.last)}`;
    }

    case "qexo_list_friends": {
      const friends = await listFriends(cfg, args.keyword);
      if (friends.length === 0) return "没有找到友链";
      return friends.map((f, i) =>
        `${i + 1}. ${f.name}\n   链接: ${f.url}\n   ${f.description || ""}${f.status ? `\n   状态: ${f.status}` : ""}`
      ).join("\n\n");
    }

    case "qexo_add_friend": {
      const result = await addFriend(cfg, args as any);
      return `✅ ${result}`;
    }

    case "qexo_edit_friend": {
      const result = await editFriend(cfg, args as any);
      return `✅ ${result}`;
    }

    case "qexo_delete_friend": {
      const result = await deleteFriend(cfg, args.time);
      return `✅ ${result}`;
    }

    case "qexo_list_talks": {
      const { talks, count } = await listTalks(cfg, args.page || 1, args.limit || 10);
      if (talks.length === 0) return "没有找到说说";
      return `共有 ${count} 条说说，显示第 ${args.page || 1} 页：\n\n` +
        talks.map((t, i) =>
          `${i + 1}. ${t.content.slice(0, 200)}${t.content.length > 200 ? "..." : ""}\n   时间: ${formatTime(t.time)}${t.like ? ` | 👍 ${t.like}` : ""}`
        ).join("\n\n");
    }

    case "qexo_save_talk": {
      const result = await saveTalk(cfg, args as any);
      return `✅ ${result.msg}${result.id ? `\nID: ${result.id}` : ""}`;
    }

    case "qexo_delete_talk": {
      const result = await deleteTalk(cfg, args.id);
      return `✅ ${result}`;
    }

    case "qexo_list_configs": {
      const configs = await listConfigs(cfg, args.keyword);
      if (configs.length === 0) return "没有找到配置文件";
      return configs.map((c, i) =>
        `${i + 1}. ${c.name}\n   路径: ${c.path}\n   日期: ${c.date}`
      ).join("\n\n");
    }

    case "qexo_list_images": {
      const images = await listImages(cfg, args.keyword);
      if (images.length === 0) return "没有找到图片";
      return images.map((img, i) =>
        `${i + 1}. ${img.name}\n   大小: ${img.size}\n   链接: ${img.url}\n   日期: ${img.date}`
      ).join("\n\n");
    }

    default:
      throw new Error(`未知工具: ${toolName}`);
  }
}

// ========== MCP 协议处理 ==========

// 处理 MCP tools/list 请求
function handleToolsList(): any {
  return { tools: TOOLS };
}

// 处理 MCP tools/call 请求
async function handleToolsCall(params: any, env: any, authToken?: string): Promise<any> {
  const toolName = params?.name;
  const args = params?.arguments || {};

  if (!toolName) {
    return { content: [{ type: "text", text: "缺少 tool name" }], isError: true };
  }

  try {
    const text = await executeTool(toolName, args, env, authToken);
    return { content: [{ type: "text", text }] };
  } catch (e: any) {
    return { content: [{ type: "text", text: `错误: ${e?.message || String(e)}` }], isError: true };
  }
}

// MCP initialize 握手
function handleInitialize(params: any): any {
  return {
    protocolVersion: params?.protocolVersion || "2025-06-18",
    capabilities: { tools: { listChanged: false } },
    serverInfo: { name: "qexo-mcp-proxy", version: "1.0.0" },
  };
}

// 分发 JSON-RPC 请求
async function handleJSONRPC(body: any, env: any, authToken?: string): Promise<any> {
  const method = body?.method;
  const id = body?.id;
  const params = body?.params;

  // JSON-RPC 通知（无 id）不返回响应
  if (id === undefined) return null;

  try {
    let result: any;
    if (method === "initialize") {
      result = handleInitialize(params);
    } else if (method === "ping") {
      result = {};
    } else if (method === "tools/list") {
      result = handleToolsList();
    } else if (method === "tools/call") {
      result = await handleToolsCall(params, env, authToken);
    } else {
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `方法 '${method}' 不支持` } };
    }
    return { jsonrpc: "2.0", id, result };
  } catch (e: any) {
    return { jsonrpc: "2.0", id, error: { code: -32603, message: e?.message || "内部错误" } };
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === "/health" || url.pathname === "/healthz") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // MCP Streamable HTTP: GET 建立 SSE 事件流（用于接收服务器推送）
    if (request.method === "GET") {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      // 发送初始连接确认后保持流打开
      writer.write(encoder.encode(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/message", params: { level: "info", data: "connected" } })}\n\n`));
      // Worker 会保持连接直到客户端断开；定期心跳防止代理中断
      const heartbeat = setInterval(() => {
        writer.write(encoder.encode(": keep-alive\n\n")).catch(() => {});
      }, 15000);
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        writer.close().catch(() => {});
      });
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // MCP Streamable HTTP: DELETE 结束会话
    if (request.method === "DELETE") {
      return new Response(null, { status: 200 });
    }

    // 只接受 POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 从 Authorization 头提取 API Key（与 EdgeEver/BeeCount 等 MCP 服务器一致）
    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    // 解析请求体
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: invalid JSON" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 处理 JSON-RPC 请求
    const response = await handleJSONRPC(body, env, authToken);
    // JSON-RPC 通知：202 Accepted，无响应体
    if (response === null) {
      return new Response(null, { status: 202 });
    }
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  },
};