# 情绪粒子记录仪

一款基于React+TypeScript 的AI情绪分析工具，通过流式对话，粒子动画，历史图表和知识图谱，帮助用于记录并可视化自己的情绪变化

预览地址:https://xhm66-min.github.io/MoodFeed/

## 功能特性

情绪粒子引擎：100个动态粒子实时运动，根据情绪值（valence）和 唤醒度（Arousel）自动切换颜色与速度

AI流式分析：通过调用API，坠子输出Markdown格式的情绪分析报告

多轮对话：支持追问，AI自动记住上下文，形成连续对话

情绪历史趋势：使用Recharts绘制折线图，只换展示情绪变化轨迹

情绪知识图谱：基于vis-network的力导向图，节点大小代表情绪强度，颜色代表极性

全自动部署：通过github Actions自动构建并部署到github Pages

## 技术栈

| 类别 | 技术 |
| :--- | :--- |
| **核心框架** | React 19 + TypeScript |
| **构建工具** | Vite |
| **路由** | React Router v7 |
| **样式** | Tailwind CSS（内联样式降级方案） |
| **AI 接口** | 通义千问 Qwen API（OpenAI 兼容接口） |
| **Markdown 渲染** | react-markdown + remark-gfm |
| **数据可视化** | Recharts（折线图）、vis-network（知识图谱） |
| **部署** | GitHub Pages + GitHub Actions |


### 克隆项目
```bash
git clone https://github.com/xhm66-min/MoodFeed.git
cd MoodFeed



