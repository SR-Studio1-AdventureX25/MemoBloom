import type { PinAttempt } from '@/types'

// PIN码尝试次数管理
const PIN_STORAGE_KEY = 'memobloom-pin-attempts'
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 30 * 60 * 1000 // 30分钟

export class WalletCrypto {
  private static instance: WalletCrypto
  
  static getInstance(): WalletCrypto {
    if (!this.instance) {
      this.instance = new WalletCrypto()
    }
    return this.instance
  }

  // 生成加密密钥
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  // 加密助记词
  async encryptMnemonic(mnemonic: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(mnemonic)
      
      // 生成随机盐和初始化向量
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      // 派生密钥
      const key = await this.deriveKey(password, salt)
      
      // 加密数据
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      )
      
      // 组合结果：盐 + IV + 加密数据
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
      result.set(salt, 0)
      result.set(iv, salt.length)
      result.set(new Uint8Array(encrypted), salt.length + iv.length)
      
      // 转换为Base64
      return btoa(String.fromCharCode(...result))
    } catch (error) {
      console.error('加密助记词失败:', error)
      throw new Error('加密失败')
    }
  }

  // 解密助记词
  async decryptMnemonic(encryptedData: string, password: string): Promise<string> {
    try {
      // 从Base64解码
      const data = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )
      
      // 提取盐、IV和加密数据
      const salt = data.slice(0, 16)
      const iv = data.slice(16, 28)
      const encrypted = data.slice(28)
      
      // 派生密钥
      const key = await this.deriveKey(password, salt)
      
      // 解密数据
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      )
      
      // 转换为字符串
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('解密助记词失败:', error)
      throw new Error('解密失败或密码错误')
    }
  }

  // 验证PIN码格式
  validatePin(pin: string): boolean {
    return /^\d{6}$/.test(pin)
  }

  // 获取PIN码尝试记录
  getPinAttempts(): PinAttempt {
    const stored = localStorage.getItem(PIN_STORAGE_KEY)
    if (stored) {
      const attempts = JSON.parse(stored)
      return {
        ...attempts,
        lastAttempt: new Date(attempts.lastAttempt),
        blockUntil: attempts.blockUntil ? new Date(attempts.blockUntil) : null
      }
    }
    
    return {
      attempts: 0,
      lastAttempt: new Date(),
      isBlocked: false,
      blockUntil: null
    }
  }

  // 记录PIN码尝试失败
  recordFailedPinAttempt(): PinAttempt {
    const current = this.getPinAttempts()
    const now = new Date()
    
    const newAttempts: PinAttempt = {
      attempts: current.attempts + 1,
      lastAttempt: now,
      isBlocked: false,
      blockUntil: null
    }
    
    // 检查是否需要锁定
    if (newAttempts.attempts >= MAX_ATTEMPTS) {
      newAttempts.isBlocked = true
      newAttempts.blockUntil = new Date(now.getTime() + BLOCK_DURATION)
    }
    
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newAttempts))
    return newAttempts
  }

  // 重置PIN码尝试记录（成功验证后）
  resetPinAttempts(): void {
    localStorage.removeItem(PIN_STORAGE_KEY)
  }

  // 检查PIN码是否被锁定
  isPinBlocked(): boolean {
    const attempts = this.getPinAttempts()
    if (!attempts.isBlocked || !attempts.blockUntil) {
      return false
    }
    
    // 检查锁定时间是否已过
    if (new Date() > attempts.blockUntil) {
      this.resetPinAttempts()
      return false
    }
    
    return true
  }

  // 获取剩余锁定时间（分钟）
  getRemainingBlockTime(): number {
    const attempts = this.getPinAttempts()
    if (!attempts.isBlocked || !attempts.blockUntil) {
      return 0
    }
    
    const remaining = attempts.blockUntil.getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(remaining / (60 * 1000)))
  }

  // 生成安全的随机密码（用于内部）
  generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => charset[byte % charset.length]).join('')
  }

  // 清理所有加密相关的本地存储
  clearAllCryptoData(): void {
    localStorage.removeItem(PIN_STORAGE_KEY)
  }
}

export const walletCrypto = WalletCrypto.getInstance()
