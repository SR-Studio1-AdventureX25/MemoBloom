// 智能合约配置
export const CONTRACTS = {
  MEMO_BLOOM_NFT: {
    address: '0x8d38d5e72a3F6c545A663040E92a08277a1c91B4',
    name: 'MemoBloomNFT',
    symbol: 'MEMO'
  }
}

// Injective 测试网配置
export const INJECTIVE_TESTNET = {
  chainId: '1439',
  name: 'Injective Testnet',
  rpcUrl: 'https://testnet.sentry.chain.json-rpc.injective.network',
  explorerUrl: 'https://testnet.explorer.injective.network',
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18
  }
}

// IPFS 配置
export const IPFS_CONFIG = {
  gateway: 'https://ipfs.io/ipfs/',
  pinata: {
    apiKey: '2a2e78c1caa4a5995553',
    secretKey: '40d9be7b3d4a10cda5a0b5ea8cb4e91661e59d1a40588bee46346d87398456fd'
  }
}

// NFT 类型常量
export const NFTType = {
  PLANT_COMPLETION: 0,
  MEMORY_TREASURE: 1
} as const

export type NFTTypeValue = typeof NFTType[keyof typeof NFTType]

// 合约方法名称
export const CONTRACT_METHODS = {
  // 铸造方法
  MINT_PLANT_COMPLETION_NFT: 'mintPlantCompletionNFT',
  MINT_MEMORY_TREASURE_NFT: 'mintMemoryTreasureNFT',
  
  // 查询方法
  GET_PLANT_NFTS_BY_OWNER: 'getPlantNFTsByOwner',
  GET_MEMORY_NFTS_BY_OWNER: 'getMemoryNFTsByOwner',
  IS_PLANT_ELIGIBLE_FOR_NFT: 'isPlantEligibleForNFT',
  IS_RECORD_ELIGIBLE_FOR_NFT: 'isRecordEligibleForNFT',
  GET_TOKEN_ID_BY_PLANT_ID: 'getTokenIdByPlantId',
  GET_TOKEN_ID_BY_RECORD_ID: 'getTokenIdByRecordId',
  GET_PLANT_COMPLETION_DATA: 'getPlantCompletionData',
  GET_MEMORY_TREASURE_DATA: 'getMemoryTreasureData',
  TOTAL_SUPPLY: 'totalSupply',
  
  // ERC721 标准方法
  TOKEN_URI: 'tokenURI',
  OWNER_OF: 'ownerOf',
  BALANCE_OF: 'balanceOf'
}

// Gas 限制配置
export const GAS_LIMITS = {
  MINT_PLANT_NFT: 300000,
  MINT_MEMORY_NFT: 350000,
  QUERY: 100000
}
