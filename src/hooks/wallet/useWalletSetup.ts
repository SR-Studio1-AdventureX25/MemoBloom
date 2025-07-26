import { useState, useEffect } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { injectiveWallet } from '@/services/injectiveWallet'
import { passkeyAuth } from '@/services/passkeyAuth'
import { walletCrypto } from '@/services/walletCrypto'
import type { WalletSetupStep, WalletPageState } from '@/types'

export function useWalletSetup() {
  const {
    walletAddress,
    isWalletLocked,
    authMethod,
    createWallet,
    unlockWallet,
    lockWallet,
    deleteWallet
  } = useWalletStore()

  const [pageState, setPageState] = useState<WalletPageState>('no-wallet')
  const [setupStep, setSetupStep] = useState<WalletSetupStep>('welcome')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<'pin' | 'passkey'>('pin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [passkeySupported, setPasskeySupported] = useState(false)

  // 初始化页面状态
  useEffect(() => {
    const initializePageState = async () => {
      if (!walletAddress) {
        setPageState('no-wallet')
      } else if (isWalletLocked) {
        setPageState('locked')
      } else {
        setPageState('unlocked')
      }

      // 检查Passkey支持
      const supported = await passkeyAuth.isAvailable()
      setPasskeySupported(supported)
    }

    initializePageState()
  }, [walletAddress, isWalletLocked])

  // 清除错误
  const clearError = () => setError('')

  // 生成新助记词
  const handleGenerateMnemonic = () => {
    try {
      const mnemonic = injectiveWallet.generateMnemonic()
      setGeneratedMnemonic(mnemonic)
      setSetupStep('backup-mnemonic')
      setPageState('setup')
    } catch {
      setError('生成助记词失败，请重试')
    }
  }

  // 处理导入助记词完成
  const handleImportComplete = (mnemonic: string) => {
    setGeneratedMnemonic(mnemonic)
    setSetupStep('choose-auth')
  }

  // 创建钱包
  const handleCreateWallet = async () => {
    if (!generatedMnemonic) return

    setIsLoading(true)
    setError('')

    try {
      let credential: string | ArrayBuffer

      if (selectedAuthMethod === 'pin') {
        // 处理确认PIN码的逻辑
        const actualConfirmPin = confirmPin === 'CONFIRM_STEP' ? '' : confirmPin
        console.log('创建钱包时的PIN码比较:', { pin, confirmPin, actualConfirmPin })
        
        if (pin !== actualConfirmPin) {
          throw new Error(`两次输入的PIN码不一致: "${pin}" vs "${actualConfirmPin}"`)
        }
        if (!walletCrypto.validatePin(pin)) {
          throw new Error('PIN码必须是6位数字')
        }
        credential = pin
      } else {
        // 注册Passkey
        const passkeyCredential = await passkeyAuth.register()
        credential = passkeyCredential.publicKey
      }

      const success = await createWallet(generatedMnemonic, selectedAuthMethod, credential)
      
      if (success) {
        setSetupStep('complete')
        setTimeout(() => {
          setPageState('unlocked')
          setSetupStep('welcome')
          setPin('')
          setConfirmPin('')
          setGeneratedMnemonic('')
        }, 2000)
      } else {
        throw new Error('创建钱包失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建钱包失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 解锁钱包
  const handleUnlockWallet = async (pinCode?: string) => {
    if (!authMethod) return

    setIsLoading(true)
    setError('')

    try {
      let credential: string | ArrayBuffer

      if (authMethod === 'pin') {
        const currentPin = pinCode || pin
        if (!currentPin || currentPin.length !== 6) {
          throw new Error('请输入完整的6位PIN码')
        }
        console.log('尝试使用PIN码解锁:', currentPin)
        credential = currentPin
      } else {
        // 使用Passkey认证
        credential = await passkeyAuth.authenticate()
      }

      const success = await unlockWallet(credential)
      
      if (success) {
        setPin('')
        setPageState('unlocked')
      } else {
        throw new Error('解锁失败，请检查PIN码或重试')
      }
    } catch (error) {
      console.error('解锁钱包错误:', error)
      setError(error instanceof Error ? error.message : '解锁失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 锁定钱包
  const handleLockWallet = () => {
    lockWallet()
    setPin('')
    setPageState('locked')
  }

  // 删除钱包
  const handleDeleteWallet = async () => {
    if (!confirm('确定要删除钱包吗？此操作不可恢复！')) {
      return
    }

    setIsLoading(true)
    try {
      const success = await deleteWallet()
      if (success) {
        setPageState('no-wallet')
        setPin('')
        setConfirmPin('')
        setGeneratedMnemonic('')
        setSetupStep('welcome')
      }
    } catch {
      setError('删除钱包失败')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // 状态
    pageState,
    setupStep,
    pin,
    confirmPin,
    generatedMnemonic,
    selectedAuthMethod,
    isLoading,
    error,
    passkeySupported,
    walletAddress,
    authMethod,
    
    // 状态设置函数
    setPageState,
    setSetupStep,
    setPin,
    setConfirmPin,
    setSelectedAuthMethod,
    
    // 处理函数
    clearError,
    handleGenerateMnemonic,
    handleImportComplete,
    handleCreateWallet,
    handleUnlockWallet,
    handleLockWallet,
    handleDeleteWallet
  }
}
