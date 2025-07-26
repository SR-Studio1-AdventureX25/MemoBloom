interface WalletInfoProps {
  walletAddress: string
}

export default function WalletInfo({ walletAddress }: WalletInfoProps) {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
  }

  return (
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
        onClick={handleCopyAddress}
        className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm"
      >
        复制地址
      </button>
    </div>
  )
}
