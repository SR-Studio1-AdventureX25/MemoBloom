# 部署配置指南

## GitHub Secrets 配置

为了确保安全性，你需要在 GitHub 仓库中配置以下 Secrets：

### 1. 进入 GitHub 仓库设置
1. 打开你的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

### 2. 添加以下 Secrets

#### SERVER_IP
    - **Name**: `SERVER_IP`
- **Value**: `54.179.74.111`

#### SERVER_USER
- **Name**: `SERVER_USER`
- **Value**: `root`

#### SERVER_SSH_PASSWORD
- **Name**: `SERVER_SSH_PASSWORD`
- **Value**: `srstudio2024`

#### SERVER_WWWROOT_DIR
- **Name**: `SERVER_WWWROOT_DIR`
- **Value**: `/home/MemoBloom`

## 工作流程说明

这个 GitHub Action 会在以下情况下自动触发：
- 当代码推送到 `main` 分支时
- 当创建针对 `main` 分支的 Pull Request 时

### 部署步骤
1. 检出代码
2. 设置 Bun 环境
3. 安装项目依赖（使用 `bun install --frozen-lockfile`）
4. 构建项目（使用 `bun run build`，生成 `dist/` 目录）
5. 安装部署工具（rsync 和 sshpass）
6. 将构建文件同步到服务器

## 注意事项

1. **安全性**: 请确保服务器密码已正确设置在 GitHub Secrets 中，不要在代码中直接暴露密码
2. **服务器路径**: 部署文件将被上传到服务器的 `/home/MemoBloom` 目录
3. **构建输出**: 项目构建后的文件在 `dist/` 目录中
4. **同步策略**: 使用 `--delete` 参数，会删除服务器上不存在于构建输出中的文件

## 测试部署

推送代码到 `main` 分支后，你可以在 GitHub 仓库的 **Actions** 标签页中查看部署进度和日志。

## 服务器准备

确保你的服务器（54.179.74.111）：
1. SSH 服务正常运行
2. `/home/MemoBloom` 目录存在且有写入权限
3. 网络连接正常，可以从 GitHub Actions 访问
