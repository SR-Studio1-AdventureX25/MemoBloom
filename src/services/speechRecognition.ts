/**
 * 语音识别服务
 * 集成字节跳动大模型录音文件极速识别API
 */

interface SpeechRecognitionConfig {
  appId: string
  accessKey: string
  resourceId: string
  apiEndpoint: string
}

interface SpeechRecognitionRequest {
  user: {
    uid: string
  }
  audio: {
    url?: string
    data?: string // base64编码音频内容
  }
  request: {
    model_name: string
  }
}

interface SpeechRecognitionResponse {
  audio_info: {
    duration: number
  }
  result: {
    additions: {
      duration: string
    }
    text: string
    utterances: Array<{
      end_time: number
      start_time: number
      text: string
      words: Array<{
        confidence: number
        end_time: number
        start_time: number
        text: string
      }>
    }>
  }
}

interface SpeechRecognitionResult {
  success: boolean
  text?: string
  duration?: number
  error?: string
  errorCode?: string
}

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService
  private config: SpeechRecognitionConfig

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_VOLC_APP_ID || '',
      accessKey: import.meta.env.VITE_VOLC_ACCESS_KEY || '',
      resourceId: 'volc.bigasr.auc_turbo',
      apiEndpoint: 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash'
    }
  }

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService()
    }
    return SpeechRecognitionService.instance
  }

  /**
   * 将音频Blob转换为base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除data URL前缀，只保留base64数据
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return crypto.randomUUID()
  }

  /**
   * 验证配置
   */
  private validateConfig(): boolean {
    if (!this.config.appId || !this.config.accessKey) {
      console.warn('语音识别服务配置缺失，请检查环境变量 VITE_VOLC_APP_ID 和 VITE_VOLC_ACCESS_KEY')
      return false
    }
    return true
  }

  /**
   * 识别音频文件中的语音
   * @param audioBlob 音频文件Blob
   * @returns 识别结果
   */
  async recognizeAudio(audioBlob: Blob): Promise<SpeechRecognitionResult> {
    try {
      // 验证配置
      if (!this.validateConfig()) {
        return {
          success: false,
          error: '语音识别服务配置缺失',
          errorCode: 'CONFIG_MISSING'
        }
      }

      // 检查音频文件大小（限制100MB）
      if (audioBlob.size > 100 * 1024 * 1024) {
        return {
          success: false,
          error: '音频文件过大，超过100MB限制',
          errorCode: 'FILE_TOO_LARGE'
        }
      }

      // 转换音频为base64
      const base64Audio = await this.blobToBase64(audioBlob)

      // 构建请求数据
      const requestData: SpeechRecognitionRequest = {
        user: {
          uid: this.config.appId
        },
        audio: {
          data: base64Audio
        },
        request: {
          model_name: 'bigmodel'
        }
      }

      // 构建请求头
      const headers = {
        'Content-Type': 'application/json',
        'X-Api-App-Key': this.config.appId,
        'X-Api-Access-Key': this.config.accessKey,
        'X-Api-Resource-Id': this.config.resourceId,
        'X-Api-Request-Id': this.generateRequestId(),
        'X-Api-Sequence': '-1'
      }

      console.log('发送语音识别请求...')

      // 发送请求
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      })

      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text()
        console.error('语音识别API请求失败:', response.status, errorText)
        
        return {
          success: false,
          error: `API请求失败: ${response.status}`,
          errorCode: `HTTP_${response.status}`
        }
      }

      // 解析响应
      const responseData: SpeechRecognitionResponse = await response.json()

      // 检查是否有识别结果
      if (!responseData.result || !responseData.result.text) {
        return {
          success: false,
          error: '未识别到语音内容',
          errorCode: 'NO_SPEECH_DETECTED'
        }
      }

      console.log('语音识别成功:', responseData.result.text)

      return {
        success: true,
        text: responseData.result.text.trim(),
        duration: responseData.audio_info.duration
      }

    } catch (error) {
      console.error('语音识别失败:', error)
      
      let errorMessage = '语音识别失败'
      let errorCode = 'UNKNOWN_ERROR'

      if (error instanceof Error) {
        errorMessage = error.message
        
        // 根据错误类型设置错误码
        if (error.message.includes('网络')) {
          errorCode = 'NETWORK_ERROR'
        } else if (error.message.includes('权限')) {
          errorCode = 'PERMISSION_ERROR'
        } else if (error.message.includes('格式')) {
          errorCode = 'FORMAT_ERROR'
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
   * 获取支持的音频格式
   */
  getSupportedFormats(): string[] {
    return ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg']
  }

  /**
   * 获取配置状态
   */
  getConfigStatus(): {
    hasAppId: boolean
    hasAccessKey: boolean
    isConfigured: boolean
  } {
    return {
      hasAppId: !!this.config.appId,
      hasAccessKey: !!this.config.accessKey,
      isConfigured: this.validateConfig()
    }
  }
}

// 导出单例实例
export const speechRecognitionService = SpeechRecognitionService.getInstance()
