# heptagon.github.io

静态站点仓库。

## 目录

```
index.html        仓库索引页（入口，链接到 /alphafold/）
404.html          404 兜底页
.nojekyll         关闭 Jekyll 处理
alphafold/        交互式专题：《AI 与蛋白质结构——AlphaFold 和 RoseTTAFold》
  index.html        专题首页
  ch1.html ~ ch4.html  四章正文
  references.html   参考文献（含 DOI / 全文检索链接）
  resources.html    资源导航（AFDB、PDB、CASP、代码仓库等）
  quiz.html         自测
  assets/css|js|img 样式、脚本与图表
```

## 访问地址

- 项目站点：https://fyc090118.github.io/heptagon.github.io/alphafold/
- 若将账号改名为 `heptagon`，本仓库（名称已是 `heptagon.github.io`）即成为用户站点，
  专题页将位于 https://heptagon.github.io/alphafold/

## 部署

GitHub Pages：Source = `main` 分支、`/`（根目录），无需构建步骤。

本地预览：

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000/alphafold/
```

## 内容说明

图件引自公开文献（Nature / Science），各页图注标注文献编号与图号；正文上标对应
`alphafold/references.html` 中的 13 篇文献。
