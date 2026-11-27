# 搜索与 AI 引用：现状和后续工作

检查日期：2026-11-27。站点：<https://botc.letshare.fun/>。

## 当前能确认的情况

- 修改前，线上站点地图中的 `/repo` 和 `/changelog` 实际返回 404；应用使用的是带 `#` 的路由。
- 修改前，生成的剧本页立即跳转到带片段的应用路由，并把该路由设为 canonical；而旧的按剧本名称查找逻辑只认识少数英文名称，不能可靠打开目录中的剧本。
- 修改前，各语言的 hreflang 指向同一个地址。首页的结构化数据还包含读者无法在页面看到的 FAQ 与 HowTo，以及缺少可核实来源的统计和结论。
- 仓库的英文和中文 README 仍有缺少可靠出处的比例、用时及“零服务器上传”等表述，需要单独核实和修订；本次未改动原有 README。
- 当前没有读取到此站点的 Google Search Console、Bing Webmaster Tools 或 GA4 报表，因此无法确认收录量、搜索排名、自然搜索流量或 AI 引用率。搜索工具的结果顺序和相关性分数不能当作 Google 排名或真实点击量。

## 已实施的改进

1. 为每个剧本生成可阅读的静态详情页，包含实际的剧本资料、角色列表、JSON 与预览入口；页面使用自身的 canonical，不再自动跳转。预览入口通过对应 JSON 地址加载剧本。
2. 增加可抓取的剧本目录，以及各自有实际内容和 URL 的中文、西班牙语介绍页。首页、语言页和目录之间提供可发现的链接。
3. 站点地图只列出生成的有效页面；多语言页面使用相互一致的 hreflang。首页的运行时 canonical 不再带片段。
4. 使用可核实的功能描述，移除没有页面内容支撑的 FAQ/HowTo 结构化数据及无来源的数字。保留的结构化数据描述产品与实际页面。
5. 明确允许 `OAI-SearchBot` 抓取；保留 `llms.txt` 作为可读的辅助目录，不把它当作收录或引用的保证。
6. 静态落地页加载已有的 GA4 标记，以便记录落地访问；应用初始化 Web Vitals。没有额外启用手动 SPA 页面浏览事件，避免在 GA4 增强型衡量已开启时重复计数。
7. 构建检查验证站点地图、页面 canonical、剧本预览指向的 JSON、语言链接和结构化数据。

## 需要账号数据才能判断的问题

- 在 Search Console 确认站点所有权和索引状态，提交 `https://botc.letshare.fun/sitemap.xml`，检查首页、中文介绍页、目录和几个剧本页的抓取与索引情况。
- 对比最近 28 天与前 28 天的自然搜索点击、展现、点击率和查询词；同时按落地页和国家或地区查看。区分品牌词和非品牌词，样本较小时避免根据少量点击判断趋势。
- 在 GA4 对比自然搜索和引荐流量的落地页、互动及剧本生成/导出事件；用 DebugView 核验页面浏览和关键事件，确认没有重复计数。
- 在 GA4 中查看来源为 `chatgpt.com` 的会话和落地页。它只能反映可归因的访问，不能代表所有 AI 引用、展示或回答中的提及。
- 如有 Bing Webmaster Tools，提交同一站点地图并检查抓取和索引。可结合中文关键词与实际展现词决定后续内容，而不是预先承诺排名。

## 接下来的优化候选

- 使用真实 Search Console 查询词，补充有用的操作指南，例如导入 JSON、自定义相克、调整夜间顺序和打印 PDF；每篇内容应解决具体问题并链接到工具。
- 使用 PageSpeed Insights / 实际 Web Vitals 数据识别慢设备上的加载瓶颈，再决定是否拆分首页 JavaScript 或优化图片。
- 按真实需求改善目录搜索、剧本资料和相关页面之间的链接；不要批量生成只有关键词、没有实质内容的页面。
- 在部署后的数周持续观察收录与自然流量。站点地图和结构化数据不保证被收录、取得排名或被 AI 引用。

## 官方参考

- [Google：JavaScript 网站的搜索基础](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google：重定向与搜索](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- [Google：结构化数据质量要求](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google：单页应用的 GA4 衡量](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [OpenAI：发布者与开发者常见问题](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
