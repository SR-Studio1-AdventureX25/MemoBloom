
export default function DigitalLibraryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-16 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 p-6 pt-16">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">数字图书馆</h1>
          <p className="text-white/70 text-lg">探索植物的神奇世界</p>
        </div>

        {/* 搜索栏 */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="搜索植物知识..."
              className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 分类网格 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { title: '植物百科', icon: '🌱', desc: '了解各种植物' },
            { title: '养护指南', icon: '💧', desc: '专业养护技巧' },
            { title: '病虫防治', icon: '🔍', desc: '植物健康诊断' },
            { title: '繁殖技巧', icon: '🌿', desc: '植物繁殖方法' }
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 最近阅读 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">最近阅读</h2>
          <div className="space-y-3">
            {[
              { title: '如何给多肉植物浇水', time: '2小时前', progress: 60 },
              { title: '室内植物的光照需求', time: '1天前', progress: 100 },
              { title: '植物叶片发黄的原因', time: '3天前', progress: 30 }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium flex-1">{item.title}</h3>
                  <span className="text-white/50 text-sm">{item.time}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 下滑提示 */}
        <div className="text-center mt-12 pb-8">
          <div className="inline-flex items-center text-white/60">
            <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm">下滑返回主页</span>
          </div>
        </div>
      </div>
    </div>
  )
}
