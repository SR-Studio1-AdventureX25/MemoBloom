import { memo, useEffect, useState, useRef } from "react";
import type { WateringRecord } from "@/types";
import { apiService } from "@/services/api";
import { useAppStore } from "@/store";

// 记忆抽取详情弹窗组件
export const MemoryDrawModal = memo(function ({
  audioRecord, 
  isOpen, 
  onClose, 
  animationData
}: {
  audioRecord: WateringRecord | null, 
  isOpen: boolean, 
  onClose: () => void,
  animationData: {
    startX: number,
    startY: number,
    startSize: number
  } | null
}) {
  const [showContent, setShowContent] = useState(false);
  const [animatingDisc, setAnimatingDisc] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 音频播放相关状态
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  
  // 收藏相关状态
  const [isCollecting, setIsCollecting] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addFavoriteWateringRecord, favoriteWateringRecords, addNotification } = useAppStore();

  // 检查是否已收藏
  useEffect(() => {
    if (audioRecord) {
      setIsCollected(favoriteWateringRecords.some(r => r.id === audioRecord.id));
    }
  }, [audioRecord, favoriteWateringRecords]);

  // 获取音频URL并播放
  const loadAndPlayAudio = async (fileToken: string) => {
    try {
      setIsAudioLoading(true);
      setAudioError(null);
      
      const response = await apiService.audio.getUrl(fileToken);
      const url = response.data.url;
      
      // 等待音频元素加载
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        
        // 尝试自动播放
        try {
          await audioRef.current.play();
          setIsAudioPlaying(true);
        } catch (playError) {
          console.log('自动播放被阻止，用户需要手动播放:', playError);
        }
      }
    } catch (error) {
      console.error('加载音频失败:', error);
      setAudioError('音频加载失败');
    } finally {
      setIsAudioLoading(false);
    }
  };

  // 播放/暂停控制
  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        await audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error('播放控制失败:', error);
      setAudioError('播放失败');
    }
  };

  // 收藏功能
  const handleCollect = async () => {
    if (!audioRecord || isCollected || isCollecting) return;
    
    setIsCollecting(true);
    
    try {
      // 添加到收藏
      addFavoriteWateringRecord(audioRecord);
      setIsCollected(true);
      
      // 显示成功通知
      addNotification({
        title: '收藏成功',
        message: '记忆已添加到图书馆收藏中',
        type: 'success',
        read: false
      });
      
      // 添加一些视觉反馈
      setTimeout(() => {
        setIsCollecting(false);
      }, 1000);
      
    } catch (error) {
      console.error('收藏失败:', error);
      addNotification({
        title: '收藏失败',
        message: '请稍后重试',
        type: 'error',
        read: false
      });
      setIsCollecting(false);
    }
  };

  // 音频事件处理
  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  };

  const handleAudioError = () => {
    setAudioError('音频播放出错');
    setIsAudioPlaying(false);
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isOpen && animationData) {
      // 动画开始时隐藏内容
      setShowContent(false);
      setAnimatingDisc(true);
      setIsClosing(false);
      
      // 立即显示模态框，开始淡入
      setModalVisible(true);
      
      // 延迟显示内容，等待唱片动画完成
      const timer = setTimeout(() => {
        setShowContent(true);
        setAnimatingDisc(false);
      }, 800); // 动画持续时间
      
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setModalVisible(false);
      // 关闭时停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
      // 重置音频状态
      setAudioError(null);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      // 重置收藏状态
      setIsCollecting(false);
    }
  }, [isOpen, animationData]);

  // 当模态框打开且有音频文件时，加载并播放音频
  useEffect(() => {
    if (isOpen && audioRecord?.memoryFile && showContent) {
      loadAndPlayAudio(audioRecord.memoryFile);
    }
  }, [isOpen, audioRecord?.memoryFile, showContent]);

  const handleClose = () => {
    if (isClosing) return; // 防止重复点击
    
    setIsClosing(true);
    setShowContent(false); // 先隐藏内容
    setAnimatingDisc(true); // 开始反向动画
    
    // 等待唱片回到原位置后关闭模态框
    setTimeout(() => {
      onClose();
    }, 1000); // 延长等待时间，确保动画完成
  };

  // 始终渲染，通过CSS控制显示状态
  if (!audioRecord || !animationData) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        modalVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={handleClose}
      style={{ 
        fontFamily: '"DingTalk JinBuTi", serif',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* 动画唱片 */}
      <img 
        src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"}
        className={`fixed z-60 transition-all duration-700 ease-out ${!animatingDisc && !isClosing ? 'animate-spin-slow' : ''}`}
        style={{
          left: (animatingDisc && !isClosing) || isClosing ? `${animationData.startX}px` : `calc(50vw - 140px)`,
          top: (animatingDisc && !isClosing) || isClosing ? `${animationData.startY}px` : `calc(22vh - 140px)`,
          width: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
          height: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
          filter: `
            drop-shadow(0 12px 24px rgba(139, 69, 19, 0.6))
            drop-shadow(0 6px 12px rgba(160, 82, 45, 0.4))
            drop-shadow(0 0 30px rgba(218, 165, 32, 0.3))
          `
        }}
      />
      
      {/* 内容区域 - 动画完成后显示 */}
      {showContent && !isClosing && (
        <div className="flex flex-col items-center justify-center h-full">
          {/* 标题 */}
          <h3 
            className="text-3xl font-bold mb-8 text-yellow-200 animate-fade-in" 
            style={{ 
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              marginTop: '320px' // 进一步下移标题位置
            }}
          >
            {audioRecord.nftMinted ? "✨ 珍藏版记忆唱片 ✨" : "🌸 开花记忆抽取 🌸"}
          </h3>
          
          {/* 信息直接显示在遮罩层上 */}
          <div className="text-center space-y-4 max-w-2xl px-8 animate-fade-in-up">
            {/* 核心事件 */}
            <div className="text-yellow-200 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              核心事件：{audioRecord.coreEvent}
            </div>
            
            {/* 记忆内容 */}
            <div className="text-yellow-100 text-lg italic" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              "{audioRecord.memoryText}"
            </div>
            
            {/* 情感标签 */}
            <div className="flex flex-wrap gap-3 justify-center">
              {audioRecord.emotionTags?.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2 text-sm font-bold rounded-full"
                  style={{
                    background: 'linear-gradient(45deg, #DAA520, #FFD700)',
                    color: '#8B4513',
                    textShadow: '1px 1px 2px rgba(255,255,255,0.3)',
                    border: '2px solid #B8860B',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {tag}
                </span>
              )) || <span className="text-yellow-400 text-lg">暂无标签</span>}
            </div>
            
            {/* 数值信息 */}
            <div className="flex justify-center gap-8 text-yellow-200 text-lg font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <span>情感强度：{audioRecord.emotionIntensity}/10</span>
              <span>成长值：+{audioRecord.growthIncrement}</span>
            </div>
            
            {/* 收藏按钮 */}
            <div className="flex justify-center mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollect();
                }}
                disabled={isCollected || isCollecting}
                className={`px-6 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
                  isCollected 
                    ? 'bg-green-500 text-white cursor-default' 
                    : isCollecting
                    ? 'bg-yellow-400 text-black cursor-wait'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white hover:scale-105 shadow-lg'
                }`}
                style={{
                  boxShadow: isCollected ? '0 4px 12px rgba(34, 197, 94, 0.4)' : '0 4px 12px rgba(236, 72, 153, 0.4)'
                }}
              >
                {isCollected ? '✅ 已收藏' : isCollecting ? '🌸 收藏中...' : '💖 收藏到图书馆'}
              </button>
            </div>
            
            {/* 音频播放器 */}
            {audioRecord.memoryFile && (
              <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm border border-yellow-500/30 mt-4">
                {isAudioLoading && (
                  <div className="text-yellow-300 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    🎵 正在加载音频...
                  </div>
                )}
                
                {audioError && (
                  <div className="text-red-300 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    ❌ {audioError}
                  </div>
                )}
                
                {!isAudioLoading && !audioError && (
                  <div className="flex flex-col items-center space-y-3">
                    {/* 播放控制按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPause();
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 flex items-center justify-center text-black text-xl font-bold shadow-lg transition-all duration-200 hover:scale-110"
                    >
                      {isAudioPlaying ? '⏸️' : '▶️'}
                    </button>
                    
                    {/* 播放进度和时间 */}
                    {audioDuration > 0 && (
                      <div className="flex items-center space-x-3 w-full max-w-xs">
                        <span className="text-yellow-300 text-sm font-mono" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {formatTime(audioCurrentTime)}
                        </span>
                        
                        {/* 进度条 */}
                        <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-100"
                            style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                          />
                        </div>
                        
                        <span className="text-yellow-300 text-sm font-mono" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {formatTime(audioDuration)}
                        </span>
                      </div>
                    )}
                    
                    {/* 播放状态提示 */}
                    <div className="text-yellow-400 text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      {isAudioPlaying ? '🎵 正在播放记忆录音' : '⏸️ 点击播放记忆录音'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 时间信息 */}
            <div className="text-yellow-300 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              记忆时间：{new Date(audioRecord.wateringTime).toLocaleString('zh-CN')}
            </div>
            
            {/* NFT信息 */}
            {audioRecord.nftMinted && (
              <div className="text-purple-200 text-sm space-y-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                <div>
                  <span className="font-bold text-purple-300">🔗 区块链地址：</span>
                  <div className="font-mono text-xs break-all mt-1 text-purple-100">
                    {audioRecord.nftAddress}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-purple-300">⏰ 铸造时间：</span>
                  <span className="ml-2">
                    {audioRecord.nftMintTime ? new Date(audioRecord.nftMintTime).toLocaleString('zh-CN') : ''}
                  </span>
                </div>
              </div>
            )}
            
            {/* 关闭提示 */}
            <div className="text-yellow-400 text-sm mt-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              点击任意位置关闭
            </div>
          </div>
        </div>
      )}
      
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="metadata"
      />
    </div>
  );
});
