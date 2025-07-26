# 钱包组件重构文档

## 概述

WalletPage.tsx 已经从一个600+行的单体文件重构为多个小型、专注的组件和 Hook。这次重构提高了代码的可维护性、可复用性和可测试性。

## 文件结构

```
src/components/wallet/
├── views/                    # 视图组件
│   ├── NoWalletView.tsx     # 无钱包状态视图
│   ├── LockedWalletView.tsx # 钱包锁定状态视图
│   └── UnlockedWalletView.tsx # 钱包解锁状态视图
├── setup/                   # 设置流程组件
│   └── WalletSetupFlow.tsx  # 钱包设置流程
├── nft/                     # NFT相关组件
│   └── NFTManagement.tsx    # NFT管理组件
├── info/                    # 信息显示组件
│   └── WalletInfo.tsx       # 钱包信息组件
├── PinInput.tsx            # PIN码输入组件（已存在）
├── MnemonicDisplay.tsx     # 助记词显示组件（已存在）
├── MnemonicImport.tsx      # 助记词导入组件（已存在）
├── index.ts                # 组件导出索引
└── README.md               # 本文档

src/hooks/wallet/
├── useWalletSetup.ts       # 钱包设置相关逻辑
├── useNFTMinting.ts        # NFT铸造相关逻辑
└── index.ts                # Hook导出索引
```

## 组件说明

### 视图组件 (Views)

#### NoWalletView
- **职责**: 显示无钱包状态，提供创建和导入钱包的选项
- **Props**: `onCreateWallet`, `onImportWallet`
- **大小**: ~40行

#### LockedWalletView
- **职责**: 显示钱包锁定状态，处理解锁逻辑
- **Props**: `authMethod`, `pin`, `onPinChange`, `onUnlock`, `onDeleteWallet`, `error`, `isLoading`, `onClearError`
- **大小**: ~80行

#### UnlockedWalletView
- **职责**: 显示钱包解锁状态，包含钱包信息和NFT管理
- **Props**: `walletAddress`, `favoritePlants`, `favoriteWateringRecords`, `onMintPlantNFT`, `onMintWateringRecordNFT`, `onLockWallet`, `onDeleteWallet`, `isLoading`, `error`
- **大小**: ~60行

### 设置组件 (Setup)

#### WalletSetupFlow
- **职责**: 处理完整的钱包设置流程
- **Props**: 包含所有设置相关的状态和回调函数
- **大小**: ~200行
- **包含步骤**: welcome, choose-method, import-mnemonic, backup-mnemonic, choose-auth, setup-pin, setup-passkey, complete

### NFT组件 (NFT)

#### NFTManagement
- **职责**: 管理收藏的植物和记忆的NFT铸造
- **Props**: `favoritePlants`, `favoriteWateringRecords`, `onMintPlantNFT`, `onMintWateringRecordNFT`, `isLoading`, `error`
- **大小**: ~100行

### 信息组件 (Info)

#### WalletInfo
- **职责**: 显示钱包地址信息
- **Props**: `walletAddress`
- **大小**: ~30行

## Hook说明

### useWalletSetup
- **职责**: 管理钱包设置相关的所有状态和逻辑
- **返回**: 页面状态、设置步骤、表单数据、处理函数等
- **大小**: ~150行

### useNFTMinting
- **职责**: 处理NFT铸造相关的逻辑
- **返回**: 铸造函数、加载状态、错误处理
- **大小**: ~60行

## 重构前后对比

### 重构前 (WalletPage.tsx)
- **行数**: 600+ 行
- **职责**: 包含所有钱包相关功能
- **问题**: 
  - 代码难以维护
  - 组件过于庞大
  - 逻辑耦合严重
  - 难以测试
  - 团队协作困难

### 重构后
- **主文件行数**: ~110 行
- **总组件数**: 11 个文件
- **优势**:
  - 职责单一，易于理解
  - 组件可复用
  - 易于测试
  - 支持并行开发
  - 更好的代码组织

## 修复的问题

1. **创建新钱包按钮无响应**: 
   - **原因**: `handleGenerateMnemonic` 函数没有设置 `pageState` 为 `'setup'`
   - **修复**: 在生成助记词后添加 `setPageState('setup')`

## 使用方式

```tsx
// 在 WalletPage.tsx 中使用
import { useWalletSetup, useNFTMinting } from '@/hooks/wallet'
import { 
  NoWalletView, 
  LockedWalletView, 
  UnlockedWalletView, 
  WalletSetupFlow 
} from '@/components/wallet'

// 使用 Hook 获取状态和函数
const walletSetup = useWalletSetup()
const nftMinting = useNFTMinting(walletAddress)

// 根据状态渲染对应组件
switch (pageState) {
  case 'no-wallet':
    return <NoWalletView {...props} />
  case 'setup':
    return <WalletSetupFlow {...props} />
  case 'locked':
    return <LockedWalletView {...props} />
  case 'unlocked':
    return <UnlockedWalletView {...props} />
}
```

## 测试建议

每个组件现在都可以独立测试：

```tsx
// 测试示例
import { render, fireEvent } from '@testing-library/react'
import NoWalletView from './NoWalletView'

test('should call onCreateWallet when create button is clicked', () => {
  const mockOnCreate = jest.fn()
  const { getByText } = render(
    <NoWalletView onCreateWallet={mockOnCreate} onImportWallet={jest.fn()} />
  )
  
  fireEvent.click(getByText('创建新钱包'))
  expect(mockOnCreate).toHaveBeenCalled()
})
```

## 未来改进建议

1. **添加错误边界**: 为每个主要组件添加错误边界
2. **添加加载骨架**: 改善用户体验
3. **添加动画过渡**: 在状态切换时添加平滑过渡
4. **优化性能**: 使用 React.memo 优化不必要的重渲染
5. **添加单元测试**: 为每个组件和 Hook 编写测试
6. **国际化支持**: 提取硬编码的文本到语言文件
