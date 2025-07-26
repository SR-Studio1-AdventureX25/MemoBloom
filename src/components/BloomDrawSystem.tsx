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
  
  const budRefs = useRef<(HTMLDivElement | null)[]>([])

  // 获取当前植物
  const currentPlant = currentPlantId ? plants.find(p => p.id === currentPlantId) : null
  
  console.log('🌸 BloomDrawSystem Debug Info:')
  console.log('- currentPlantId:', currentPlantId)
  console.log('- currentPlant:', currentPlant)
  console.log('- plants count:', plants.length)
  console.log('- wateringRecords count:', wateringRecords.length)
  console.log('- all wateringRecords:', wateringRecords)
  
  // 检查是否可以显示抽取系统
  const canShowDrawSystem = currentPlant?.currentGrowthStage === 'flowering'
  console.log('- canShowDrawSystem:', canShowDrawSystem, '(plant stage:', currentPlant?.currentGrowthStage, ')')
  
  // 检查是否可以抽取
  const canDraw = checkCanDrawMemory()
  console.log('- canDraw:', canDraw)
  
  // 获取今日抽取次数
  const todayDrawCount = getTodayDrawCount()
  const remainingDraws = Math.max(0, 3 - todayDrawCount)
  console.log('- todayDrawCount:', todayDrawCount)
  console.log('- remainingDraws:', remainingDraws)
  
  // 检查今日是否已浇水
  const hasWateredToday = (() => {
    if (!currentPlantId) {
      console.log('- hasWateredToday: false (no currentPlantId)')
      return false
    }
    const today = new Date().toDateString()
    console.log('- today date string:', today)
    
    const todayRecords = wateringRecords.filter(record => {
      const recordDate = new Date(record.wateringTime).toDateString()
      const isToday = record.plantId === currentPlantId && recordDate === today
      console.log(`  - record ${record.id}: plantId=${record.plantId}, date=${recordDate}, isToday=${isToday}`)
      return isToday
    })
    
    console.log('- todayRecords:', todayRecords)
    console.log('- hasWateredToday:', todayRecords.length > 0)
    return todayRecords.length > 0
  })()
  
  // 获取可抽取记录数量
  const availableRecordsCount = (() => {
    if (!currentPlantId) {
      console.log('- availableRecordsCount: 0 (no currentPlantId)')
      return 0
    }
    console.log('- filtering available records...')
    
    const allPlantRecords = wateringRecords.filter(record => record.plantId === currentPlantId)
    console.log('- allPlantRecords:', allPlantRecords.length, allPlantRecords)
    
    const recordsWithMemory = allPlantRecords.filter(record => {
      const hasMemoryText = !!record.memoryText
      const hasEmotionTags = !!(record.emotionTags && record.emotionTags.length > 0)
      console.log(`  - record ${record.id}: hasMemoryText=${hasMemoryText}, hasEmotionTags=${hasEmotionTags}`)
      console.log(`    - memoryText:`, record.memoryText)
      console.log(`    - emotionTags:`, record.emotionTags)
      return hasMemoryText && hasEmotionTags
    })
    console.log('- recordsWithMemory:', recordsWithMemory.length, recordsWithMemory)
    
    return recordsWithMemory.length
  })()
  
  console.log('- Final availableRecordsCount:', availableRecordsCount)

  // 处理花苞点击
  const handleBudClick = useCallback(() => {
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
      } else if (availableRecordsCount === 0) {
        addNotification({
          title: '暂无可抽取记忆',
          message: '还没有足够的记忆可以抽取',
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
  }, [canDraw, hasWateredToday, remainingDraws, availableRecordsCount, performMemoryDraw, addNotification])

  // 关闭模态框
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedRecord(null)
  }, [])

  // 如果植物不在开花状态，不显示抽取系统
  if (!canShowDrawSystem) {
    return null
  }

  return (
    <div className={`bloom-draw-system ${className}`}>
      {/* 三个花苞 */}
      <div className="flex justify-center items-center space-x-8">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            ref={(el) => { budRefs.current[index] = el }}
          >
            <BloomBud
              index={index}
              onClick={handleBudClick}
              disabled={!canDraw || index >= remainingDraws}
            />
          </div>
        ))}
      </div>

      {/* 记忆抽取弹窗 */}
      <MemoryDrawModal
        audioRecord={selectedRecord}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
})

BloomDrawSystem.displayName = 'BloomDrawSystem'
