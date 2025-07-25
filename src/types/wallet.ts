// 钱包相关类型定义

export interface WalletState {
  walletAddress: string | null          // Injective钱包地址
  isWalletLocked: boolean              // 钱包是否锁定
  encryptedMnemonic: string | null     // 加密的助记词
  walletCreatedAt: Date | null         // 钱包创建时间
  hasPasskey: boolean                  // 是否设置了passkey
  authMethod: 'pin' | 'passkey' | null // 认证方式
  lockTimeout: number                  // 锁定超时时间（分钟）
  lastUnlockTime: Date | null          // 最后解锁时间
}

export interface WalletActions {
  // 钱包基础操作
  createWallet: (mnemonic: string, authMethod: 'pin' | 'passkey', credential: string | ArrayBuffer) => Promise<boolean>
  unlockWallet: (credential: string | ArrayBuffer) => Promise<boolean>
  lockWallet: () => void
  deleteWallet: () => Promise<boolean>
  
  // 钱包状态管理
  setWalletAddress: (address: string | null) => void
  setWalletLocked: (locked: boolean) => void
  setEncryptedMnemonic: (mnemonic: string | null) => void
  setAuthMethod: (method: 'pin' | 'passkey' | null) => void
  setHasPasskey: (hasPasskey: boolean) => void
  setLockTimeout: (timeout: number) => void
  setLastUnlockTime: (time: Date | null) => void
  
  // 钱包功能
  exportMnemonic: (credential: string | ArrayBuffer) => Promise<string | null>
  changeAuthMethod: (newMethod: 'pin' | 'passkey', newCredential: string | ArrayBuffer) => Promise<boolean>
}

export interface MnemonicInfo {
  mnemonic: string
  address: string
  publicKey: string
}

export interface PasskeyCredential {
  id: string
  publicKey: ArrayBuffer
  created: Date
}

export interface PinAttempt {
  attempts: number
  lastAttempt: Date
  isBlocked: boolean
  blockUntil: Date | null
}

// 钱包设置步骤
export type WalletSetupStep = 
  | 'welcome'           // 欢迎页面
  | 'choose-auth'       // 选择认证方式
  | 'generate-mnemonic' // 生成助记词
  | 'backup-mnemonic'   // 备份助记词
  | 'verify-mnemonic'   // 验证助记词
  | 'setup-pin'         // 设置PIN码
  | 'setup-passkey'     // 设置Passkey
  | 'complete'          // 完成设置

// 钱包页面状态
export type WalletPageState = 
  | 'no-wallet'         // 没有钱包
  | 'locked'            // 钱包锁定
  | 'unlocked'          // 钱包解锁
  | 'setup'             // 设置中

// NFT资产信息（应用内专用）
export interface WalletNFT {
  tokenId: string
  contractAddress: string
  name: string
  description: string
  image: string
  plantId: string          // 关联的植物ID
  wateringRecordId: string // 关联的浇水记录ID
  mintedAt: Date
}
