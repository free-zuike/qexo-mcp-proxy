// Qexo REST API 客户端
// 封装 Qexo Public API 的 HTTP 调用

export interface QexoConfig {
  baseUrl: string;
  token: string;
}

// 文章元信息
export interface QexoPost {
  name: string;
  path: string;
  fullname: string;
  size: number;
  date: string;
}

// 友链
export interface QexoFriend {
  name: string;
  url: string;
  image?: string;
  description?: string;
  time: string;
  status?: boolean | string;
}

// 说说
export interface QexoTalk {
  id: string;
  content: string;
  time: string;
  tags?: string[];
  like?: number;
  liked?: boolean;
  values?: Record<string, any>;
}

// 图片
export interface QexoImage {
  name: string;
  size: string;
  url: string;
  date: string;
  time: string;
}

// 博客状态
export interface QexoStatus {
  posts: string;
  last: string;
}

// 通用 API 响应
interface QexoResponse<T = any> {
  status: boolean;
  msg?: string;
  id?: string;
  data?: T;
  posts?: QexoPost[];
  pages?: QexoPost[];
  images?: QexoImage[];
  friends?: QexoFriend[];
  count?: number;
}

// 发送 GET 请求到 Qexo API（Django 需要 URL 以 / 结尾）
async function get<T>(cfg: QexoConfig, path: string, params?: Record<string, string | undefined>): Promise<QexoResponse<T>> {
  const url = new URL(`${cfg.baseUrl}/pub/${path}${path.endsWith("/") ? "" : "/"}`);
  url.searchParams.set("token", cfg.token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }
  const fullUrl = url.toString();
  const resp = await fetch(fullUrl, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Qexo API ${resp.status}: ${text.slice(0, 200)}`);
  }
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("json")) {
    throw new Error(`Qexo 返回了非 JSON 数据 (Content-Type: ${ct})，请检查 QEXO_BASE_URL 是否正确。请求地址: ${fullUrl.replace(cfg.token, "***")}`);
  }
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`Qexo 返回的数据无法解析为 JSON: ${text.slice(0, 200)}`);
  }
}

// 发送 POST 请求到 Qexo API（form 格式，Django 需要 URL 以 / 结尾）
async function postForm<T>(cfg: QexoConfig, path: string, data: Record<string, any>): Promise<QexoResponse<T>> {
  const body = new URLSearchParams();
  body.set("token", cfg.token);
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) body.set(k, String(v));
  }
  const pathSlash = `${path}${path.endsWith("/") ? "" : "/"}`;
  const fullUrl = `${cfg.baseUrl}/pub/${pathSlash}`;
  const resp = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Qexo API ${resp.status}: ${text.slice(0, 200)}`);
  }
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("json")) {
    throw new Error(`Qexo 返回了非 JSON 数据 (Content-Type: ${ct})，请检查 QEXO_BASE_URL 是否正确。请求地址: ${fullUrl}`);
  }
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`Qexo 返回的数据无法解析为 JSON: ${text.slice(0, 200)}`);
  }
}

// ========== 博客内容管理 ==========

/** 获取文章列表 */
export async function listPosts(cfg: QexoConfig, keyword?: string): Promise<QexoPost[]> {
  const res = await get(cfg, "get_posts", { s: keyword });
  if (!res.status) throw new Error(res.msg || "获取文章列表失败");
  return res.posts || [];
}

/** 获取页面列表 */
export async function listPages(cfg: QexoConfig, keyword?: string): Promise<QexoPost[]> {
  const res = await get(cfg, "get_pages", { s: keyword });
  if (!res.status) throw new Error(res.msg || "获取页面列表失败");
  return res.pages || [];
}

/** 保存/更新文件内容 */
export async function saveFile(cfg: QexoConfig, filePath: string, content: string, commitMsg?: string): Promise<string> {
  const res = await postForm(cfg, "save", { file: filePath, content, commitchange: commitMsg || "" });
  if (!res.status) throw new Error(res.msg || "保存失败");
  return res.msg || "保存成功";
}

/** 删除文件 */
export async function deleteFile(cfg: QexoConfig, filePath: string, commitMsg?: string): Promise<string> {
  const res = await postForm(cfg, "delete", { file: filePath, commitchange: commitMsg || "" });
  if (!res.status) throw new Error(res.msg || "删除失败");
  return res.msg || "删除成功";
}

// ========== 友链管理 ==========

/** 获取友链列表（全部，含隐藏） */
export async function listFriends(cfg: QexoConfig, keyword?: string): Promise<QexoFriend[]> {
  const res = await get(cfg, "get_friends", { s: keyword });
  if (!res.status) throw new Error(res.msg || "获取友链列表失败");
  return (res.data as QexoFriend[]) || [];
}

/** 添加友链 */
export async function addFriend(cfg: QexoConfig, data: { name: string; url: string; image?: string; description?: string; status?: string }): Promise<string> {
  const res = await postForm(cfg, "add_friend", data);
  if (!res.status) throw new Error(res.msg || "添加友链失败");
  return res.msg || "添加成功";
}

/** 删除友链 */
export async function deleteFriend(cfg: QexoConfig, time: string): Promise<string> {
  const res = await postForm(cfg, "del_friend", { time });
  if (!res.status) throw new Error(res.msg || "删除友链失败");
  return res.msg || "删除成功";
}

// ========== 说说管理 ==========

/** 获取说说列表（公开，分页） */
export async function listTalks(cfg: QexoConfig, page = 1, limit = 10): Promise<{ talks: QexoTalk[]; count: number }> {
  const res = await get(cfg, "talks", { page: String(page), limit: String(limit) });
  if (!res.status) throw new Error(res.msg || "获取说说列表失败");
  return { talks: (res.data as QexoTalk[]) || [], count: res.count || 0 };
}

/** 保存说说 */
export async function saveTalk(cfg: QexoConfig, data: { content: string; id?: string; tags?: string; values?: string }): Promise<any> {
  const res = await postForm(cfg, "save_talk", data);
  if (!res.status) throw new Error(res.msg || "保存说说失败");
  return { msg: res.msg, id: res.id };
}

/** 删除说说 */
export async function deleteTalk(cfg: QexoConfig, id: string): Promise<string> {
  const res = await postForm(cfg, "del_talk", { id });
  if (!res.status) throw new Error(res.msg || "删除说说失败");
  return res.msg || "删除成功";
}

// ========== 状态 ==========

/** 获取博客状态 */
export async function getBlogStatus(cfg: QexoConfig): Promise<QexoStatus> {
  const res = await get(cfg, "status");
  if (!res.status) throw new Error(res.msg || "获取状态失败");
  return (res.data as QexoStatus) || { posts: "0", last: "" };
}

// ========== 图片管理 ==========

/** 获取图片列表 */
export async function listImages(cfg: QexoConfig, keyword?: string): Promise<QexoImage[]> {
  const res = await get(cfg, "get_images", { s: keyword });
  if (!res.status) throw new Error(res.msg || "获取图片列表失败");
  return res.images || [];
}