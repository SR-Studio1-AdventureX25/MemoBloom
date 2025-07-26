import { memo } from "react";

// 7段数码管组件
export const SevenSegmentDigit = memo(function ({ digit }: { digit: number }) {
  // 7段数码管的段定义 (a, b, c, d, e, f, g)
  const segments = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
  };

  const segmentPattern = segments[digit as keyof typeof segments] || [false, false, false, false, false, false, false];

  const segmentStyle = (isActive: boolean) => ({
    background: isActive ? 'linear-gradient(145deg, #4a4a4a, #2a2a2a)' : 'transparent',
    boxShadow: isActive ? `
      0 4px 8px rgba(0, 0, 0, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(74, 74, 74, 0.6)
    ` : 'none',
    border: isActive ? '1px solid #333333' : 'none',
    transition: 'all 0.2s ease',
    display: isActive ? 'block' : 'none'
  });

  return (
    <div className="relative w-12 h-18 mx-1">
      {/* 段 a (顶部) */}
      <div 
        className="absolute top-0 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          ...segmentStyle(segmentPattern[0])
        }}
      />
      
      {/* 段 b (右上) */}
      <div 
        className="absolute top-1 right-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%)',
          ...segmentStyle(segmentPattern[1])
        }}
      />
      
      {/* 段 c (右下) */}
      <div 
        className="absolute bottom-1 right-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)',
          ...segmentStyle(segmentPattern[2])
        }}
      />
      
      {/* 段 d (底部) */}
      <div 
        className="absolute bottom-0 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
          ...segmentStyle(segmentPattern[3])
        }}
      />
      
      {/* 段 e (左下) */}
      <div 
        className="absolute bottom-1 left-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 10%, 100% 0%, 100% 100%, 0% 90%)',
          ...segmentStyle(segmentPattern[4])
        }}
      />
      
      {/* 段 f (左上) */}
      <div 
        className="absolute top-1 left-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 0%, 100% 10%, 100% 100%, 0% 90%)',
          ...segmentStyle(segmentPattern[5])
        }}
      />
      
      {/* 段 g (中间) */}
      <div 
        className="absolute top-8 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          ...segmentStyle(segmentPattern[6])
        }}
      />
    </div>
  );
});
