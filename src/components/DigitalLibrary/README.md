# DigitalLibrary 组件

这个目录包含了数字图书馆页面的所有拆分组件，提高了代码的可维护性和可重用性。

## 组件结构

### 核心组件

- **SevenSegmentDigit.tsx** - 7段数码管显示组件
  - 用于显示数字的复古风格数码管效果
  - 支持0-9数字显示，带有真实的段式显示效果

- **DigitalCalendar.tsx** - 数码日历组件
  - 使用SevenSegmentDigit组件显示年份和月份
  - 根据滚动位置动态调整显示的月份

- **BoxComponents.tsx** - 盒子组件集合
  - `PlantBox` - 植物标本盒子
  - `AudioBox` - 音频记录盒子（带CD图标）
  - `EmptyBox` - 空盒子占位符

- **LibraryGrid.tsx** - 图书馆网格布局组件
  - 管理两行盒子的布局逻辑
  - 确保至少显示3个空盒子（第一行2个，第二行1个）
  - 处理植物和音频内容的排列

- **AudioDetailModal.tsx** - 音频详情模态框
  - 全屏显示音频记录详情
  - 包含CD动画效果
  - 显示记忆内容、情感标签、NFT信息等

### 工具和钩子

- **useDigitalLibrary.ts** - 数字图书馆逻辑钩子
  - 管理所有状态和业务逻辑
  - 处理滚动、模态框、音频点击等交互
  - 生成随机偏移和排序数据

- **index.ts** - 统一导出文件
  - 提供所有组件的统一导入入口

## 使用方式

```tsx
import { 
  DigitalCalendar, 
  AudioDetailModal, 
  LibraryGrid, 
  useDigitalLibrary 
} from "@/components/DigitalLibrary";

export default function DigitalLibraryPage() {
  const libraryState = useDigitalLibrary();
  
  return (
    <div>
      <LibraryGrid {...libraryState} />
      <DigitalCalendar scrollLeft={libraryState.scrollLeft} />
      <AudioDetailModal {...libraryState} />
    </div>
  );
}
```

## 设计原则

1. **单一职责** - 每个组件只负责一个特定功能
2. **可重用性** - 组件设计为可在其他地方重用
3. **类型安全** - 所有组件都有完整的TypeScript类型定义
4. **性能优化** - 使用React.memo优化渲染性能
5. **逻辑分离** - 业务逻辑集中在自定义钩子中

## 文件依赖关系

```
DigitalLibraryPage
├── useDigitalLibrary (状态管理)
├── LibraryGrid
│   ├── PlantBox
│   ├── AudioBox
│   └── EmptyBox
├── DigitalCalendar
│   └── SevenSegmentDigit
└── AudioDetailModal
