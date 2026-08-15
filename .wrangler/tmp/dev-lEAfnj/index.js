var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-XpUjW3/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/qexo-api.ts
async function get(cfg, path, params) {
  const url = new URL(`${cfg.baseUrl}/pub/${path}`);
  url.searchParams.set("token", cfg.token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== void 0)
        url.searchParams.set(k, v);
    }
  }
  const fullUrl = url.toString();
  const resp = await fetch(fullUrl, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(15e3)
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Qexo API ${resp.status}: ${text.slice(0, 200)}`);
  }
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("json")) {
    throw new Error(`Qexo \u8FD4\u56DE\u4E86\u975E JSON \u6570\u636E (Content-Type: ${ct})\uFF0C\u8BF7\u68C0\u67E5 QEXO_BASE_URL \u662F\u5426\u6B63\u786E\u3002\u8BF7\u6C42\u5730\u5740: ${fullUrl.replace(cfg.token, "***")}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Qexo \u8FD4\u56DE\u7684\u6570\u636E\u65E0\u6CD5\u89E3\u6790\u4E3A JSON: ${text.slice(0, 200)}`);
  }
}
__name(get, "get");
async function postForm(cfg, path, data) {
  const body = new URLSearchParams();
  body.set("token", cfg.token);
  for (const [k, v] of Object.entries(data)) {
    if (v !== void 0 && v !== null)
      body.set(k, String(v));
  }
  const fullUrl = `${cfg.baseUrl}/pub/${path}`;
  const resp = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(15e3)
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Qexo API ${resp.status}: ${text.slice(0, 200)}`);
  }
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("json")) {
    throw new Error(`Qexo \u8FD4\u56DE\u4E86\u975E JSON \u6570\u636E (Content-Type: ${ct})\uFF0C\u8BF7\u68C0\u67E5 QEXO_BASE_URL \u662F\u5426\u6B63\u786E\u3002\u8BF7\u6C42\u5730\u5740: ${fullUrl}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Qexo \u8FD4\u56DE\u7684\u6570\u636E\u65E0\u6CD5\u89E3\u6790\u4E3A JSON: ${text.slice(0, 200)}`);
  }
}
__name(postForm, "postForm");
async function listPosts(cfg, keyword) {
  const res = await get(cfg, "get_posts", { s: keyword });
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u6587\u7AE0\u5217\u8868\u5931\u8D25");
  return res.posts || [];
}
__name(listPosts, "listPosts");
async function listPages(cfg, keyword) {
  const res = await get(cfg, "get_pages", { s: keyword });
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u9875\u9762\u5217\u8868\u5931\u8D25");
  return res.pages || [];
}
__name(listPages, "listPages");
async function saveFile(cfg, filePath, content, commitMsg) {
  const res = await postForm(cfg, "save", { file: filePath, content, commitchange: commitMsg || "" });
  if (!res.status)
    throw new Error(res.msg || "\u4FDD\u5B58\u5931\u8D25");
  return res.msg || "\u4FDD\u5B58\u6210\u529F";
}
__name(saveFile, "saveFile");
async function deleteFile(cfg, filePath, commitMsg) {
  const res = await postForm(cfg, "delete", { file: filePath, commitchange: commitMsg || "" });
  if (!res.status)
    throw new Error(res.msg || "\u5220\u9664\u5931\u8D25");
  return res.msg || "\u5220\u9664\u6210\u529F";
}
__name(deleteFile, "deleteFile");
async function listFriends(cfg, keyword) {
  const res = await get(cfg, "get_friends", { s: keyword });
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u53CB\u94FE\u5217\u8868\u5931\u8D25");
  return res.data || [];
}
__name(listFriends, "listFriends");
async function addFriend(cfg, data) {
  const res = await postForm(cfg, "add_friend", data);
  if (!res.status)
    throw new Error(res.msg || "\u6DFB\u52A0\u53CB\u94FE\u5931\u8D25");
  return res.msg || "\u6DFB\u52A0\u6210\u529F";
}
__name(addFriend, "addFriend");
async function listTalks(cfg, page = 1, limit = 10) {
  const res = await get(cfg, "talks", { page: String(page), limit: String(limit) });
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u8BF4\u8BF4\u5217\u8868\u5931\u8D25");
  return { talks: res.data || [], count: res.count || 0 };
}
__name(listTalks, "listTalks");
async function saveTalk(cfg, data) {
  const res = await postForm(cfg, "save_talk", data);
  if (!res.status)
    throw new Error(res.msg || "\u4FDD\u5B58\u8BF4\u8BF4\u5931\u8D25");
  return { msg: res.msg, id: res.id };
}
__name(saveTalk, "saveTalk");
async function getBlogStatus(cfg) {
  const res = await get(cfg, "status");
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u72B6\u6001\u5931\u8D25");
  return res.data || { posts: "0", last: "" };
}
__name(getBlogStatus, "getBlogStatus");
async function listImages(cfg, keyword) {
  const res = await get(cfg, "get_images", { s: keyword });
  if (!res.status)
    throw new Error(res.msg || "\u83B7\u53D6\u56FE\u7247\u5217\u8868\u5931\u8D25");
  return res.images || [];
}
__name(listImages, "listImages");

// src/index.ts
var TOOLS = [
  {
    name: "qexo_list_posts",
    description: "\u3010Qexo\u3011\u5217\u51FA\u535A\u5BA2\u6587\u7AE0\u5217\u8868\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u535A\u5BA2\u6587\u7AE0\u3001\u5217\u51FA\u6587\u7AE0\u3001\u67E5\u770B\u6587\u7AE0\u5217\u8868\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "\u53EF\u9009\uFF1A\u641C\u7D22\u5173\u952E\u8BCD\uFF0C\u6309\u6807\u9898\u8FC7\u6EE4" }
      }
    }
  },
  {
    name: "qexo_get_post",
    description: "\u3010Qexo\u3011\u83B7\u53D6\u5355\u7BC7\u6587\u7AE0\u7684\u5B8C\u6574\u5185\u5BB9\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u67D0\u7BC7\u6587\u7AE0\u7684\u8BE6\u7EC6\u5185\u5BB9\u3001\u9605\u8BFB\u6587\u7AE0\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "\u6587\u7AE0\u8DEF\u5F84\uFF0C\u5982 source/_posts/my-article.md\uFF08\u5FC5\u586B\uFF09" }
      },
      required: ["path"]
    }
  },
  {
    name: "qexo_save_post",
    description: "\u3010Qexo\u3011\u4FDD\u5B58/\u66F4\u65B0\u6587\u7AE0\u3002\u5F53\u7528\u6237\u60F3\u5199\u6587\u7AE0\u3001\u66F4\u65B0\u6587\u7AE0\u3001\u4FEE\u6539\u6587\u7AE0\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "\u6587\u7AE0\u8DEF\u5F84\uFF0C\u5982 source/_posts/my-article.md\uFF08\u5FC5\u586B\uFF09" },
        content: { type: "string", description: "\u6587\u7AE0\u5185\u5BB9\uFF0CMarkdown \u683C\u5F0F\uFF08\u5FC5\u586B\uFF09" },
        commitMsg: { type: "string", description: "\u53EF\u9009\uFF1A\u63D0\u4EA4\u4FE1\u606F\uFF0C\u5982 '\u66F4\u65B0\u6587\u7AE0'" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "qexo_delete_post",
    description: "\u3010Qexo\u3011\u5220\u9664\u6587\u7AE0\u3002\u5F53\u7528\u6237\u60F3\u5220\u9664\u535A\u5BA2\u6587\u7AE0\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "\u6587\u7AE0\u8DEF\u5F84\uFF0C\u5982 source/_posts/my-article.md\uFF08\u5FC5\u586B\uFF09" }
      },
      required: ["path"]
    }
  },
  {
    name: "qexo_list_pages",
    description: "\u3010Qexo\u3011\u5217\u51FA\u535A\u5BA2\u9875\u9762\u5217\u8868\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u535A\u5BA2\u9875\u9762\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "\u53EF\u9009\uFF1A\u641C\u7D22\u5173\u952E\u8BCD" }
      }
    }
  },
  {
    name: "qexo_blog_status",
    description: "\u3010Qexo\u3011\u83B7\u53D6\u535A\u5BA2\u72B6\u6001\u4FE1\u606F\uFF0C\u5305\u62EC\u6587\u7AE0\u6570\u91CF\u548C\u6700\u540E\u66F4\u65B0\u65F6\u95F4\u3002\u5F53\u7528\u6237\u60F3\u4E86\u89E3\u535A\u5BA2\u6982\u51B5\u65F6\u8C03\u7528",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "qexo_list_friends",
    description: "\u3010Qexo\u3011\u5217\u51FA\u53CB\u94FE\u5217\u8868\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u535A\u5BA2\u7684\u53CB\u60C5\u94FE\u63A5\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "\u53EF\u9009\uFF1A\u641C\u7D22\u5173\u952E\u8BCD" }
      }
    }
  },
  {
    name: "qexo_add_friend",
    description: "\u3010Qexo\u3011\u6DFB\u52A0\u53CB\u94FE\u3002\u5F53\u7528\u6237\u60F3\u6DFB\u52A0\u53CB\u60C5\u94FE\u63A5\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "\u53CB\u94FE\u540D\u79F0\uFF08\u5FC5\u586B\uFF09" },
        url: { type: "string", description: "\u53CB\u94FE URL\uFF08\u5FC5\u586B\uFF09" },
        image: { type: "string", description: "\u53EF\u9009\uFF1A\u5934\u50CF URL" },
        description: { type: "string", description: "\u53EF\u9009\uFF1A\u63CF\u8FF0" },
        status: { type: "string", description: "\u53EF\u9009\uFF1A\u663E\u793A/\u9690\u85CF\uFF0C\u9ED8\u8BA4\u663E\u793A" }
      },
      required: ["name", "url"]
    }
  },
  {
    name: "qexo_list_talks",
    description: "\u3010Qexo\u3011\u5217\u51FA\u8BF4\u8BF4\u5217\u8868\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u535A\u5BA2\u7684\u8BF4\u8BF4/\u52A8\u6001\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "\u53EF\u9009\uFF1A\u9875\u7801\uFF0C\u9ED8\u8BA4 1" },
        limit: { type: "number", description: "\u53EF\u9009\uFF1A\u6BCF\u9875\u6761\u6570\uFF0C\u9ED8\u8BA4 10" }
      }
    }
  },
  {
    name: "qexo_save_talk",
    description: "\u3010Qexo\u3011\u53D1\u8868\u8BF4\u8BF4/\u52A8\u6001\u3002\u5F53\u7528\u6237\u60F3\u53D1\u8BF4\u8BF4\u3001\u53D1\u52A8\u6001\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "\u8BF4\u8BF4\u5185\u5BB9\uFF08\u5FC5\u586B\uFF09" },
        tags: { type: "string", description: '\u53EF\u9009\uFF1A\u6807\u7B7E\uFF0CJSON \u6570\u7EC4\u683C\u5F0F\uFF0C\u5982 ["\u751F\u6D3B","\u968F\u7B14"]' },
        values: { type: "string", description: "\u53EF\u9009\uFF1A\u81EA\u5B9A\u4E49\u5B57\u6BB5\uFF0CJSON \u683C\u5F0F" }
      },
      required: ["content"]
    }
  },
  {
    name: "qexo_list_images",
    description: "\u3010Qexo\u3011\u5217\u51FA\u56FE\u7247\u5217\u8868\u3002\u5F53\u7528\u6237\u60F3\u67E5\u770B\u535A\u5BA2\u4E0A\u4F20\u7684\u56FE\u7247\u65F6\u8C03\u7528",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "\u53EF\u9009\uFF1A\u641C\u7D22\u5173\u952E\u8BCD" }
      }
    }
  }
];
function getConfig(env, authToken) {
  const baseUrl = (env.QEXO_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl)
    throw new Error("QEXO_BASE_URL \u672A\u914D\u7F6E\uFF0C\u8BF7\u5728 Cloudflare \u73AF\u5883\u53D8\u91CF\u4E2D\u8BBE\u7F6E");
  const token = authToken || env.QEXO_API_TOKEN || "";
  if (!token)
    throw new Error("\u7F3A\u5C11 API Key\uFF0C\u8BF7\u5728 MCP \u670D\u52A1\u5668\u7684 API Key \u5B57\u6BB5\u586B\u5165 Qexo API Token");
  return { baseUrl, token };
}
__name(getConfig, "getConfig");
async function executeTool(toolName, args, env, authToken) {
  const cfg = getConfig(env, authToken);
  switch (toolName) {
    case "qexo_list_posts": {
      const posts = await listPosts(cfg, args.keyword);
      if (posts.length === 0)
        return "\u6CA1\u6709\u627E\u5230\u6587\u7AE0";
      return posts.map(
        (p, i) => `${i + 1}. ${p.name}
   \u8DEF\u5F84: ${p.path}
   \u5927\u5C0F: ${p.size} \u5B57\u8282
   \u65E5\u671F: ${p.date}`
      ).join("\n\n");
    }
    case "qexo_get_post": {
      const posts = await listPosts(cfg);
      const post = posts.find((p) => p.path === args.path || p.fullname === args.path);
      if (!post)
        return `\u672A\u627E\u5230\u6587\u7AE0: ${args.path}
\u53EF\u7528\u6587\u7AE0\u5217\u8868\u8BF7\u8C03\u7528 qexo_list_posts \u67E5\u770B`;
      return `\u6587\u7AE0\u8DEF\u5F84: ${post.path}
\u6587\u4EF6\u540D: ${post.name}
\u5927\u5C0F: ${post.size} \u5B57\u8282
\u6700\u540E\u66F4\u65B0: ${post.date}

\u6CE8\u610F\uFF1AQexo API \u4E0D\u652F\u6301\u76F4\u63A5\u8BFB\u53D6\u6587\u4EF6\u5185\u5BB9\uFF0C\u5982\u9700\u7F16\u8F91\u8BF7\u4F7F\u7528 qexo_save_post \u5DE5\u5177\u4F20\u5165\u5B8C\u6574\u5185\u5BB9\u3002`;
    }
    case "qexo_save_post": {
      const result = await saveFile(cfg, args.path, args.content, args.commitMsg);
      return `\u2705 ${result}
\u8DEF\u5F84: ${args.path}`;
    }
    case "qexo_delete_post": {
      const result = await deleteFile(cfg, args.path);
      return `\u2705 ${result}`;
    }
    case "qexo_list_pages": {
      const pages = await listPages(cfg, args.keyword);
      if (pages.length === 0)
        return "\u6CA1\u6709\u627E\u5230\u9875\u9762";
      return pages.map(
        (p, i) => `${i + 1}. ${p.name}
   \u8DEF\u5F84: ${p.path}
   \u65E5\u671F: ${p.date}`
      ).join("\n\n");
    }
    case "qexo_blog_status": {
      const status = await getBlogStatus(cfg);
      return `\u{1F4CA} \u535A\u5BA2\u72B6\u6001
\u6587\u7AE0\u6570\u91CF: ${status.posts} \u7BC7
\u6700\u540E\u66F4\u65B0: ${status.last || "\u672A\u77E5"}`;
    }
    case "qexo_list_friends": {
      const friends = await listFriends(cfg, args.keyword);
      if (friends.length === 0)
        return "\u6CA1\u6709\u627E\u5230\u53CB\u94FE";
      return friends.map(
        (f, i) => `${i + 1}. ${f.name}
   \u94FE\u63A5: ${f.url}
   ${f.description || ""}${f.status ? `
   \u72B6\u6001: ${f.status}` : ""}`
      ).join("\n\n");
    }
    case "qexo_add_friend": {
      const result = await addFriend(cfg, args);
      return `\u2705 ${result}`;
    }
    case "qexo_list_talks": {
      const { talks, count } = await listTalks(cfg, args.page || 1, args.limit || 10);
      if (talks.length === 0)
        return "\u6CA1\u6709\u627E\u5230\u8BF4\u8BF4";
      return `\u5171\u6709 ${count} \u6761\u8BF4\u8BF4\uFF0C\u663E\u793A\u7B2C ${args.page || 1} \u9875\uFF1A

` + talks.map(
        (t, i) => `${i + 1}. ${t.content.slice(0, 200)}${t.content.length > 200 ? "..." : ""}
   \u65F6\u95F4: ${t.time}${t.like ? ` | \u{1F44D} ${t.like}` : ""}`
      ).join("\n\n");
    }
    case "qexo_save_talk": {
      const result = await saveTalk(cfg, args);
      return `\u2705 ${result.msg}${result.id ? `
ID: ${result.id}` : ""}`;
    }
    case "qexo_list_images": {
      const images = await listImages(cfg, args.keyword);
      if (images.length === 0)
        return "\u6CA1\u6709\u627E\u5230\u56FE\u7247";
      return images.map(
        (img, i) => `${i + 1}. ${img.name}
   \u5927\u5C0F: ${img.size}
   \u94FE\u63A5: ${img.url}
   \u65E5\u671F: ${img.date}`
      ).join("\n\n");
    }
    default:
      throw new Error(`\u672A\u77E5\u5DE5\u5177: ${toolName}`);
  }
}
__name(executeTool, "executeTool");
function handleToolsList() {
  return { tools: TOOLS };
}
__name(handleToolsList, "handleToolsList");
async function handleToolsCall(params, env, authToken) {
  const toolName = params?.name;
  const args = params?.arguments || {};
  if (!toolName) {
    return { content: [{ type: "text", text: "\u7F3A\u5C11 tool name" }], isError: true };
  }
  try {
    const text = await executeTool(toolName, args, env, authToken);
    return { content: [{ type: "text", text }] };
  } catch (e) {
    return { content: [{ type: "text", text: `\u9519\u8BEF: ${e?.message || String(e)}` }], isError: true };
  }
}
__name(handleToolsCall, "handleToolsCall");
async function handleJSONRPC(body, env, authToken) {
  const method = body?.method;
  const id = body?.id ?? 1;
  const params = body?.params;
  try {
    let result;
    if (method === "tools/list") {
      result = handleToolsList();
    } else if (method === "tools/call") {
      result = await handleToolsCall(params, env, authToken);
    } else {
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `\u65B9\u6CD5 '${method}' \u4E0D\u652F\u6301` } };
    }
    return { jsonrpc: "2.0", id, result };
  } catch (e) {
    return { jsonrpc: "2.0", id, error: { code: -32603, message: e?.message || "\u5185\u90E8\u9519\u8BEF" } };
  }
}
__name(handleJSONRPC, "handleJSONRPC");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/healthz") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }
    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: invalid JSON" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const response = await handleJSONRPC(body, env, authToken);
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-XpUjW3/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-XpUjW3/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
