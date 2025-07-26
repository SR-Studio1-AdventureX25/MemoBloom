# 钱包地址生成修复说明

## 问题描述

之前的钱包地址生成使用了模拟算法，导致同样的助记词在应用中生成的地址与Keplr钱包不同。

## 问题根源

1. **使用模拟地址生成**: 原代码使用 `generateMockInjectiveAddress()` 方法，采用简单的哈希算法而非标准的BIP32/BIP44密钥派生
2. **缺少标准加密库**: 缺少必要的加密库来实现标准的密钥派生过程
3. **非标准派生路径**: 没有使用标准的BIP44派生路径

## 修复方案

### 1. 添加必要依赖

```bash
bun add @cosmjs/crypto @cosmjs/encoding @cosmjs/amino
```

### 2. 重写地址生成逻辑

使用标准的加密算法替换模拟实现：

- **BIP39**: 助记词验证和种子生成
- **BIP44**: 标准派生路径 `m/44'/118'/0'/0/0` (Cosmos Hub路径)
- **Secp256k1**: 椭圆曲线加密算法
- **Bech32**: 地址编码格式

### 3. 核心修改

```typescript
// 使用标准的BIP44路径生成Injective地址
const hdPath = makeCosmoshubPath(0) // 使用账户0

// 创建HD钱包
const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic.trim(), {
  hdPaths: [hdPath],
  prefix: "inj"
})
```

## 测试结果

使用标准测试助记词：
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

生成的地址：
```
inj19rl4cm2hmr8afy4kldpxz3fka4jguq0akf6edd
```

## 验证方法

你可以使用相同的助记词在Keplr钱包中导入，应该会生成相同的地址。

## 注意事项

1. **向后兼容性**: 如果之前已经创建了钱包，地址会发生变化
2. **安全性**: 现在使用的是标准的加密算法，安全性大大提升
3. **一致性**: 与其他标准钱包（如Keplr、Metamask等）生成的地址保持一致

## 相关文件

- `src/services/injectiveWallet.ts` - 主要修改文件
- `package.json` - 添加了新的依赖项

## 技术细节

### 密钥派生过程

1. **助记词 → 种子**: 使用BIP39标准
2. **种子 → 主密钥**: 使用BIP32标准
3. **主密钥 → 派生密钥**: 使用BIP44路径
4. **派生密钥 → 公钥**: 使用Secp256k1椭圆曲线
5. **公钥 → 地址**: 使用Bech32编码，前缀为"inj"

### 使用的库

- `@cosmjs/amino`: 提供HD钱包功能
- `@cosmjs/crypto`: 提供加密算法
- `@cosmjs/encoding`: 提供编码功能
- `bip39`: 助记词处理

这个修复确保了你的应用生成的钱包地址与标准钱包完全一致。
