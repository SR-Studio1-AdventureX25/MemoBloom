import { useState, useEffect, useRef } from "react";
import type { WateringRecord } from "@/types";
import { useAppStore } from "@/store";

export const useDigitalLibrary = () => {
  // 从 store 获取收藏数据
  const { favoritePlants, favoriteWateringRecords } = useAppStore();
  
  // 音频详情模态框状态
  const [selectedAudio, setSelectedAudio] = useState<WateringRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationData, setAnimationData] = useState<{
    startX: number,
    startY: number,
    startSize: number
  } | null>(null);
  
  // 滚动位置状态
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 生成随机偏移的函数
  const generateRandomOffset = () => ({
    x: (Math.random() - 0.5) * 40, // -20px 到 20px 的随机水平偏移
    y: (Math.random() - 0.5) * 10  // -15px 到 15px 的随机垂直偏移
  });

  // 为每个box生成随机偏移
  const [boxOffsets] = useState(() => {
    const offsets: {[key: string]: {x: number, y: number}} = {};
    // 为第一行和第二行各10个位置生成偏移
    for (let row = 1; row <= 2; row++) {
      for (let i = 0; i < 10; i++) {
        offsets[`row${row}-${i}`] = generateRandomOffset();
      }
    }
    return offsets;
  });

  // 使用收藏数据替代假数据，按时间顺序排序
  const sortedPlants = favoritePlants.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sortedAudios = favoriteWateringRecords.sort((a, b) => new Date(a.wateringTime).getTime() - new Date(b.wateringTime).getTime());

  useEffect(() => {
    if (scrollAreaRef.current) {
      // 页面加载时向右滚动 90px
      scrollAreaRef.current.scrollLeft = 90;
      setScrollLeft(90);
    }
  }, []);

  // 处理滚动事件
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
  };

  // 处理音频点击
  const handleAudioClick = (audioRecord: WateringRecord, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 找到对应的offset - 通过查找匹配的audioRecord
    let offset = { x: 0, y: 0 };
    const audioIndex = sortedAudios.findIndex(audio => audio.id === audioRecord.id);
    if (audioIndex !== -1) {
      // 计算在第二行中的位置索引 - AudioBox在第二行的奇数位（索引1,3,5...）
      const positionInRow = Math.floor(audioIndex / 3); // 每3个audio循环一次
      const colIndex = positionInRow * 2 + 1; // 奇数列：1, 3, 5, 7, 9
      const offsetKey = `row2-${colIndex}`;
      offset = boxOffsets[offsetKey] || { x: 0, y: 0 };
    }
    
    // 更精确的位置计算
    const boxPadding = 24; // p-6 = 24px
    const discScale = 0.85;
    const boxSize = 128; // w-32 h-32 = 128px
    const discSize = boxSize * discScale; // 实际唱片大小
    
    // 找到唱片图片元素的实际位置
    const imgElement = target.querySelector('img');
    if (imgElement) {
      const imgRect = imgElement.getBoundingClientRect();
      setAnimationData({
        startX: imgRect.left,
        startY: imgRect.top,
        startSize: imgRect.width
      });
    } else {
      // 备用计算方法
      const startX = rect.left + boxPadding + offset.x + (boxSize - discSize) / 2;
      const startY = rect.top + boxPadding + offset.y + (boxSize - discSize) / 2;
      
      setAnimationData({
        startX,
        startY,
        startSize: discSize
      });
    }
    
    setSelectedAudio(audioRecord);
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAudio(null);
    setAnimationData(null);
  };

  return {
    // 数据
    sortedPlants,
    sortedAudios,
    boxOffsets,
    
    // 滚动相关
    scrollLeft,
    scrollAreaRef,
    handleScroll,
    
    // 模态框相关
    selectedAudio,
    isModalOpen,
    animationData,
    handleAudioClick,
    closeModal
  };
};
