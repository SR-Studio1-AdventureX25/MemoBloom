# 智能同步机制测试说明

## 新功能概述

本次更新为数据同步机制添加了以下新功能：

### 1. 时间Flag机制
- `lastModified`: 数据最后修改时间
- `forceExpireUntil`: 强制过期截止时间
- `backoffLevel`: 指数退避等级
- `nextSyncTime`: 下次允许同步的时间

### 2. 智能过期策略
- **强制过期期**: 数据修改后60秒内持续处于过期状态
- **指数退避**: 根据同步结果调整同步频率
- **数据变化检测**: 比较本地和服务器数据，智能调整退避策略

### 3. 配置参数
```typescript
const SYNC_CONFIG = {
  FORCE_EXPIRE_DURATION: 60 * 1000,    // 60秒强制过期期
  BASE_BACKOFF_DELAY: 2000,            // 2秒基础退避
  MAX_BACKOFF_DELAY: 60000,            // 60秒最大退避
  MAX_BACKOFF_LEVEL: 5,                // 最大退避等级
}
```

## 测试场景

### 场景1: 新增浇水记录
1. 创建新的浇水记录
2. 验证植物和浇水记录的 `lastModified` 被设置
3. 验证 `forceExpireUntil` 设置为60秒后
4. 验证在60秒内同步会被触发

### 场景2: 指数退避测试
1. 模拟同步失败
2. 验证 `backoffLevel` 递增
3. 验证 `nextSyncTime` 按指数增长
4. 验证在退避期间不会重复同步

### 场景3: 数据变化检测
1. 同步获取到相同数据
2. 验证退避等级增加
3. 同步获取到不同数据
4. 验证退避等级重置为0

## 使用方法

### 标记数据修改
```typescript
import { markEntityModified, markPlantAndRecordsModified } from '@/services/syncService'

// 标记单个实体修改
markEntityModified(plantId, 'plant')
markEntityModified(recordId, 'watering')

// 批量标记植物和浇水记录修改
markPlantAndRecordsModified(plantId, recordId)
```

### 检查同步状态
```typescript
import { useAppStore } from '@/store'

const store = useAppStore.getState()
const syncStatus = store.getSyncStatus(entityId, 'plant')

console.log('同步状态:', {
  lastModified: syncStatus.lastModified,
  forceExpireUntil: syncStatus.forceExpireUntil,
  backoffLevel: syncStatus.backoffLevel,
  nextSyncTime: syncStatus.nextSyncTime
})
```

## 预期行为

### 正常流程
1. 数据修改 → 设置 `lastModified` 和 `forceExpireUntil`
2. 60秒内 → 持续触发同步
3. 数据无变化 → 增加退避等级，降低同步频率
4. 数据有变化 → 重置退避等级，恢复频繁同步

### 错误处理
1. 同步失败 → 增加退避等级
2. 达到最大退避等级 → 保持最大延迟时间
3. 网络恢复 → 正常同步流程

## 日志输出

新的同步机制会输出详细的日志信息：

```
标记实体已修改 [plant-123] (plant)
实体在强制过期期间 [plant-123]: 30000ms ago
植物数据有变化 [plant-123]，重置退避等级
植物数据无变化 [plant-123]，增加退避等级
植物 [plant-123] 退避等级: 2, 下次同步时间: 8000ms 后
```

这些日志可以帮助调试和监控同步机制的工作状态。
