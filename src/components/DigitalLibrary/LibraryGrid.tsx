import { memo } from "react";
import type { Plant, WateringRecord } from "@/types";
import { PlantBox, AudioBox, EmptyBox } from "./BoxComponents";

interface LibraryGridProps {
  sortedPlants: Plant[];
  sortedAudios: WateringRecord[];
  boxOffsets: {[key: string]: {x: number, y: number}};
  onAudioClick: (audioRecord: WateringRecord, event: React.MouseEvent) => void;
}

export const LibraryGrid = memo(function LibraryGrid({
  sortedPlants,
  sortedAudios,
  boxOffsets,
  onAudioClick
}: LibraryGridProps) {
  return (
    <div className="flex flex-col gap-16">
      {/* 第一行 - 确保至少显示2个空box */}
      <div className="flex gap-8">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`row1-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
            {i % 2 === 0 && sortedPlants.length > 0 ? (
              // 奇数位（索引0,2,4...）放PlantBox，如果有收藏植物的话
              <PlantBox 
                plant={sortedPlants[Math.floor(i/2) % sortedPlants.length]} 
                offset={boxOffsets[`row1-${i}`] || {x: 0, y: 0}}
              />
            ) : i < 4 ? (
              // 前4个位置（索引0,1,2,3）如果没有内容则显示空box，确保至少有2个空box
              <EmptyBox offset={boxOffsets[`row1-${i}`] || {x: 0, y: 0}} />
            ) : (
              // 其他位置留空
              <div className="w-32 h-32"></div>
            )}
          </div>
        ))}
      </div>

      {/* 第二行 - 确保至少显示1个空box */}
      <div className="flex gap-8">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`row2-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
            {i % 2 === 1 && sortedAudios.length > 0 ? (
              // 偶数位（索引1,3,5...）放AudioBox，如果有收藏浇水记录的话
              <AudioBox 
                audioRecord={sortedAudios[Math.floor(i/2) % sortedAudios.length]} 
                offset={boxOffsets[`row2-${i}`] || {x: 0, y: 0}}
                onClick={(event) => onAudioClick(sortedAudios[Math.floor(i/2) % sortedAudios.length], event)}
              />
            ) : i < 2 ? (
              // 前2个位置（索引0,1）如果没有内容则显示空box，确保至少有1个空box
              <EmptyBox offset={boxOffsets[`row2-${i}`] || {x: 0, y: 0}} />
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
