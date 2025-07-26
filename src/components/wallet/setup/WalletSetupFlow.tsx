import MnemonicDisplay from '@/components/wallet/MnemonicDisplay'
import MnemonicImport from '@/components/wallet/MnemonicImport'
import PinInputOTP from '@/components/wallet/PinInputOTP'
import type { WalletSetupStep } from '@/types'

interface WalletSetupFlowProps {
  setupStep: WalletSetupStep
  generatedMnemonic: string
  pin: string
  confirmPin: string
  passkeySupported: boolean // 暂时未使用，passkey功能已禁用
  isLoading: boolean
  error: string
  onSetupStepChange: (step: WalletSetupStep) => void
  onGenerateMnemonic: () => void
  onImportComplete: (mnemonic: string) => void
  onAuthMethodChange: (method: 'pin' | 'passkey') => void
  onPinChange: (pin: string) => void
  onConfirmPinChange: (pin: string) => void
  onCreateWallet: () => void
  onCancel: () => void
}

export default function WalletSetupFlow({
  setupStep,
  generatedMnemonic,
  pin,
  confirmPin,
  passkeySupported, // eslint-disable-line @typescript-eslint/no-unused-vars
  isLoading,
  error,
  onSetupStepChange,
  onGenerateMnemonic,
  onImportComplete,
  onAuthMethodChange,
  onPinChange,
  onConfirmPinChange,
  onCreateWallet,
  onCancel
}: WalletSetupFlowProps) {
  switch (setupStep) {
    case 'welcome':
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">钱包设置</h2>
          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={() => onSetupStepChange('choose-method')}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>开始设置</span>
            </button>
            <button
              onClick={onCancel}
              className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
            >
              返回
            </button>
          </div>
        </div>
      )

    case 'choose-method':
      return (
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">选择设置方式</h2>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={onGenerateMnemonic}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
            >
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <div className="font-semibold">创建新钱包</div>
                <div className="text-sm text-white/70">生成新的助记词</div>
              </div>
            </button>

            <button
              onClick={() => onSetupStepChange('import-mnemonic')}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
            >
              <span className="text-2xl">📥</span>
              <div className="text-left">
                <div className="font-semibold">导入现有钱包</div>
                <div className="text-sm text-white/70">使用已有的助记词</div>
              </div>
            </button>
          </div>

          <button
            onClick={() => onSetupStepChange('welcome')}
            className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
          >
            返回
          </button>
        </div>
      )

    case 'import-mnemonic':
      return (
        <MnemonicImport
          onImportComplete={onImportComplete}
          onCancel={onCancel}
        />
      )

    case 'backup-mnemonic':
      return (
        <div>
          <MnemonicDisplay
            mnemonic={generatedMnemonic}
            title="备份助记词"
            description="请将助记词安全备份到纸质载体上"
            showConfirmButton={true}
            onConfirm={() => onSetupStepChange('choose-auth')}
          />
        </div>
      )

    case 'choose-auth':
      return (
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">设置安全方式</h2>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={() => {
                onAuthMethodChange('pin')
                onSetupStepChange('setup-pin')
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
            >
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <div className="font-semibold">PIN码</div>
                <div className="text-sm text-white/70">6位数字密码</div>
              </div>
            </button>

            {/* Passkey功能暂时禁用 - 取消注释下面的代码块来重新启用 */}
            {passkeySupported && (
              <button
                onClick={() => {
                  onAuthMethodChange('passkey')
                  onSetupStepChange('setup-passkey')
                }}
                disabled
                className="line-through w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
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
            onClick={() => onSetupStepChange('choose-method')}
            className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
          >
            返回
          </button>
        </div>
      )

    case 'setup-pin': {
      const isConfirmStep = confirmPin !== ''
      
      return (
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">设置PIN码</h2>
          
          <div className="space-y-6">
            {!isConfirmStep ? (
              // 第一步：设置PIN码
              <div>
                <div className="mb-4 text-white/70 text-sm">
                  请设置6位数字PIN码
                </div>
                <PinInputOTP
                  value={pin}
                  onChange={onPinChange}
                  placeholder="设置6位PIN码"
                  label=""
                />
                
                {pin.length === 6 && (
                  <button
                    onClick={() => onConfirmPinChange('CONFIRM_STEP')}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold mt-4"
                  >
                    下一步：确认PIN码
                  </button>
                )}
              </div>
            ) : (
              // 第二步：确认PIN码
              <div>
                <div className="mb-4 text-white/70 text-sm">
                  第一次输入的PIN码：{pin}
                </div>
                <div className="mb-4 text-white/70 text-sm">
                  请再次输入相同的PIN码
                </div>
                <PinInputOTP
                  value={confirmPin === 'CONFIRM_STEP' ? '' : confirmPin}
                  onChange={(value) => {
                    console.log('确认PIN码输入:', value, '原PIN码:', pin)
                    onConfirmPinChange(value)
                  }}
                  placeholder="确认PIN码"
                  error={confirmPin.length === 6 && confirmPin !== 'CONFIRM_STEP' && pin !== confirmPin}
                  label=""
                />
                
                {confirmPin.length === 6 && confirmPin !== 'CONFIRM_STEP' && (
                  <div className="mt-4">
                    {pin === confirmPin ? (
                      <div>
                        <div className="text-green-400 text-sm mb-2">PIN码一致！</div>
                        <button
                          onClick={onCreateWallet}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
                        >
                          {isLoading ? '创建中...' : '创建钱包'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-red-400 text-sm">
                        两次输入的PIN码不一致<br/>
                        第一次：{pin}<br/>
                        第二次：{confirmPin}
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    onConfirmPinChange('')
                    onPinChange('')
                  }}
                  className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 mt-4"
                >
                  重新设置
                </button>
              </div>
            )}
            
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
          </div>

          <button
            onClick={() => onSetupStepChange('choose-auth')}
            className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200 mt-6"
          >
            返回
          </button>
        </div>
      )
    }

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
              onClick={onCreateWallet}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {isLoading ? '设置中...' : '设置Passkey'}
            </button>

            <button
              onClick={() => onSetupStepChange('choose-auth')}
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
