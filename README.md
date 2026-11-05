# heptagon18.github.io

静态站点仓库 · 交互式专题《AI 与蛋白质结构——AlphaFold 和 RoseTTAFold》。

## 在线阅读

- 站点首页：https://heptagon18.github.io/
- 专题正文：https://heptagon18.github.io/alphafold/

## 目录

```
index.html        仓库索引页（入口，链接到 /alphafold/）
404.html          404 兜底页
.nojekyll         关闭 Jekyll 处理
alphafold/        交互式专题
  index.html        专题首页
  ch1.html ~ ch4.html   四章正文
  references.html   参考文献（含 DOI / Europe PMC / 检索链接）
  resources.html    资源导航（AFDB、PDB、CASP、代码仓库、ESM Atlas 等）
  quiz.html         自测
  assets/css|js|img 样式、脚本与图表
```

## 部署说明

GitHub Pages：Source = `main` 分支、`/`（根目录），无构建步骤。

本地预览：

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000/alphafold/
```

## 内容说明

图件引自公开文献（Nature / Science），各页图注标注文献编号与图号；正文上标对应
`alphafold/references.html` 中的 13 篇文献。
