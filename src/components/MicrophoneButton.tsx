import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { audioRecorderService, AudioRecorderService } from '@/services/audioRecorder'
import { apiService } from '@/services/api'
import type { OfflineWateringItem } from '@/types'

interface MicrophoneButtonProps {
  plantId: string
  currentGrowthValue: number
  onWateringComplete: (success: boolean, message?: string) => void
}

export default function MicrophoneButton({
  plantId,
  currentGrowthValue,
  onWateringComplete
}: MicrophoneButtonProps) {
  const { isOnline, addToOfflineQueue, addNotification } = useAppStore()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [cancelZone, setCancelZone] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const startPositionRef = useRef({ x: 0, y: 0 })
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 检查录音权限
  useEffect(() => {
    checkRecordingPermission()
  }, [])

  const checkRecordingPermission = async () => {
    if (!AudioRecorderService.isSupported()) {
      setPermissionGranted(false)
      return
    }

    try {
      const granted = await audioRecorderService.requestPermission()
      setPermissionGranted(granted)
    } catch (error) {
      console.error('权限检查失败:', error)
      setPermissionGranted(false)
    }
  }

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!permissionGranted) {
      addNotification({
        title: '需要麦克风权限',
        message: '请允许使用麦克风来录制你的声音',
        type: 'warning',
        read: false
      })
      return
    }

    const result = await audioRecorderService.startRecording()
    if (result.success) {
      setIsRecording(true)
      setRecordingDuration(0)
      
      // 开始计时
      durationIntervalRef.current = setInterval(() => {
        const state = audioRecorderService.getRecordingState()
        setRecordingDuration(state.duration)
      }, 100)
    } else {
      addNotification({
        title: '录音失败',
        message: result.error || '无法开始录音',
        type: 'error',
        read: false
      })
    }
  }, [permissionGranted, addNotification])

  // 处理浇水提交
  const handleWateringSubmission = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const wateringTime = new Date().toISOString()

      if (isOnline) {
        // 在线提交
        try {
          await apiService.watering.water({
            plantId,
            plantGrowthValue: currentGrowthValue,
            audioFile: audioBlob,
            wateringTime
          })

          onWateringComplete(true, '浇水成功！你的植物很开心 🌱')
        } catch (error) {
          console.error('在线浇水失败:', error)
          // 在线失败，添加到离线队列
          await addToOfflineQueue({
            id: `offline_${Date.now()}`,
            plantId,
            plantGrowthValue: currentGrowthValue,
            audioBlob,
            wateringTime,
            retryCount: 0,
            createdAt: new Date()
          })

          addNotification({
            title: '已保存到离线队列',
            message: '网络异常，浇水记录将在联网后上传',
            type: 'warning',
            read: false
          })
          onWateringComplete(true, '浇水已保存，将在联网后同步')
        }
      } else {
        // 离线模式，直接添加到队列
        const offlineItem: OfflineWateringItem = {
          id: `offline_${Date.now()}`,
          plantId,
          plantGrowthValue: currentGrowthValue,
          audioBlob,
          wateringTime,
          retryCount: 0,
          createdAt: new Date()
        }

        addToOfflineQueue(offlineItem)
        
        addNotification({
          title: '离线浇水成功',
          message: '浇水记录已保存，将在联网后同步',
          type: 'info',
          read: false
        })
        onWateringComplete(true, '离线浇水成功，记录已保存')
      }
    } catch (error) {
      console.error('浇水提交失败:', error)
      onWateringComplete(false, '提交失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }, [isOnline, plantId, currentGrowthValue, addToOfflineQueue, addNotification, onWateringComplete])

  // 停止录音
  const stopRecording = useCallback(async () => {
    if (!isRecording) return

    // 清理计时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsRecording(false)
    setRecordingDuration(0)

    const result = await audioRecorderService.stopRecording()
    if (result.success && result.audioBlob) {
      await handleWateringSubmission(result.audioBlob)
    } else {
      addNotification({
        title: '录音失败',
        message: result.error || '录音处理失败',
        type: 'error',
        read: false
      })
      onWateringComplete(false, result.error)
    }
  }, [isRecording, handleWateringSubmission, addNotification, onWateringComplete])

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (!isRecording) return

    // 清理计时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsRecording(false)
    setRecordingDuration(0)
    audioRecorderService.cancelRecording()

    addNotification({
      title: '录音已取消',
      message: '你可以重新尝试录音',
      type: 'info',
      read: false
    })
  }, [isRecording, addNotification])

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    startPositionRef.current = { x: touch.clientX, y: touch.clientY }
    setDragPosition({ x: 0, y: 0 })
    setIsDragging(true)
    setCancelZone(false)
    startRecording()
  }, [startRecording])

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isRecording) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const deltaX = touch.clientX - startPositionRef.current.x
    const deltaY = touch.clientY - startPositionRef.current.y
    
    setDragPosition({ x: deltaX, y: deltaY })
    
    // 检查是否进入取消区域（向上滑动超过100px）
    const inCancelZone = deltaY < -100
    setCancelZone(inCancelZone)
  }, [isDragging, isRecording])

  // 触摸结束
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setDragPosition({ x: 0, y: 0 })
    
    if (cancelZone) {
      cancelRecording()
    } else {
      stopRecording()
    }
    
    setCancelZone(false)
  }, [cancelZone, cancelRecording, stopRecording])

  // 鼠标事件（桌面端支持）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startPositionRef.current = { x: e.clientX, y: e.clientY }
    setDragPosition({ x: 0, y: 0 })
    setIsDragging(true)
    setCancelZone(false)
    startRecording()
  }, [startRecording])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isRecording) return
    
    const deltaX = e.clientX - startPositionRef.current.x
    const deltaY = e.clientY - startPositionRef.current.y
    
    setDragPosition({ x: deltaX, y: deltaY })
    
    const inCancelZone = deltaY < -100
    setCancelZone(inCancelZone)
  }, [isDragging, isRecording])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragPosition({ x: 0, y: 0 })
    
    if (cancelZone) {
      cancelRecording()
    } else {
      stopRecording()
    }
    
    setCancelZone(false)
  }, [cancelZone, cancelRecording, stopRecording])

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 权限检查失败
  if (permissionGranted === false) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-300 text-center text-sm">
            {AudioRecorderService.isSupported() 
              ? '需要麦克风权限才能录音' 
              : '当前浏览器不支持录音功能'}
          </p>
        </div>
        <button
          onClick={checkRecordingPermission}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          重新检查权限
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* 取消提示区域 */}
      {isRecording && (
        <div className={`mb-4 transition-all duration-200 ${cancelZone ? 'scale-110' : 'scale-100'}`}>
          <div className={`px-4 py-2 rounded-lg text-sm text-center ${
            cancelZone 
              ? 'bg-red-500 text-white' 
              : 'bg-white/20 text-white'
          }`}>
            {cancelZone ? '松手取消录音' : '上滑取消录音'}
          </div>
        </div>
      )}

      {/* 录音时长显示 */}
      {isRecording && (
        <div className="mb-4 bg-black/50 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-lg">
              {AudioRecorderService.formatDuration(recordingDuration)}
            </span>
          </div>
        </div>
      )}

      {/* 主按钮 */}
      <button
        ref={buttonRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        disabled={isProcessing || permissionGranted === null}
        className={`relative select-none touch-none transition-all duration-200 ${
          isRecording
            ? 'scale-110'
            : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          transform: isRecording 
            ? `translate(${dragPosition.x * 0.3}px, ${dragPosition.y * 0.3}px) scale(1.1)`
            : undefined
        }}
      >
        {/* 按钮背景 */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording
            ? cancelZone
              ? 'bg-red-500 shadow-lg shadow-red-500/50'
              : 'bg-green-500 shadow-lg shadow-green-500/50'
            : isProcessing
              ? 'bg-blue-500'
              : 'bg-white/90 shadow-lg'
        }`}>
          {/* 按钮图标 */}
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <div className={`w-8 h-8 rounded transition-all duration-200 ${
              cancelZone ? 'bg-white' : 'bg-white'
            }`} />
          ) : (
            <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* 录音时的外圈动画 */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" />
        )}
      </button>

      {/* 提示文字 */}
      <p className="mt-4 text-white/80 text-sm text-center">
        {isProcessing 
          ? '正在处理录音...'
          : isRecording 
            ? '正在录音中...'
            : '长按录音浇水'
        }
      </p>

      {/* 离线提示 */}
      {!isOnline && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span className="text-yellow-300 text-xs">
            离线模式，记录将在联网后同步
          </span>
        </div>
      )}
    </div>
  )
}
