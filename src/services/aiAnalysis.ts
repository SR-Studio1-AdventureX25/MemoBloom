/**
 * AI情感分析服务
 * 集成MiniMax AI API进行文本分析和情感分类
 */

interface MiniMaxConfig {
  apiKey: string
  apiEndpoint: string
  model: string
}

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

interface MiniMaxRequest {
  model: string
  messages: MiniMaxMessage[]
  temperature?: number
  max_tokens?: number
}

interface MiniMaxResponse {
  id: string
  choices: Array<{
    finish_reason: string
    index: number
    message: {
      content: string
      role: string
      name?: string
    }
  }>
  created: number
  model: string
  object: string
  usage: {
    total_tokens: number
    total_characters: number
    prompt_tokens: number
    completion_tokens: number
  }
  input_sensitive: boolean
  output_sensitive: boolean
  input_sensitive_type: number
  output_sensitive_type: number
  output_sensitive_int: number
  base_resp: {
    status_code: number
    status_msg: string
  }
}

interface AnalysisResult {
  success: boolean
  message?: string  // 不超过20字的简短消息
  emotion?: 'happy' | 'sad'
  error?: string
  errorCode?: string
}

export class AIAnalysisService {
  private static instance: AIAnalysisService
  private config: MiniMaxConfig

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_MINIMAX_API_KEY || '',
      apiEndpoint: 'https://api.minimaxi.com/v1/text/chatcompletion_v2',
      model: 'MiniMax-M1'
    }
  }

  public static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService()
    }
    return AIAnalysisService.instance
  }

  /**
   * 验证配置
   */
  private validateConfig(): boolean {
    if (!this.config.apiKey) {
      console.warn('AI分析服务配置缺失，请检查环境变量 VITE_MINIMAX_API_KEY')
      return false
    }
    return true
  }

  /**
   * 调用MiniMax API
   */
  private async callMiniMaxAPI(messages: MiniMaxMessage[]): Promise<MiniMaxResponse> {
    const requestData: MiniMaxRequest = {
      model: this.config.model,
      messages,
      temperature: 0.7,
      max_tokens: 100
    }

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MiniMax API请求失败:', response.status, errorText)
      throw new Error(`API请求失败: ${response.status}`)
    }

    const responseData: MiniMaxResponse = await response.json()

    // 检查API响应状态
    if (responseData.base_resp.status_code !== 0) {
      throw new Error(`API错误: ${responseData.base_resp.status_msg}`)
    }

    return responseData
  }

  /**
   * 生成简短消息（不超过20字）
   */
  async generateMessage(speechText: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: 'AI分析服务配置缺失'
        }
      }

      const messages: MiniMaxMessage[] = [
        {
          role: 'system',
          name: 'MiniMax AI',
          content: `你是一个温暖的植物伙伴，会根据用户的话语生成简短的回应。请根据用户说的话，生成一个不超过20个字的温暖、鼓励性的回应。只返回回应内容，不要其他解释。

要求：
1. 回应要简短，不超过20个字
2. 语气要温暖、友善
3. 要体现植物的特性（成长、生命力等）
4. 只返回一句话，不要额外说明

示例：
用户："今天工作很累"
回应："辛苦了，就像植物需要休息一样🌱"

用户："心情不好"
回应："阴雨过后总会有阳光☀️"`
        },
        {
          role: 'user',
          name: '用户',
          content: speechText
        }
      ]

      console.log('请求生成消息...', speechText)
      const response = await this.callMiniMaxAPI(messages)

      const messageContent = response.choices[0]?.message?.content?.trim()
      
      if (!messageContent) {
        return {
          success: false,
          error: '未生成有效回应'
        }
      }

      // 确保消息不超过20字
      const finalMessage = messageContent.length > 20 ? 
        messageContent.substring(0, 17) + '...' : 
        messageContent

      console.log('生成消息成功:', finalMessage)

      return {
        success: true,
        message: finalMessage
      }

    } catch (error) {
      console.error('生成消息失败:', error)
      
      let errorMessage = '消息生成失败'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 分析情感（happy/sad）
   */
  async analyzeEmotion(speechText: string): Promise<{ success: boolean; emotion?: 'happy' | 'sad'; error?: string }> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: 'AI分析服务配置缺失'
        }
      }

      const messages: MiniMaxMessage[] = [
        {
          role: 'system',
          name: 'MiniMax AI',
          content: `你是一个情感分析专家。请分析用户说话的整体情感倾向，只返回以下两种分类之一：

happy - 表示积极、开心、满足、兴奋、放松、希望等正面情感
sad - 表示消极、难过、焦虑、沮丧、疲惫、失望等负面情感

重要：只返回 "happy" 或 "sad" 这两个词中的一个，不要返回其他任何内容。

分析要求：
1. 关注整体语调和情感倾向
2. 考虑语境和隐含情感
3. 如果情感模糊，倾向于选择更主要的情感
4. 只返回分类结果，不要解释`
        },
        {
          role: 'user',
          name: '用户',
          content: speechText
        }
      ]

      console.log('请求情感分析...', speechText)
      const response = await this.callMiniMaxAPI(messages)

      const emotionResult = response.choices[0]?.message?.content?.trim().toLowerCase()
      
      if (!emotionResult) {
        return {
          success: false,
          error: '未获得情感分析结果'
        }
      }

      // 验证返回结果
      const emotion = emotionResult === 'happy' ? 'happy' : 
                    emotionResult === 'sad' ? 'sad' : null

      if (!emotion) {
        console.warn('情感分析返回了无效结果:', emotionResult)
        // 默认返回 happy 作为降级处理
        return {
          success: true,
          emotion: 'happy'
        }
      }

      console.log('情感分析成功:', emotion)

      return {
        success: true,
        emotion
      }

    } catch (error) {
      console.error('情感分析失败:', error)
      
      let errorMessage = '情感分析失败'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 完整分析（消息生成 + 情感分析）
   */
  async analyzeText(speechText: string): Promise<AnalysisResult> {
    try {
      if (!speechText || speechText.trim().length === 0) {
        return {
          success: false,
          error: '输入文本为空',
          errorCode: 'EMPTY_INPUT'
        }
      }

      // 并行执行消息生成和情感分析
      const [messageResult, emotionResult] = await Promise.all([
        this.generateMessage(speechText),
        this.analyzeEmotion(speechText)
      ])

      // 检查是否都成功
      if (!messageResult.success && !emotionResult.success) {
        return {
          success: false,
          error: '消息生成和情感分析都失败',
          errorCode: 'BOTH_FAILED'
        }
      }

      // 部分成功也算成功，但提供默认值
      return {
        success: true,
        message: messageResult.message || '植物收到了你的心声🌱',
        emotion: emotionResult.emotion || 'happy'
      }

    } catch (error) {
      console.error('文本分析失败:', error)
      
      let errorMessage = '文本分析失败'
      let errorCode = 'UNKNOWN_ERROR'

      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes('网络')) {
          errorCode = 'NETWORK_ERROR'
        } else if (error.message.includes('API')) {
          errorCode = 'API_ERROR'
        }
      }

      return {
        success: false,
        error: errorMessage,
        errorCode
      }
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.validateConfig()
  }

  /**
   * 获取配置状态
   */
  getConfigStatus(): {
    hasApiKey: boolean
    isConfigured: boolean
  } {
    return {
      hasApiKey: !!this.config.apiKey,
      isConfigured: this.validateConfig()
    }
  }
}

// 导出单例实例
export const aiAnalysisService = AIAnalysisService.getInstance()
