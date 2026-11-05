# AI 与蛋白质结构 · 交互式专题

课程报告《AI 与蛋白质结构——AlphaFold 和 RoseTTAFold》的网页改编版，站点以静态页面发布，可直接用浏览器打开。

## 结构

```
index.html          首页：关键数字、四章导览
ch1.html            第一章 结构研究的基础（三类实验方法）
ch2.html            第二章 AlphaFold（架构、pLDDT 判读器、发展与应用）
ch3.html            第三章 RoseTTAFold（三轨交互、RFdiffusion 去噪演示、All-Atom）
ch4.html            第四章 未来与反思（ESM 规模滑块、科学与社会）
references.html     参考文献（按语种筛选、可展开要点、DOI/全文/检索链接）
resources.html      资源导航（AFDB、PDB、CASP、代码仓库、ESM Atlas 等）
quiz.html           五道自测题（即时判分与解析）
assets/css/site.css 全站样式
assets/js/core.js   进度条、滚动显现、右侧导航、站内搜索
assets/js/widgets.js 标签页、时间轴、滑块、画布演示、文献、测验
assets/img/         图表（引自公开文献，出处见各页图注）
```

## 交互

- 页面滚动时，卡片与图注逐个淡入；右侧小节导航与阅读进度条同步高亮。
- 顶栏搜索：输入关键词（如 `CASP`、`pLDDT`、`RFdiffusion`）即时给出跨页结果；按 `/` 可聚焦搜索框。
- 2.2 pLDDT 判读器、3.1 三轨示意图、3.2 RFdiffusion 去噪演示、4.2 ESM 规模滑块均可点击或拖动。
- 每个小节可用页面右侧导航跳转；键盘 `j` / `k` 切换小节。

## 数据来源

正文上标对应 `references.html` 中的 13 篇文献；图件来自文献原图（Nature / Science），页面图注均标注文献编号与图号。

## 本地预览

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000
```
