import { memo } from "react";
import type { Plant, WateringRecord } from "@/types";

// 基于植物ID的哈希算法，确保分配规则固定不变
const getSpecimenImage = (plantId: string): string => {
  const hash = plantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIndex = (hash % 3) + 1; // 1, 2, 3
  return `/specimen${imageIndex}.png`;
};

const PlantBox = memo(function ({
  plant, 
  offset, 
  onClick
}: {
  plant: Plant, 
  offset: {x: number, y: number}, 
  onClick: (event: React.MouseEvent) => void
}) {
  const specimenImage = getSpecimenImage(plant.id);
  
  return (
    <div 
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300 cursor-pointer hover:scale-105"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `
      }}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center p-2">
        <img 
          src={specimenImage} 
          className="w-full h-full object-cover rounded-lg scale-85" 
          alt={`${plant.variety} 标本`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}
        />
      </div>
    </div>
  );
});

const AudioBox = memo(function ({audioRecord, offset, onClick}: {audioRecord: WateringRecord, offset: {x: number, y: number}, onClick: (event: React.MouseEvent) => void}){
  return (
    <div
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300 cursor-pointer hover:scale-105"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `
      }}
      onClick={onClick}
    >
        <img src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"} className="scale-85" />
    </div>
  );
});

const EmptyBox = memo(function ({offset}: {offset: {x: number, y: number}}) {
  return (
    <div 
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `,
        opacity: 0.7
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
        空
      </div>
    </div>
  );
});

export { PlantBox, AudioBox, EmptyBox };
