# MemoBloom 自动部署说明

## GitHub Action 自动部署配置

本项目已配置 GitHub Action 自动构建并部署到 GitHub Pages。每次推送到 `main` 分支时会自动触发部署流程。

### 🚀 部署流程

1. **代码检查**：运行 ESLint 进行代码质量检查
2. **类型检查**：执行 TypeScript 类型检查
3. **构建项目**：使用 Vite 构建生产版本
4. **部署到 Pages**：自动部署到 GitHub Pages

### ⚙️ 初次设置

**1. 启用 GitHub Pages**
- 进入仓库的 Settings 页面
- 滚动到 "Pages" 部分
- 在 "Source" 下选择 "GitHub Actions"
- 保存设置

**2. 推送代码触发部署**
```bash
git add .
git commit -m "feat: 配置自动部署"
git push origin main
```

### 📍 部署地址

部署完成后，应用将可通过以下地址访问：
```
https://sr-studio1-adventurex25.github.io/MemoBloom/
```

### 🔧 技术配置

- **构建工具**：Vite + Bun
- **代码检查**：ESLint + TypeScript
- **PWA 支持**：Service Worker + Manifest
- **缓存优化**：依赖缓存加速构建
- **大文件支持**：支持视频文件缓存（110MB）

### 📝 注意事项

1. **分支要求**：只有推送到 `main` 分支才会触发自动部署
2. **构建失败**：如果 ESLint 或 TypeScript 检查失败，部署会终止
3. **手动触发**：可以在 Actions 页面手动触发部署
4. **PWA 功能**：生产环境下 PWA 的 scope 和 start_url 会自动调整为 `/MemoBloom/`

### 🐛 故障排除

如果部署失败，检查以下项目：
- 代码是否通过 ESLint 检查
- TypeScript 类型是否正确
- 构建过程是否成功
- GitHub Pages 是否已正确启用

### 📈 监控部署

可以在以下位置监控部署状态：
- GitHub 仓库的 Actions 标签页
- Settings > Pages 查看部署历史
- 部署成功后会在 Actions 中显示部署地址
