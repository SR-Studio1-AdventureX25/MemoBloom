import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { WalletState, WalletActions, MnemonicInfo } from '@/types'
import { walletCrypto } from '@/services/walletCrypto'
import { injectiveWallet } from '@/services/injectiveWallet'
import { passkeyAuth } from '@/services/passkeyAuth'

interface WalletStore extends WalletState, WalletActions {}

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        walletAddress: null,
        isWalletLocked: true,
        encryptedMnemonic: null,
        walletCreatedAt: null,
        hasPasskey: false,
        authMethod: null,
        lockTimeout: 30, // 默认30分钟
        lastUnlockTime: null,

        // 钱包基础操作
        createWallet: async (mnemonic: string, authMethod: 'pin' | 'passkey', credential: string | ArrayBuffer): Promise<boolean> => {
          try {
            // 验证助记词
            if (!injectiveWallet.validateMnemonic(mnemonic)) {
              throw new Error('无效的助记词')
            }

            // 生成钱包地址
            const walletInfo: MnemonicInfo = await injectiveWallet.generateWalletFromMnemonic(mnemonic)

            // 加密助记词
            let encryptedMnemonic: string
            if (authMethod === 'pin') {
              if (typeof credential !== 'string') {
                throw new Error('PIN码必须是字符串')
              }
              if (!walletCrypto.validatePin(credential)) {
                throw new Error('PIN码格式无效')
              }
              encryptedMnemonic = await walletCrypto.encryptMnemonic(mnemonic, credential)
            } else {
              // Passkey模式，使用随机密码加密
              const randomPassword = walletCrypto.generateSecurePassword()
              encryptedMnemonic = await walletCrypto.encryptMnemonic(mnemonic, randomPassword)
              // 存储密码（在实际应用中应该与passkey关联）
              localStorage.setItem('memobloom-wallet-password', randomPassword)
            }

            // 更新状态
            set({
              walletAddress: walletInfo.address,
              encryptedMnemonic,
              authMethod,
              hasPasskey: authMethod === 'passkey',
              walletCreatedAt: new Date(),
              isWalletLocked: false,
              lastUnlockTime: new Date()
            })

            return true
          } catch (error) {
            console.error('创建钱包失败:', error)
            return false
          }
        },

        unlockWallet: async (credential: string | ArrayBuffer): Promise<boolean> => {
          try {
            const { encryptedMnemonic, authMethod } = get()
            
            if (!encryptedMnemonic || !authMethod) {
              throw new Error('钱包未初始化')
            }

            // 检查PIN码是否被锁定
            if (authMethod === 'pin' && walletCrypto.isPinBlocked()) {
              const remainingTime = walletCrypto.getRemainingBlockTime()
              throw new Error(`PIN码已锁定，请等待${remainingTime}分钟后重试`)
            }

            let password: string
            if (authMethod === 'pin') {
              if (typeof credential !== 'string') {
                throw new Error('PIN码必须是字符串')
              }
              password = credential
            } else {
              // Passkey模式，获取存储的密码
              const storedPassword = localStorage.getItem('memobloom-wallet-password')
              if (!storedPassword) {
                throw new Error('未找到钱包密码')
              }
              password = storedPassword
            }

            // 尝试解密助记词以验证密码
            await walletCrypto.decryptMnemonic(encryptedMnemonic, password)

            // 解锁成功，重置PIN码尝试次数
            if (authMethod === 'pin') {
              walletCrypto.resetPinAttempts()
            }

            set({
              isWalletLocked: false,
              lastUnlockTime: new Date()
            })

            return true
          } catch (error) {
            console.error('解锁钱包失败:', error)
            
            // 记录PIN码失败尝试
            const { authMethod } = get()
            if (authMethod === 'pin') {
              walletCrypto.recordFailedPinAttempt()
            }
            
            return false
          }
        },

        lockWallet: () => {
          set({
            isWalletLocked: true,
            lastUnlockTime: null
          })
        },

        deleteWallet: async (): Promise<boolean> => {
          try {
            // 清理所有相关数据
            walletCrypto.clearAllCryptoData()
            passkeyAuth.clearAllPasskeyData()
            localStorage.removeItem('memobloom-wallet-password')

            // 重置状态
            set({
              walletAddress: null,
              isWalletLocked: true,
              encryptedMnemonic: null,
              walletCreatedAt: null,
              hasPasskey: false,
              authMethod: null,
              lastUnlockTime: null
            })

            return true
          } catch (error) {
            console.error('删除钱包失败:', error)
            return false
          }
        },

        // 钱包状态管理
        setWalletAddress: (address: string | null) => set({ walletAddress: address }),
        setWalletLocked: (locked: boolean) => set({ isWalletLocked: locked }),
        setEncryptedMnemonic: (mnemonic: string | null) => set({ encryptedMnemonic: mnemonic }),
        setAuthMethod: (method: 'pin' | 'passkey' | null) => set({ authMethod: method }),
        setHasPasskey: (hasPasskey: boolean) => set({ hasPasskey }),
        setLockTimeout: (timeout: number) => set({ lockTimeout: timeout }),
        setLastUnlockTime: (time: Date | null) => set({ lastUnlockTime: time }),

        // 钱包功能
        exportMnemonic: async (credential: string | ArrayBuffer): Promise<string | null> => {
          try {
            const { encryptedMnemonic, authMethod, isWalletLocked } = get()
            
            if (isWalletLocked) {
              throw new Error('钱包已锁定，请先解锁')
            }

            if (!encryptedMnemonic || !authMethod) {
              throw new Error('钱包未初始化')
            }

            let password: string
            if (authMethod === 'pin') {
              if (typeof credential !== 'string') {
                throw new Error('PIN码必须是字符串')
              }
              
              // 验证PIN码格式
              if (!walletCrypto.validatePin(credential)) {
                throw new Error('PIN码格式无效')
              }
              
              // 检查PIN码是否被锁定
              if (walletCrypto.isPinBlocked()) {
                const remainingTime = walletCrypto.getRemainingBlockTime()
                throw new Error(`PIN码已锁定，请等待${remainingTime}分钟后重试`)
              }
              
              password = credential
            } else {
              // Passkey模式需要重新验证
              if (!(credential instanceof ArrayBuffer)) {
                throw new Error('Passkey模式需要提供有效的认证凭据')
              }
              
              // 验证Passkey凭据
              const isValid = await passkeyAuth.verifyCredential()
              if (!isValid) {
                throw new Error('Passkey验证失败')
              }
              
              const storedPassword = localStorage.getItem('memobloom-wallet-password')
              if (!storedPassword) {
                throw new Error('未找到钱包密码')
              }
              password = storedPassword
            }

            // 尝试解密助记词
            const mnemonic = await walletCrypto.decryptMnemonic(encryptedMnemonic, password)
            
            // PIN模式下重置失败尝试次数
            if (authMethod === 'pin') {
              walletCrypto.resetPinAttempts()
            }
            
            return mnemonic
          } catch (error) {
            console.error('导出助记词失败:', error)
            
            // PIN模式下记录失败尝试
            const { authMethod } = get()
            if (authMethod === 'pin' && typeof credential === 'string') {
              walletCrypto.recordFailedPinAttempt()
            }
            
            // 重新抛出错误而不是返回null
            throw error
          }
        },

        changeAuthMethod: async (newMethod: 'pin' | 'passkey', newCredential: string | ArrayBuffer): Promise<boolean> => {
          try {
            const { encryptedMnemonic, authMethod } = get()
            
            if (!encryptedMnemonic || !authMethod) {
              throw new Error('钱包未初始化')
            }

            // 先解密现有助记词
            let currentPassword: string
            if (authMethod === 'pin') {
              // 需要用户提供当前PIN码
              const currentPin = prompt('请输入当前PIN码:')
              if (!currentPin) {
                throw new Error('需要当前PIN码')
              }
              currentPassword = currentPin
            } else {
              const storedPassword = localStorage.getItem('memobloom-wallet-password')
              if (!storedPassword) {
                throw new Error('未找到当前钱包密码')
              }
              currentPassword = storedPassword
            }

            const mnemonic = await walletCrypto.decryptMnemonic(encryptedMnemonic, currentPassword)

            // 用新方法重新加密
            let newEncryptedMnemonic: string
            if (newMethod === 'pin') {
              if (typeof newCredential !== 'string') {
                throw new Error('PIN码必须是字符串')
              }
              if (!walletCrypto.validatePin(newCredential)) {
                throw new Error('PIN码格式无效')
              }
              newEncryptedMnemonic = await walletCrypto.encryptMnemonic(mnemonic, newCredential)
              // 清理旧密码
              localStorage.removeItem('memobloom-wallet-password')
            } else {
              const randomPassword = walletCrypto.generateSecurePassword()
              newEncryptedMnemonic = await walletCrypto.encryptMnemonic(mnemonic, randomPassword)
              localStorage.setItem('memobloom-wallet-password', randomPassword)
            }

            // 更新状态
            set({
              encryptedMnemonic: newEncryptedMnemonic,
              authMethod: newMethod,
              hasPasskey: newMethod === 'passkey'
            })

            return true
          } catch (error) {
            console.error('更改认证方式失败:', error)
            return false
          }
        }
      }),
      {
        name: 'memobloom-wallet-storage',
        partialize: (state) => ({
          walletAddress: state.walletAddress,
          encryptedMnemonic: state.encryptedMnemonic,
          walletCreatedAt: state.walletCreatedAt,
          hasPasskey: state.hasPasskey,
          authMethod: state.authMethod,
          lockTimeout: state.lockTimeout,
          // 不持久化敏感状态
          isWalletLocked: true, // 重启后总是锁定
          lastUnlockTime: null
        })
      }
    )
  )
)

// 自动锁定功能
let lockTimer: NodeJS.Timeout | null = null

export const startAutoLock = () => {
  const { lockTimeout, isWalletLocked, lockWallet } = useWalletStore.getState()
  
  if (lockTimer) {
    clearTimeout(lockTimer)
  }

  if (!isWalletLocked && lockTimeout > 0) {
    lockTimer = setTimeout(() => {
      lockWallet()
    }, lockTimeout * 60 * 1000) // 转换为毫秒
  }
}

export const stopAutoLock = () => {
  if (lockTimer) {
    clearTimeout(lockTimer)
    lockTimer = null
  }
}

// 监听钱包解锁状态变化
useWalletStore.subscribe((state) => {
  if (!state.isWalletLocked) {
    startAutoLock()
  } else {
    stopAutoLock()
  }
})
