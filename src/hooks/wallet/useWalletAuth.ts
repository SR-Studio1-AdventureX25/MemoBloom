import { useState, useCallback } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { passkeyAuth } from '@/services/passkeyAuth'

export interface AuthCredential {
  type: 'pin' | 'passkey'
  value: string | ArrayBuffer
}

export function useWalletAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const { authMethod, exportMnemonic } = useWalletStore()

  /**
   * 请求用户认证并获取助记词
   */
  const authenticateAndGetMnemonic = useCallback(async (): Promise<string> => {
    if (!authMethod) {
      throw new Error('钱包未初始化')
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      let credential: string | ArrayBuffer

      if (authMethod === 'pin') {
        // PIN码认证 - 在实际应用中应该通过UI组件获取
        const pin = await requestPinFromUser()
        if (!pin) {
          throw new Error('用户取消了PIN码输入')
        }
        credential = pin
      } else {
        // Passkey认证
        const passkeyCredential = await passkeyAuth.authenticate()
        if (!passkeyCredential) {
          throw new Error('Passkey认证失败')
        }
        credential = passkeyCredential
      }

      // 使用凭据导出助记词
      const mnemonic = await exportMnemonic(credential)
      if (!mnemonic) {
        throw new Error('无法获取钱包助记词')
      }

      return mnemonic
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '认证失败'
      setAuthError(errorMessage)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [authMethod, exportMnemonic])

  /**
   * 请求用户输入PIN码
   * 在实际应用中，这应该通过一个模态框或专门的UI组件来实现
   */
  const requestPinFromUser = (): Promise<string | null> => {
    return new Promise((resolve) => {
      // 这里使用简单的prompt作为示例
      // 在实际应用中应该使用专门的PIN输入组件
      const pin = prompt('请输入您的6位PIN码:')
      resolve(pin)
    })
  }

  /**
   * 验证用户凭据（不导出助记词）
   */
  const verifyCredential = useCallback(async (credential: AuthCredential): Promise<boolean> => {
    if (!authMethod) {
      throw new Error('钱包未初始化')
    }

    if (credential.type !== authMethod) {
      throw new Error('认证方式不匹配')
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      // 尝试导出助记词来验证凭据
      await exportMnemonic(credential.value)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '认证失败'
      setAuthError(errorMessage)
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }, [authMethod, exportMnemonic])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  return {
    isAuthenticating,
    authError,
    authMethod,
    authenticateAndGetMnemonic,
    verifyCredential,
    clearError
  }
}
