interface NoWalletViewProps {
  onCreateWallet: () => void
  onImportWallet: () => void
}

export default function NoWalletView({ onCreateWallet, onImportWallet }: NoWalletViewProps) {
  return (
    <div className="text-center max-w-sm mx-auto">
      <div className="mb-8">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-white mb-2">钱包设置</h1>
        <p className="text-white/70">为您的NFT资产创建安全的钱包</p>
      </div>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={onCreateWallet}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
        >
          <span className="text-2xl">✨</span>
          <div className="text-left">
            <div className="font-semibold">创建新钱包</div>
            <div className="text-sm text-white/70">生成新的助记词</div>
          </div>
        </button>

        <button
          onClick={onImportWallet}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-3"
        >
          <span className="text-2xl">📥</span>
          <div className="text-left">
            <div className="font-semibold">导入现有钱包</div>
            <div className="text-sm text-white/70">使用已有的助记词</div>
          </div>
        </button>
      </div>

      <div className="text-white/50 text-sm">
        钱包将安全地存储在您的设备上
      </div>
    </div>
  )
}
