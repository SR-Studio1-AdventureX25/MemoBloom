import * as bip39 from 'bip39'
import { PrivateKey } from '@injectivelabs/sdk-ts'
import type { MnemonicInfo } from '@/types'

export class InjectiveWalletService {
  private static instance: InjectiveWalletService
  
  static getInstance(): InjectiveWalletService {
    if (!this.instance) {
      this.instance = new InjectiveWalletService()
    }
    return this.instance
  }

  // 生成新的助记词
  generateMnemonic(): string {
    try {
      return bip39.generateMnemonic(128) // 12个单词
    } catch (error) {
      console.error('生成助记词失败:', error)
      throw new Error('生成助记词失败')
    }
  }

  // 验证助记词是否有效
  validateMnemonic(mnemonic: string): boolean {
    try {
      return bip39.validateMnemonic(mnemonic.trim())
    } catch (error) {
      console.error('验证助记词失败:', error)
      return false
    }
  }

  // 从助记词生成钱包信息
  async generateWalletFromMnemonic(mnemonic: string): Promise<MnemonicInfo> {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词')
      }

      // 使用 Injective SDK 从助记词生成私钥
      // Injective 使用标准的 Ethereum 兼容路径: m/44'/60'/0'/0/0
      const privateKey = PrivateKey.fromMnemonic(mnemonic.trim(), "m/44'/60'/0'/0/0")
      
      // 直接从私钥生成 Injective 地址
      const address = privateKey.toBech32()
      
      // 获取公钥的十六进制表示
      const publicKeyHex = privateKey.toPublicKey().toHex()

      return {
        mnemonic: mnemonic.trim(),
        address: address,
        publicKey: publicKeyHex
      }
    } catch (error) {
      console.error('从助记词生成钱包失败:', error)
      throw new Error('钱包生成失败')
    }
  }


  // 验证Injective地址格式
  validateInjectiveAddress(address: string): boolean {
    try {
      // Injective地址以inj开头，长度为42字符
      const addressRegex = /^inj[a-z0-9]{39}$/
      return addressRegex.test(address)
    } catch (error) {
      console.error('验证地址失败:', error)
      return false
    }
  }

  // 格式化地址显示（显示前6位和后4位）
  formatAddress(address: string): string {
    if (!address || address.length < 10) {
      return address
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 从助记词恢复钱包
  async recoverWalletFromMnemonic(mnemonic: string): Promise<MnemonicInfo> {
    return this.generateWalletFromMnemonic(mnemonic)
  }

  // 检查助记词单词是否在词典中
  isValidMnemonicWord(word: string): boolean {
    try {
      const wordlist = bip39.wordlists.english
      return wordlist.includes(word.toLowerCase())
    } catch (error) {
      console.error('检查助记词单词失败:', error)
      return false
    }
  }

  // 获取助记词建议（用于自动完成）
  getMnemonicSuggestions(prefix: string): string[] {
    try {
      if (!prefix || prefix.length < 2) {
        return []
      }
      
      const wordlist = bip39.wordlists.english
      const suggestions = wordlist.filter(word => 
        word.toLowerCase().startsWith(prefix.toLowerCase())
      )
      
      return suggestions.slice(0, 5) // 最多返回5个建议
    } catch (error) {
      console.error('获取助记词建议失败:', error)
      return []
    }
  }

  // 生成随机的助记词顺序（用于验证）
  shuffleMnemonicWords(mnemonic: string): { word: string; originalIndex: number }[] {
    try {
      const words = mnemonic.trim().split(' ')
      const wordObjects = words.map((word, index) => ({
        word,
        originalIndex: index
      }))
      
      // Fisher-Yates洗牌算法
      for (let i = wordObjects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[wordObjects[i], wordObjects[j]] = [wordObjects[j], wordObjects[i]]
      }
      
      return wordObjects
    } catch (error) {
      console.error('打乱助记词顺序失败:', error)
      return []
    }
  }

  // 验证助记词顺序是否正确
  verifyMnemonicOrder(originalMnemonic: string, selectedWords: string[]): boolean {
    try {
      const originalWords = originalMnemonic.trim().split(' ')
      
      if (originalWords.length !== selectedWords.length) {
        return false
      }
      
      return originalWords.every((word, index) => 
        word === selectedWords[index]
      )
    } catch (error) {
      console.error('验证助记词顺序失败:', error)
      return false
    }
  }

  // 清理助记词字符串
  cleanMnemonic(mnemonic: string): string {
    return mnemonic
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
      .replace(/[^\w\s]/g, '') // 移除特殊字符
  }
}

export const injectiveWallet = InjectiveWalletService.getInstance()
