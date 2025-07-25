import { useVideoPlayback } from '@/hooks/useVideoPlayback'

interface VideoBackgroundProps {
  showOverlay?: boolean
}

export default function VideoBackground({ showOverlay = false }: VideoBackgroundProps) {
  const {
    frontVideoRef,
    backVideoRef,
    frontVideoUrl,
    backVideoUrl,
    currentResourceId,
    isLoading,
    error,
    // currentPlant,
    // videoPlaylist,
    // currentVideoIndex,
    frontVideoActive,
    handleVideoEnded,
    handleFrontVideoCanPlay,
    handleBackVideoCanPlay,
    handleVideoError
  } = useVideoPlayback()

  // 重新加载资源
  const handleReload = () => {
    window.location.reload()
  }

  // 加载状态
  if (isLoading && !frontVideoUrl && !backVideoUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">加载植物视频中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error && !frontVideoUrl && !backVideoUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={handleReload}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 前景视频 */}
      {frontVideoUrl && (
        <video
          key="front-video"
          ref={frontVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: frontVideoActive ? 2 : 1 }}
          src={frontVideoUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={handleFrontVideoCanPlay}
          onError={handleVideoError(currentResourceId || 'unknown')}
          onEnded={frontVideoActive ? handleVideoEnded : undefined}
        />
      )}

      {/* 背景视频 */}
      {backVideoUrl && (
        <video
          key="back-video"
          ref={backVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: frontVideoActive ? 1 : 2 }}
          src={backVideoUrl}
          muted
          playsInline
          preload="auto"
          onCanPlay={handleBackVideoCanPlay}
          onError={handleVideoError('back-video')}
          onEnded={!frontVideoActive ? handleVideoEnded : undefined}
        />
      )}

      {/* 没有资源时显示渐变背景 */}
      {!frontVideoUrl && !backVideoUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900" />
      )}
      
      {/* 条件性显示遮罩 - 仅在传入showOverlay时显示 */}
      {showOverlay && (
        <>
          {/* 深色遮罩，确保上层内容可读 */}
          <div className="absolute inset-0 bg-black/30" style={{ zIndex: 10 }} />
          
          {/* 渐变遮罩，增强视觉效果 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" style={{ zIndex: 11 }} />
        </>
      )}

      {/* 调试信息 - 仅在开发环境显示
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-xs" style={{ zIndex: 20 }}>
          <div>当前资源: {currentResourceId}</div>
          <div>播放列表: {videoPlaylist.join(', ')}</div>
          <div>索引: {currentVideoIndex}</div>
          <div>植物阶段: {currentPlant?.currentGrowthStage}</div>
          <div>前景激活: {frontVideoActive ? '是' : '否'}</div>
          <div>前景视频: {frontVideoUrl ? '已加载' : '未加载'}</div>
          <div>背景视频: {backVideoUrl ? '已加载' : '未加载'}</div>
        </div>
      )} */}
    </div>
  )
}
