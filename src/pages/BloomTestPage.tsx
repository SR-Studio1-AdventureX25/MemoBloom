import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { BloomDrawSystem } from '@/components/BloomDrawSystem'
import type { Plant, WateringRecord } from '@/types'

// 测试页面 - 用于测试开花抽取功能
export default function BloomTestPage() {
  const { 
    setPlants, 
    setCurrentPlantId, 
    setWateringRecords, 
    addNotification,
    resetDailyDrawStatus 
  } = useAppStore()

  // 初始化测试数据
  useEffect(() => {
    // 创建一个开花状态的测试植物
    const testPlant: Plant = {
      id: 'test-flowering-plant',
      variety: '多肉植物',
      currentGrowthStage: 'flowering', // 设置为开花状态
      growthValue: 80,
      lastWateringTime: Date.now(),
      userRecentStatus: '开心',
      personalityTags: ['温柔', '活泼'],
      nftMinted: false,
      createdAt: new Date().toISOString()
    }

    // 创建一些历史浇水记录用于抽取
    const historicalRecords: WateringRecord[] = [
      {
        id: 'record-1',
        plantId: 'test-flowering-plant',
        plantGrowthValue: 60,
        memoryText: '今天心情很好，和朋友一起吃了美味的午餐',
        emotionTags: ['开心', '满足'],
        emotionIntensity: 8,
        growthIncrement: 5,
        coreEvent: '美味午餐',
        nftMinted: false,
        wateringTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前
        memoryFile: undefined
      },
      {
        id: 'record-2',
        plantId: 'test-flowering-plant',
        plantGrowthValue: 65,
        memoryText: '完成了一个重要的项目，感觉很有成就感',
        emotionTags: ['成就感', '兴奋'],
        emotionIntensity: 9,
        growthIncrement: 6,
        coreEvent: '项目完成',
        nftMinted: false,
        wateringTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
        memoryFile: undefined
      },
      {
        id: 'record-3',
        plantId: 'test-flowering-plant',
        plantGrowthValue: 70,
        memoryText: '看了一部很感人的电影，被深深感动了',
        emotionTags: ['感动', '温暖'],
        emotionIntensity: 7,
        growthIncrement: 4,
        coreEvent: '感人电影',
        nftMinted: false,
        wateringTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天前
        memoryFile: undefined
      },
      {
        id: 'record-today',
        plantId: 'test-flowering-plant',
        plantGrowthValue: 75,
        memoryText: '今天测试开花抽取功能',
        emotionTags: ['期待', '好奇'],
        emotionIntensity: 6,
        growthIncrement: 3,
        coreEvent: '功能测试',
        nftMinted: false,
        wateringTime: new Date().toISOString(), // 今天
        memoryFile: undefined
      }
    ]

    // 设置测试数据
    setPlants([testPlant])
    setCurrentPlantId(testPlant.id)
    setWateringRecords(historicalRecords)
    
    // 重置抽取状态
    resetDailyDrawStatus()

    // 显示测试说明
    addNotification({
      title: '开花抽取测试模式',
      message: '植物已设置为开花状态，可以测试记忆抽取功能',
      type: 'info',
      read: false
    })
  }, [setPlants, setCurrentPlantId, setWateringRecords, addNotification, resetDailyDrawStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-8">
      {/* 测试页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          🌸 开花抽取功能测试 🌸
        </h1>
        <p className="text-white/80 text-lg">
          植物已设置为开花状态，今日已浇水，可以测试记忆抽取功能
        </p>
      </div>

      {/* 开花抽取系统 */}
      <div className="w-full max-w-4xl">
        <BloomDrawSystem />
      </div>

      {/* 测试说明 */}
      <div className="mt-12 max-w-2xl text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">测试说明</h3>
          <ul className="text-left space-y-2 text-sm">
            <li>• 植物已设置为开花状态</li>
            <li>• 已创建4条浇水记录（包括今日1条）</li>
            <li>• 有3条历史记录可供抽取</li>
            <li>• 每天最多可抽取3次记忆</li>
            <li>• 点击花苞即可抽取历史记忆</li>
            <li>• 抽取的记忆可以收藏到图书馆</li>
          </ul>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="mt-8">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-lg"
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
