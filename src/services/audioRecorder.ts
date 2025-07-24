// 录音服务类
export class AudioRecorderService {
  private static instance: AudioRecorderService
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null
  private recordedChunks: Blob[] = []
  private isRecording = false
  private recordingStartTime = 0

  // 录音配置
  private readonly config = {
    mimeType: 'audio/webm;codecs=opus', // 优先使用 WebM/Opus
    audioBitsPerSecond: 64000, // 64kbps，平衡质量和文件大小
    maxDuration: 60000, // 最大录音时長60秒
    minDuration: 1000   // 最小录音时長1秒
  }

  public static getInstance(): AudioRecorderService {
    if (!AudioRecorderService.instance) {
      AudioRecorderService.instance = new AudioRecorderService()
    }
    return AudioRecorderService.instance
  }

  // 请求麦克风权限
  async requestPermission(): Promise<boolean> {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器不支持录音功能')
      }

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,  // 回声消除
          noiseSuppression: true,  // 噪音抑制
          autoGainControl: true,   // 自动增益控制
          sampleRate: 48000        // 采样率
        }
      })

      // 立即停止流（只是为了获取权限）
      stream.getTracks().forEach(track => track.stop())
      
      return true
    } catch (error) {
      console.error('请求麦克风权限失败:', error)
      return false
    }
  }

  // 开始录音
  async startRecording(): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查是否已在录音
      if (this.isRecording) {
        return { success: false, error: '已在录音中' }
      }

      // 获取音频流
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      })

      // 检查浏览器对不同格式的支持
      let mimeType = this.config.mimeType
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // 尝试其他格式
        const fallbackTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ]
        
        mimeType = fallbackTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''
        
        if (!mimeType) {
          throw new Error('当前浏览器不支持音频录制')
        }
      }

      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: this.config.audioBitsPerSecond
      })

      // 清空之前的录音数据
      this.recordedChunks = []

      // 监听录音数据
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      // 监听录音停止
      this.mediaRecorder.onstop = () => {
        console.log('录音已停止')
      }

      // 监听错误
      this.mediaRecorder.onerror = (event) => {
        console.error('录音错误:', event)
      }

      // 开始录音
      this.mediaRecorder.start(250) // 每250ms收集一次数据
      this.isRecording = true
      this.recordingStartTime = Date.now()

      // 设置最大录音时长
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording()
        }
      }, this.config.maxDuration)

      return { success: true }

    } catch (error) {
      console.error('开始录音失败:', error)
      this.cleanup()
      
      let errorMessage = '录音失败'
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '请允许使用麦克风权限'
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = '当前浏览器不支持录音'
        } else {
          errorMessage = error.message
        }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 停止录音
  async stopRecording(): Promise<{ success: boolean; audioBlob?: Blob; duration?: number; error?: string }> {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        return { success: false, error: '当前没有在录音' }
      }

      // 计算录音时长
      const duration = Date.now() - this.recordingStartTime

      // 检查最小录音时长
      if (duration < this.config.minDuration) {
        this.cleanup()
        return { success: false, error: `录音时间太短，至少需要${this.config.minDuration / 1000}秒` }
      }

      return new Promise((resolve) => {
        if (!this.mediaRecorder) {
          resolve({ success: false, error: '录音器未初始化' })
          return
        }

        // 监听停止事件
        this.mediaRecorder.onstop = () => {
          try {
            // 创建音频 Blob
            const audioBlob = new Blob(this.recordedChunks, {
              type: this.mediaRecorder?.mimeType || 'audio/webm'
            })

            this.cleanup()
            
            resolve({
              success: true,
              audioBlob,
              duration
            })
          } catch (error) {
            console.error('处理录音数据失败:', error)
            this.cleanup()
            resolve({ success: false, error: '处理录音数据失败' })
          }
        }

        // 停止录音
        this.mediaRecorder.stop()
        this.isRecording = false
      })

    } catch (error) {
      console.error('停止录音失败:', error)
      this.cleanup()
      return { success: false, error: '停止录音失败' }
    }
  }

  // 取消录音
  cancelRecording(): void {
    this.cleanup()
  }

  // 清理资源
  private cleanup(): void {
    this.isRecording = false
    this.recordingStartTime = 0
    this.recordedChunks = []

    // 停止媒体流
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }

    // 清理 MediaRecorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
      this.mediaRecorder = null
    }
  }

  // 获取录音状态
  getRecordingState(): {
    isRecording: boolean
    duration: number
    isSupported: boolean
  } {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
      isSupported: AudioRecorderService.isSupported()
    }
  }

  // 检查录音支持
  static isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    )
  }

  // 格式化录音时长
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${remainingSeconds}"`
    }
  }

  // 获取音频文件大小（估算）
  static getEstimatedSize(durationMs: number, bitRate: number = 64000): number {
    return Math.floor((durationMs / 1000) * (bitRate / 8))
  }
}

// 导出单例实例
export const audioRecorderService = AudioRecorderService.getInstance()
