import { useState, useEffect } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { injectiveWallet } from '@/services/injectiveWallet'
import { passkeyAuth } from '@/services/passkeyAuth'
import { walletCrypto } from '@/services/walletCrypto'
import PinInput from '@/components/wallet/PinInput'
import MnemonicDisplay from '@/components/wallet/MnemonicDisplay'
import type { WalletSetupStep, WalletPageState } from '@/types'

export default function WalletPage() {
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
    } catch {
      setError('生成助记词失败，请重试')
    }
  }

  // 创建钱包
  const handleCreateWallet = async () => {
    if (!generatedMnemonic) return

    setIsLoading(true)
    setError('')

    try {
      let credential: string | ArrayBuffer

      if (selectedAuthMethod === 'pin') {
        if (pin !== confirmPin) {
          throw new Error('两次输入的PIN码不一致')
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
  const handleUnlockWallet = async () => {
    if (!authMethod) return

    setIsLoading(true)
    setError('')

    try {
      let credential: string | ArrayBuffer

      if (authMethod === 'pin') {
        if (!pin) {
          throw new Error('请输入PIN码')
        }
        credential = pin
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

  // 渲染无钱包状态
  const renderNoWallet = () => (
    <div className="text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-white mb-2">创建钱包</h1>
        <p className="text-white/70">为您的NFT资产创建安全的钱包</p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <button
          onClick={() => setPageState('setup')}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
        >
          <span>✨</span>
          <span>创建新钱包</span>
        </button>

        <div className="text-white/50 text-sm">
          钱包将安全地存储在您的设备上
        </div>
      </div>
    </div>
  )

  // 渲染钱包设置流程
  const renderWalletSetup = () => {
    switch (setupStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">创建钱包</h2>
            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={handleGenerateMnemonic}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                生成助记词
              </button>
              <button
                onClick={() => setPageState('no-wallet')}
                className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
              >
                返回
              </button>
            </div>
          </div>
        )

      case 'backup-mnemonic':
        return (
          <div>
            <MnemonicDisplay
              mnemonic={generatedMnemonic}
              title="备份助记词"
              description="请将助记词安全备份到纸质载体上"
              showConfirmButton={true}
              onConfirm={() => setSetupStep('choose-auth')}
            />
          </div>
        )

      case 'choose-auth':
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">选择安全方式</h2>
            
            <div className="space-y-4 mb-6">
              <button
                onClick={() => {
                  setSelectedAuthMethod('pin')
                  setSetupStep('setup-pin')
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
              >
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <div className="font-semibold">PIN码</div>
                  <div className="text-sm text-white/70">6位数字密码</div>
                </div>
              </button>

              {passkeySupported && (
                <button
                  onClick={() => {
                    setSelectedAuthMethod('passkey')
                    setSetupStep('setup-passkey')
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
                >
                  <span className="text-2xl">🔐</span>
                  <div className="text-left">
                    <div className="font-semibold">Passkey</div>
                    <div className="text-sm text-white/70">生物识别或硬件密钥</div>
                  </div>
                </button>
              )}
            </div>

            <button
              onClick={() => setSetupStep('backup-mnemonic')}
              className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
            >
              返回
            </button>
          </div>
        )

      case 'setup-pin':
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">设置PIN码</h2>
            
            {!confirmPin ? (
              <div>
                <div className="mb-6">
                  <PinInput
                    value={pin}
                    onChange={setPin}
                    placeholder="设置6位PIN码"
                    onComplete={(completedPin) => {
                      setPin(completedPin)
                      setConfirmPin('')
                    }}
                  />
                </div>
                
                {pin.length === 6 && (
                  <button
                    onClick={() => setConfirmPin('')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                  >
                    确认PIN码
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <PinInput
                    value={confirmPin}
                    onChange={setConfirmPin}
                    placeholder="再次输入PIN码"
                    error={confirmPin.length === 6 && pin !== confirmPin}
                    onComplete={handleCreateWallet}
                  />
                </div>
                
                {error && (
                  <div className="text-red-400 text-sm mb-4">{error}</div>
                )}
              </div>
            )}

            <button
              onClick={() => setSetupStep('choose-auth')}
              className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
            >
              返回
            </button>
          </div>
        )

      case 'setup-passkey':
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">设置Passkey</h2>
            
            <div className="bg-white/10 border border-white/20 rounded-lg p-6 mb-6 backdrop-blur-sm">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-white/70 text-sm mb-4">
                点击下方按钮，使用您的生物识别或硬件密钥来保护钱包
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {isLoading ? '设置中...' : '设置Passkey'}
              </button>

              <button
                onClick={() => setSetupStep('choose-auth')}
                className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
              >
                返回
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-4">{error}</div>
            )}
          </div>
        )

      case 'complete':
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">钱包创建成功</h2>
            <p className="text-white/70">正在跳转到钱包页面...</p>
          </div>
        )

      default:
        return null
    }
  }

  // 渲染锁定状态
  const renderLocked = () => (
    <div className="text-center max-w-sm mx-auto">
      <div className="mb-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-2">钱包已锁定</h1>
        <p className="text-white/70">请输入{authMethod === 'pin' ? 'PIN码' : 'Passkey'}解锁</p>
      </div>

      {authMethod === 'pin' ? (
        <div>
          <div className="mb-6">
            <PinInput
              value={pin}
              onChange={(newPin) => {
                setPin(newPin)
                clearError()
              }}
              placeholder="输入PIN码解锁"
              error={!!error}
              onComplete={handleUnlockWallet}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm mb-4">{error}</div>
          )}

          {walletCrypto.isPinBlocked() && (
            <div className="text-red-400 text-sm mb-4">
              PIN码已锁定，请等待{walletCrypto.getRemainingBlockTime()}分钟
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={handleUnlockWallet}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>🔐</span>
            <span>{isLoading ? '验证中...' : '使用Passkey解锁'}</span>
          </button>

          {error && (
            <div className="text-red-400 text-sm mt-4">{error}</div>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleDeleteWallet}
          className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
        >
          删除钱包
        </button>
      </div>
    </div>
  )

  // 渲染解锁状态
  const renderUnlocked = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">💼</div>
        <h1 className="text-3xl font-bold text-white mb-2">我的钱包</h1>
        <p className="text-white/70">专为MemoBloom NFT设计</p>
      </div>

      {/* 钱包地址卡片 */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">钱包地址</h3>
          <div className="text-green-400 text-sm flex items-center space-x-1">
            <span>🟢</span>
            <span>已解锁</span>
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3 font-mono text-sm text-white/80 break-all">
          {walletAddress}
        </div>
        
        <button
          onClick={() => navigator.clipboard.writeText(walletAddress || '')}
          className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm"
        >
          复制地址
        </button>
      </div>

      {/* NFT资产 */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-6 backdrop-blur-sm">
        <h3 className="text-white font-semibold mb-4">NFT资产</h3>
        <div className="text-center text-white/50 py-8">
          <div className="text-4xl mb-2">🎨</div>
          <p>暂无NFT资产</p>
          <p className="text-sm mt-1">通过浇水记录铸造您的第一个NFT</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <button
          onClick={handleLockWallet}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
        >
          <span>🔒</span>
          <span>锁定钱包</span>
        </button>

        <button
          onClick={handleDeleteWallet}
          className="w-full text-red-400 hover:text-red-300 py-3 px-4 rounded-lg transition-all duration-200 text-sm"
        >
          删除钱包
        </button>
      </div>
    </div>
  )

  // 主渲染逻辑
  const renderContent = () => {
    switch (pageState) {
      case 'no-wallet':
        return renderNoWallet()
      case 'setup':
        return renderWalletSetup()
      case 'locked':
        return renderLocked()
      case 'unlocked':
        return renderUnlocked()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-16 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 p-6 pt-16 min-h-screen flex items-center justify-center">
        {renderContent()}
      </div>

      {/* 上滑提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="inline-flex items-center text-white/60">
          <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l7-7 7 7m-7-7v18" />
          </svg>
          <span className="text-sm">上滑返回数字图书馆</span>
        </div>
      </div>
    </div>
  )
}
