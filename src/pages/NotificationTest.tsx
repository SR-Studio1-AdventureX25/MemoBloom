import React from 'react'
import { NotificationDemo } from '@/components/NotificationDemo'

export default function NotificationTest() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">通知功能测试</h1>
        <NotificationDemo />
      </div>
    </div>
  )
}
