import { memo, useEffect, useState, useRef } from "react";
import type { WateringRecord } from "@/types";
import { apiService } from "@/services/api";

// 全屏音频详情组件
export const AudioDetailModal = memo(function ({
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
  
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // 音频事件处理
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  const handleAudioError = () => {
    setAudioError('音频播放出错');
    setIsAudioPlaying(false);
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
      {/* 动画唱片 - 可点击控制播放 */}
      <div
        className={`fixed z-60 transition-all duration-700 ease-out cursor-pointer group ${!animatingDisc && !isClosing && isAudioPlaying ? 'animate-spin-slow' : ''}`}
        style={{
          left: (animatingDisc && !isClosing) || isClosing ? `${animationData.startX}px` : `calc(50vw - 140px)`,
          top: (animatingDisc && !isClosing) || isClosing ? `${animationData.startY}px` : `calc(22vh - 140px)`,
          width: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
          height: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (showContent && !isClosing && audioRecord.memoryFile) {
            togglePlayPause();
          }
        }}
      >
        <img 
          src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"}
          className="w-full h-full transition-all duration-200 group-hover:scale-105"
          style={{
            filter: `
              drop-shadow(0 12px 24px rgba(139, 69, 19, 0.6))
              drop-shadow(0 6px 12px rgba(160, 82, 45, 0.4))
              drop-shadow(0 0 30px rgba(218, 165, 32, 0.3))
              ${showContent && !isClosing ? 'brightness(1.1)' : ''}
            `
          }}
        />
        
        {/* 播放状态指示器 */}
        {showContent && !isClosing && audioRecord.memoryFile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-2xl transition-all duration-200 ${isAudioPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-80'}`}>
              {isAudioLoading ? (
                <div className="animate-spin text-yellow-400">⟳</div>
              ) : audioError ? (
                <div className="text-red-400">❌</div>
              ) : isAudioPlaying ? (
                <div className="text-yellow-400">⏸️</div>
              ) : (
                <div className="text-yellow-400">▶️</div>
              )}
            </div>
          </div>
        )}
      </div>
      
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
            {audioRecord.nftMinted ? "✨ 珍藏版记忆唱片 ✨" : "🎵 记忆唱片 🎵"}
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
            
            {/* 音频控制提示 */}
            {audioRecord.memoryFile && (
              <div className="text-yellow-400 text-lg font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {isAudioLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin">⟳</div>
                    <span>正在加载音频...</span>
                  </div>
                ) : audioError ? (
                  <div className="text-red-300">❌ {audioError}</div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isAudioPlaying ? '🎵' : '🎶'}</span>
                    <span>点击唱片{isAudioPlaying ? '暂停' : '播放'}记忆录音</span>
                  </div>
                )}
              </div>
            )}

            {/* 时间信息 */}
            <div className="text-yellow-300 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              收藏时间：{new Date(audioRecord.wateringTime).toLocaleString('zh-CN')}
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
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="metadata"
      />
    </div>
  );
});
