import { memo } from "react";
import { SevenSegmentDigit } from "./SevenSegmentDigit";

// 数码管风格的时间显示组件
export const DigitalCalendar = memo(function ({ scrollLeft = 0 }: { scrollLeft?: number }) {
  // 根据滚动位置和时间首位估计时间
  const getEstimatedTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // 根据滚动位置调整时间（简单的估算逻辑）
    const scrollFactor = Math.floor(scrollLeft / 100); // 每100px滚动调整1个单位
    const estimatedMonth = Math.max(1, Math.min(12, month + scrollFactor));
    
    return { year, month: estimatedMonth };
  };

  const { year, month } = getEstimatedTime();

  return (
    <div className="flex items-center justify-center p-4">
      {/* 一行显示年份和月份，中间用空格隔开 */}
      <div className="flex items-center gap-6">
        {/* 年份 */}
        <div className="flex items-center gap-1">
          <SevenSegmentDigit digit={Math.floor(year / 1000)} />
          <SevenSegmentDigit digit={Math.floor((year % 1000) / 100)} />
          <SevenSegmentDigit digit={Math.floor((year % 100) / 10)} />
          <SevenSegmentDigit digit={year % 10} />
        </div>
        
        {/* 月份 */}
        <div className="flex items-center gap-1">
          <SevenSegmentDigit digit={Math.floor(month / 10)} />
          <SevenSegmentDigit digit={month % 10} />
        </div>
      </div>
    </div>
  );
});
