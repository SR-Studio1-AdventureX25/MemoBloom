import type { PasskeyCredential } from '@/types'

const PASSKEY_STORAGE_KEY = 'memobloom-passkey-credential'

export class PasskeyAuthService {
  private static instance: PasskeyAuthService
  
  static getInstance(): PasskeyAuthService {
    if (!this.instance) {
      this.instance = new PasskeyAuthService()
    }
    return this.instance
  }

  // 检查浏览器是否支持WebAuthn
  isSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    )
  }

  // 检查是否有可用的认证器
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false
      }
      
      // 检查是否有可用的认证器
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      console.error('检查Passkey可用性失败:', error)
      return false
    }
  }

  // 注册新的Passkey（简化版本）
  async register(): Promise<PasskeyCredential> {
    try {
      if (!this.isSupported()) {
        throw new Error('浏览器不支持WebAuthn')
      }

      // 生成模拟的凭证（开发阶段）
      const publicKeyArray = crypto.getRandomValues(new Uint8Array(32))
      const credential: PasskeyCredential = {
        id: `passkey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicKey: publicKeyArray.buffer,
        created: new Date()
      }

      // 保存凭证信息
      this.saveCredential(credential)

      return credential
    } catch (error) {
      console.error('Passkey注册失败:', error)
      throw new Error('Passkey注册失败')
    }
  }

  // 使用Passkey进行认证（简化版本）
  async authenticate(): Promise<ArrayBuffer> {
    try {
      if (!this.isSupported()) {
        throw new Error('浏览器不支持WebAuthn')
      }

      const credential = this.getStoredCredential()
      if (!credential) {
        throw new Error('未找到已注册的Passkey')
      }

      // 模拟认证过程
      const signature = crypto.getRandomValues(new Uint8Array(64))
      return signature.buffer
    } catch (error) {
      console.error('Passkey认证失败:', error)
      throw new Error('Passkey认证失败')
    }
  }

  // 检查是否已有注册的Passkey
  hasRegisteredPasskey(): boolean {
    return !!this.getStoredCredential()
  }

  // 删除已注册的Passkey
  deletePasskey(): void {
    localStorage.removeItem(PASSKEY_STORAGE_KEY)
  }

  // 保存凭证信息
  private saveCredential(credential: PasskeyCredential): void {
    const credentialData = {
      id: credential.id,
      publicKey: Array.from(new Uint8Array(credential.publicKey)), // 转换为数组以便序列化
      created: credential.created.toISOString()
    }
    localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(credentialData))
  }

  // 获取存储的凭证信息
  private getStoredCredential(): PasskeyCredential | null {
    try {
      const stored = localStorage.getItem(PASSKEY_STORAGE_KEY)
      if (!stored) {
        return null
      }

      const credentialData = JSON.parse(stored)
      return {
        id: credentialData.id,
        publicKey: new Uint8Array(credentialData.publicKey),
        created: new Date(credentialData.created)
      }
    } catch (error) {
      console.error('读取存储的凭证失败:', error)
      return null
    }
  }

  // 验证凭证是否有效
  async verifyCredential(): Promise<boolean> {
    try {
      const credential = this.getStoredCredential()
      if (!credential) {
        return false
      }

      // 简单验证：检查凭证是否在合理的时间范围内创建
      const daysSinceCreation = (Date.now() - credential.created.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreation < 365 // 凭证有效期1年
    } catch (error) {
      console.error('验证凭证失败:', error)
      return false
    }
  }


  // 清理所有Passkey相关数据
  clearAllPasskeyData(): void {
    this.deletePasskey()
  }
}

export const passkeyAuth = PasskeyAuthService.getInstance()
