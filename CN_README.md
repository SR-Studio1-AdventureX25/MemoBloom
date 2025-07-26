<div align="center">

# <image src="https://mb.sr-studio.cn/img/memobloom-logo.png" height="45"/>  植忆
<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_shield&issueType=security" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=shield&issueType=security"/></a>
<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_shield&issueType=license" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=shield&issueType=license"/></a>
<img src="https://img.shields.io/badge/Language-TypeScript-3178c6" alt="Language">
<img src="https://img.shields.io/static/v1?label=LICENSE&message=GPL-3.0&color=coral" alt="Badge">
<img alt="GitLab Stars" src="https://img.shields.io/github/stars/SR-Studio1-AdventureX25/MemoBloom?label=Stars">

[**『 植物懂得安静，记忆因此有处可栖 』**](app.mb.sr-studio.cn)<br/>
一个有关植物成长与回忆的养成系网页游戏<br/>

#### [加入官方QQ群](https://qm.qq.com/q/f3QGDkdp6M)｜[Translate into English](README.md)

#### [🌐 产品中心 ](https://app.sr-studio.cn)｜[💖 支持我们 ](https://afdian.com/a/srinternet)｜[📝 反馈问题](https://github.com/SR-Studio1-AdventureX25/MemoBloom/issues)

###### [在 Bilibili 上关注我们，时刻了解最新发明 →](https://space.bilibili.com/1969160969)

</div>

## 功能特点

### 数字图书馆
- 音频记忆管理
- 可视化日历视图
- 分类存储系统

### 植物生长系统
- 基于状态的植物生长动画
- 情感状态可视化(开心/普通/悲伤)
- 多阶段生长周期(种子/发芽/成熟/开花)

## 技术栈
- 框架: React 18 + TypeScript
- 构建工具: Vite
- 状态管理: Jotai/Zustand
- 样式: CSS Modules
- 音频: Web Audio API
- 视频: HTML5 Video
- PWA 支持

## 安装指南

### 前置要求
- Node.js 18+
- Bun 或 npm/yarn

### 安装步骤
1. 克隆仓库
```bash
git clone [仓库地址]
cd MemoBloom
```

2. 安装依赖
```bash
bun install
# 或
npm install
```

3. 运行开发服务器
```bash
bun dev
# 或
npm run dev
```

## 开发配置

### ESLint 配置
生产环境建议启用类型感知的lint规则：

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## 部署指南

详细部署说明请参考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 安全状态        <a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_small" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=small"/></a>

<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_large&issueType=license" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=large&issueType=license"/></a>

## 许可证

MIT 许可证
