<div align="center">

# <image src="https://mb.sr-studio.cn/img/memobloom-logo.png" height="45"/>  [MemoBloom](https://mb.sr-studio.cn)
<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_shield&issueType=security" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=shield&issueType=security"/></a>
<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_shield&issueType=license" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=shield&issueType=license"/></a>
<img src="https://img.shields.io/badge/Language-TypeScript-3178c6" alt="Language">
<img src="https://img.shields.io/static/v1?label=LICENSE&message=MIT&color=coral" alt="Badge">
![GitHub Repo stars](https://img.shields.io/github/stars/SR-Studio1-AdventureX25/MemoBloom)


[**「 Plants possess the art of silence, where memories find their shelter 」**](https://app.mb.sr-studio.cn)<br/>
A nurturing web game about plant growth and memories<br/>

#### [Join the QQ group](https://qm.qq.com/q/f3QGDkdp6M)｜[切换到简体中文](CN_README.md)

#### [🌐 App Center ](https://app.sr-studio.cn)｜[💖 Sponsor ](https://afdian.com/a/srinternet)｜[📝 Feedback](https://github.com/SR-Studio1-AdventureX25/MemoBloom/issues)

##### [Follow us on Bilibili →](https://space.bilibili.com/1969160969)

</div>

## Features

### Digital Library
- Audio memory management
- Visual calendar view
- Categorized storage system

### Plant Growth System
- State-based plant growth animations
- Emotion visualization (Happy/Normal/Sad)
- Multi-stage life cycle (Seed/Sprout/Mature/Flowering)

## Technology Stack
- Framework: React 18 + TypeScript
- Build Tool: Vite
- State Management: Jotai/Zustand
- Styling: CSS Modules
- Audio: Web Audio API
- Video: HTML5 Video
- PWA Support

## Installation

### Prerequisites
- Node.js 18+
- Bun or npm/yarn

### Steps
1. Clone repo
```bash
git clone [repo-url]
cd MemoBloom
```

2. Install dependencies
```bash
bun install
# or
npm install
```

3. Run dev server
```bash
bun dev
# or
npm run dev
```

## Development Configuration

### ESLint Configuration
For production applications, enable type-aware lint rules:

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

## Deployment

Refer to [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## Safety Statement        <a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_small" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=small"/></a>

<a href="https://app.fossa.com/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom?ref=badge_large&issueType=license" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FSR-Studio1-AdventureX25%2FMemoBloom.svg?type=large&issueType=license"/></a>

## License

MIT License
