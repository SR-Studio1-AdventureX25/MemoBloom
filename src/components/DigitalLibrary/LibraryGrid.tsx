import { memo } from "react";
import type { Plant, WateringRecord } from "@/types";
import { PlantBox, AudioBox, EmptyBox } from "./BoxComponents";

interface LibraryGridProps {
  sortedPlants: Plant[];
  sortedAudios: WateringRecord[];
  onAudioClick: (audioRecord: WateringRecord, event: React.MouseEvent) => void;
}

export const LibraryGrid = memo(function LibraryGrid({
  sortedPlants,
  sortedAudios,
  onAudioClick
}: LibraryGridProps) {
  // 判断是否有数据
  const hasData = sortedPlants.length > 0 || sortedAudios.length > 0;

  // 无数据时显示3个空框，按照和有数据时相同的间隔规则
  if (!hasData) {
    return (
      <div className="flex flex-col gap-16">
        {/* 第一行 - 在偶数位置显示2个空框 */}
        <div className="flex gap-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`empty-row1-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
              {i % 2 === 0 && i < 4 ? (
                // 偶数位置（0,2）显示空框
                <EmptyBox offset={{x: 0, y: 0}} />
              ) : (
                // 其他位置留空
                <div className="w-32 h-32"></div>
              )}
            </div>
          ))}
        </div>

        {/* 第二行 - 在奇数位置显示2个空框 */}
        <div className="flex gap-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`empty-row2-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
              {i % 2 === 1 && i < 4 ? (
                // 奇数位置（1,3）显示空框
                <EmptyBox offset={{x: 0, y: 0}} />
              ) : (
                // 其他位置留空
                <div className="w-32 h-32"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 有数据时正常渲染
  return (
    <div className="flex flex-col gap-16">
      {/* 第一行 */}
      <div className="flex gap-8">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`row1-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
            {i % 2 === 0 && sortedPlants.length > 0 ? (
              // 奇数位（索引0,2,4...）放PlantBox，如果有收藏植物的话
              <PlantBox 
                plant={sortedPlants[Math.floor(i/2) % sortedPlants.length]} 
                offset={{x: 0, y: 0}}
              />
            ) : (
              // 其他位置留空
              <div className="w-32 h-32"></div>
            )}
          </div>
        ))}
      </div>

      {/* 第二行 */}
      <div className="flex gap-8">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`row2-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
            {i % 2 === 1 && sortedAudios.length > 0 ? (
              // 偶数位（索引1,3,5...）放AudioBox，如果有收藏浇水记录的话
              <AudioBox 
                audioRecord={sortedAudios[Math.floor(i/2) % sortedAudios.length]} 
                offset={{x: 0, y: 0}}
                onClick={(event) => onAudioClick(sortedAudios[Math.floor(i/2) % sortedAudios.length], event)}
              />
            ) : (
              // 其他位置留空
              <div className="w-32 h-32"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
