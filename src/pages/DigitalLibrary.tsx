import { DigitalCalendar, AudioDetailModal, PlantDetailModal, LibraryGrid, useDigitalLibrary } from "@/components/DigitalLibrary";

export default function DigitalLibraryPage() {
  const {
    sortedPlants,
    sortedAudios,
    scrollLeft,
    scrollAreaRef,
    handleScroll,
    // 音频模态框相关
    selectedAudio,
    isAudioModalOpen,
    audioAnimationData,
    handleAudioClick,
    closeAudioModal,
    // 植物模态框相关
    selectedPlant,
    isPlantModalOpen,
    plantAnimationData,
    handlePlantClick,
    closePlantModal
  } = useDigitalLibrary();

  return (
    <div 
      className="w-full h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("/library.png")` }}
    >
      {/* 横向滚动容器 */}
      <div 
        ref={scrollAreaRef}
        data-horizontal-scroll
        className="w-full overflow-x-auto overflow-y-hidden scrollbar-hidden px-12 py-8"
        onScroll={handleScroll}
      >
        {/* 使用 LibraryGrid 组件 */}
        <LibraryGrid
          sortedPlants={sortedPlants}
          sortedAudios={sortedAudios}
          onAudioClick={handleAudioClick}
          onPlantClick={handlePlantClick}
        />
      </div>

      <div className="calendar mt-12 flex justify-center scale-70">
        <DigitalCalendar scrollLeft={scrollLeft} />
      </div>
      
      {/* 音频详情模态框 */}
      <AudioDetailModal 
        audioRecord={selectedAudio}
        isOpen={isAudioModalOpen}
        onClose={closeAudioModal}
        animationData={audioAnimationData}
      />
      
      {/* 植物详情模态框 */}
      <PlantDetailModal 
        plant={selectedPlant}
        isOpen={isPlantModalOpen}
        onClose={closePlantModal}
        animationData={plantAnimationData}
      />
    </div>
  )
}
