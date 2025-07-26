import { memo, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store'
import { BloomBud } from './BloomBud'
import { MemoryDrawModal } from './MemoryDrawModal'
import type { WateringRecord } from '@/types'

interface BloomDrawSystemProps {
  className?: string
}

export const BloomDrawSystem = memo<BloomDrawSystemProps>(({ className = "" }) => {
  const { 
    checkCanDrawMemory, 
    getTodayDrawCount, 
    performMemoryDraw, 
    currentPlantId, 
    plants, 
    wateringRecords,
    addNotification 
  } = useAppStore()
  
  const [selectedRecord, setSelectedRecord] = useState<WateringRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [animationData, setAnimationData] = useState<{
    startX: number
    startY: number
    startSize: number
  } | null>(null)
  
  const budRefs = useRef<(HTMLDivElement | null)[]>([])

  // 获取当前植物
  const currentPlant = currentPlantId ? plants.find(p => p.id === currentPlantId) : null
  
  // 检查是否可以显示抽取系统
  const canShowDrawSystem = currentPlant?.currentGrowthStage === 'flowering'
  
  // 检查是否可以抽取
  const canDraw = checkCanDrawMemory()
  
  // 获取今日抽取次数
  const todayDrawCount = getTodayDrawCount()
  const remainingDraws = Math.max(0, 3 - todayDrawCount)
  
  // 检查今日是否已浇水
  const hasWateredToday = (() => {
    if (!currentPlantId) return false
    const today = new Date().toDateString()
    return wateringRecords.some(record => 
      record.plantId === currentPlantId && 
      new Date(record.wateringTime).toDateString() === today
    )
  })()
  
  // 获取历史记录数量
  const historicalRecordsCount = (() => {
    if (!currentPlantId) return 0
    const today = new Date().toDateString()
    return wateringRecords.filter(record => 
      record.plantId === currentPlantId && 
      new Date(record.wateringTime).toDateString() !== today &&
      record.memoryText && 
      record.emotionTags && record.emotionTags.length > 0
    ).length
  })()

  // 处理花苞点击
  const handleBudClick = useCallback((budIndex: number) => {
    if (!canDraw) {
      // 显示不能抽取的原因
      if (!hasWateredToday) {
        addNotification({
          title: '需要先浇水',
          message: '请先给植物浇水，才能抽取记忆',
          type: 'warning',
          read: false
        })
      } else if (remainingDraws <= 0) {
        addNotification({
          title: '今日抽取已用完',
          message: '每天只能抽取3次记忆，明天再来吧',
          type: 'info',
          read: false
        })
      } else if (historicalRecordsCount === 0) {
        addNotification({
          title: '暂无历史记忆',
          message: '还没有足够的历史记忆可以抽取',
          type: 'info',
          read: false
        })
      }
      return
    }

    // 执行抽取
    const drawnRecord = performMemoryDraw()
    
    if (!drawnRecord) {
      addNotification({
        title: '抽取失败',
        message: '暂无可抽取的记忆记录',
        type: 'error',
        read: false
      })
      return
    }

    // 获取花苞位置信息用于动画
    const budElement = budRefs.current[budIndex]
    if (budElement) {
      const rect = budElement.getBoundingClientRect()
      setAnimationData({
        startX: rect.left + rect.width / 2 - 30, // 30是唱片半径
        startY: rect.top + rect.height / 2 - 30,
        startSize: 60 // 花苞大小
      })
    }

    // 设置选中的记录并打开模态框
    setSelectedRecord(drawnRecord)
    setIsModalOpen(true)
    
    // 显示抽取成功通知
    addNotification({
      title: '记忆抽取成功',
      message: `抽取到了"${drawnRecord.coreEvent}"的记忆`,
      type: 'success',
      read: false
    })
  }, [canDraw, hasWateredToday, remainingDraws, historicalRecordsCount, performMemoryDraw, addNotification])

  // 关闭模态框
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedRecord(null)
    setAnimationData(null)
  }, [])

  // 如果植物不在开花状态，不显示抽取系统
  if (!canShowDrawSystem) {
    return null
  }

  return (
    <div className={`bloom-draw-system ${className}`}>
      {/* 状态提示 */}
      <div className="text-center mb-6">
        <div className="text-white/90 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          🌸 开花记忆抽取 🌸
        </div>
        
        {!hasWateredToday ? (
          <div className="text-yellow-300 text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            请先给植物浇水，才能抽取记忆
          </div>
        ) : remainingDraws <= 0 ? (
          <div className="text-orange-300 text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            今日抽取次数已用完，明天再来吧
          </div>
        ) : historicalRecordsCount === 0 ? (
          <div className="text-blue-300 text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            暂无历史记忆可以抽取
          </div>
        ) : (
          <div className="text-green-300 text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            今日还可抽取 {remainingDraws} 次记忆
          </div>
        )}
      </div>

      {/* 三个花苞 */}
      <div className="flex justify-center items-center space-x-8">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            ref={(el) => { budRefs.current[index] = el }}
            className="flex flex-col items-center"
          >
            <BloomBud
              index={index}
              onClick={() => handleBudClick(index)}
              disabled={!canDraw || index >= remainingDraws}
            />
            
            {/* 花苞状态指示 */}
            <div className="mt-2 text-xs text-white/60 text-center">
              {index < remainingDraws ? (
                canDraw ? '可抽取' : '不可用'
              ) : (
                '已用完'
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 记忆统计 */}
      <div className="text-center mt-6 text-white/70 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
        <div>历史记忆: {historicalRecordsCount} 条</div>
        <div>今日已抽取: {todayDrawCount}/3 次</div>
      </div>

      {/* 记忆抽取弹窗 */}
      <MemoryDrawModal
        audioRecord={selectedRecord}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        animationData={animationData}
      />
    </div>
  )
})

BloomDrawSystem.displayName = 'BloomDrawSystem'
