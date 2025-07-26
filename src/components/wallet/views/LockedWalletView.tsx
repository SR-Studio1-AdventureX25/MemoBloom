import PinInputOTP from '@/components/wallet/PinInputOTP'
import { walletCrypto } from '@/services/walletCrypto'

interface LockedWalletViewProps {
  authMethod: 'pin' | 'passkey' | null
  pin: string
  onPinChange: (pin: string) => void
  onUnlock: (pinCode?: string) => void
  onDeleteWallet: () => void
  error: string
  isLoading: boolean
  onClearError: () => void
}

export default function LockedWalletView({
  authMethod,
  pin,
  onPinChange,
  onUnlock,
  onDeleteWallet,
  error,
  isLoading,
  onClearError
}: LockedWalletViewProps) {
  return (
    <div className="text-center max-w-sm mx-auto">
      <div className="mb-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-2">钱包已锁定</h1>
        <p className="text-white/70">请输入{authMethod === 'pin' ? 'PIN码' : 'Passkey'}解锁</p>
      </div>

      {authMethod === 'pin' ? (
        <div>
          <div className="mb-6">
            <PinInputOTP
              value={pin}
              onChange={(newPin: string) => {
                onPinChange(newPin)
                onClearError()
                // 不在这里触发解锁，只在onComplete时触发
              }}
              placeholder="输入PIN码解锁"
              error={!!error}
              onComplete={(completedPin: string) => {
                console.log('PIN码输入完成，准备解锁:', completedPin)
                // 直接使用完成的PIN码进行解锁，不依赖状态同步
                if (completedPin.length === 6) {
                  onUnlock(completedPin)
                }
              }}
              disabled={isLoading}
              label=""
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
            onClick={() => onUnlock()}
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
          onClick={onDeleteWallet}
          className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
        >
          删除钱包
        </button>
      </div>
    </div>
  )
}
