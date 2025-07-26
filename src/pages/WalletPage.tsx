import { useAppStore } from '@/store'
import { useWalletSetup } from '@/hooks/wallet/useWalletSetup'
import { useNFTMinting } from '@/hooks/wallet/useNFTMinting'
import NoWalletView from '@/components/wallet/views/NoWalletView'
import LockedWalletView from '@/components/wallet/views/LockedWalletView'
import UnlockedWalletView from '@/components/wallet/views/UnlockedWalletView'
import WalletSetupFlow from '@/components/wallet/setup/WalletSetupFlow'

export default function WalletPage() {
  // 获取收藏数据
  const { favoritePlants, favoriteWateringRecords } = useAppStore()
  
  // 钱包设置相关状态和函数
  const {
    pageState,
    setupStep,
    pin,
    confirmPin,
    generatedMnemonic,
    isLoading: setupLoading,
    error: setupError,
    passkeySupported,
    walletAddress,
    authMethod,
    setPageState,
    setSetupStep,
    setPin,
    setConfirmPin,
    setSelectedAuthMethod,
    clearError,
    handleGenerateMnemonic,
    handleImportComplete,
    handleCreateWallet,
    handleUnlockWallet,
    handleLockWallet,
    handleDeleteWallet
  } = useWalletSetup()

  // NFT铸造相关状态和函数
  const {
    isLoading: nftLoading,
    error: nftError,
    mintPlantNFT,
    mintWateringRecordNFT,
    clearError: clearNFTError
  } = useNFTMinting(walletAddress)

  // 合并加载状态和错误状态
  const isLoading = setupLoading || nftLoading
  const error = setupError || nftError
  const handleClearError = () => {
    clearError()
    clearNFTError()
  }

  // 主渲染逻辑
  const renderContent = () => {
    switch (pageState) {
      case 'no-wallet':
        return (
          <NoWalletView
            onCreateWallet={handleGenerateMnemonic}
            onImportWallet={() => {
              setPageState('setup')
              setSetupStep('import-mnemonic')
            }}
          />
        )
      
      case 'setup':
        return (
          <WalletSetupFlow
            setupStep={setupStep}
            generatedMnemonic={generatedMnemonic}
            pin={pin}
            confirmPin={confirmPin}
            passkeySupported={passkeySupported}
            isLoading={isLoading}
            error={error}
            onSetupStepChange={setSetupStep}
            onGenerateMnemonic={handleGenerateMnemonic}
            onImportComplete={handleImportComplete}
            onAuthMethodChange={setSelectedAuthMethod}
            onPinChange={setPin}
            onConfirmPinChange={setConfirmPin}
            onCreateWallet={handleCreateWallet}
            onCancel={() => setPageState('no-wallet')}
          />
        )
      
      case 'locked':
        return (
          <LockedWalletView
            authMethod={authMethod}
            pin={pin}
            onPinChange={setPin}
            onUnlock={handleUnlockWallet}
            onDeleteWallet={handleDeleteWallet}
            error={error}
            isLoading={isLoading}
            onClearError={handleClearError}
          />
        )
      
      case 'unlocked':
        return (
          <UnlockedWalletView
            walletAddress={walletAddress || ''}
            favoritePlants={favoritePlants}
            favoriteWateringRecords={favoriteWateringRecords}
            onMintPlantNFT={mintPlantNFT}
            onMintWateringRecordNFT={mintWateringRecordNFT}
            onLockWallet={handleLockWallet}
            onDeleteWallet={handleDeleteWallet}
            isLoading={isLoading}
            error={error}
          />
        )
      
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
    </div>
  )
}
