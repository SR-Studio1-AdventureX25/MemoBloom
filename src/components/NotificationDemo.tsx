import React from 'react'
import { pwaService } from '@/services/pwa'

export const NotificationDemo: React.FC = () => {
  const handleRequestPermission = async () => {
    const permission = await pwaService.requestNotificationPermission()
    console.log('Notification permission:', permission)
  }

  const handleTestBasicNotification = async () => {
    await pwaService.sendLocalNotification('测试通知', {
      body: '这是一个基本的测试通知',
      tag: 'test-basic'
    })
  }

  const handleTestWateringReminder = async () => {
    await pwaService.sendWateringReminder('我的小花', 2)
  }

  const handleTestGrowthNotification = async () => {
    await pwaService.sendGrowthNotification('我的小花', 'flowering')
  }

  const handleTestAchievementNotification = async () => {
    await pwaService.sendAchievementNotification('绿手指', '您已经成功培养了第一株植物！')
  }

  const getPermissionStatus = () => {
    const permission = pwaService.getNotificationPermission()
    const statusText = {
      'granted': '已授权',
      'denied': '已拒绝',
      'default': '未设置'
    }
    return statusText[permission] || '未知'
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">通知功能测试</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          当前通知权限状态: <span className="font-semibold">{getPermissionStatus()}</span>
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleRequestPermission}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          请求通知权限
        </button>

        <button
          onClick={handleTestBasicNotification}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          测试基本通知
        </button>

        <button
          onClick={handleTestWateringReminder}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          测试浇水提醒
        </button>

        <button
          onClick={handleTestGrowthNotification}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          测试成长通知
        </button>

        <button
          onClick={handleTestAchievementNotification}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          测试成就通知
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
        <p><strong>使用说明:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>首先点击"请求通知权限"按钮</li>
          <li>浏览器会弹出权限请求对话框</li>
          <li>授权后即可测试各种通知功能</li>
          <li>通知会同时显示在系统通知和应用内通知中</li>
        </ul>
      </div>
    </div>
  )
}
