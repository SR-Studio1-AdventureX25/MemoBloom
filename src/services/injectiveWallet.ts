import * as bip39 from 'bip39'
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

      // 生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic)
      
      // 简化版本：生成模拟的Injective地址
      const address = this.generateMockInjectiveAddress(seed)
      const publicKey = this.generateMockPublicKey(seed)

      return {
        mnemonic: mnemonic.trim(),
        address,
        publicKey
      }
    } catch (error) {
      console.error('从助记词生成钱包失败:', error)
      throw new Error('钱包生成失败')
    }
  }

  // 生成模拟的Injective地址（用于开发阶段）
  private generateMockInjectiveAddress(seed: Buffer): string {
    // 使用种子生成确定性的地址
    const hash = this.createHash(seed.toString('hex') + 'address')
    const addressBytes = hash.slice(0, 20) // 取前20字节
    
    // 转换为bech32格式的模拟地址
    const addressHex = addressBytes.toString('hex')
    return `inj${addressHex.slice(0, 39)}`
  }

  // 生成模拟的公钥
  private generateMockPublicKey(seed: Buffer): string {
    const hash = this.createHash(seed.toString('hex') + 'pubkey')
    return hash.toString('hex').slice(0, 64) // 32字节公钥
  }

  // 创建哈希（替代crypto.createHash）
  private createHash(data: string): Buffer {
    // 简单的哈希实现，用于生成确定性的地址
    let hash = 0
    const bytes = new Array(32)
    
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) & 0xffffffff
    }
    
    // 填充32字节的模拟哈希
    for (let i = 0; i < 32; i++) {
      bytes[i] = (hash + i * 37) & 0xff
    }
    
    return Buffer.from(bytes)
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
