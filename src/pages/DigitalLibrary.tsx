import { DigitalCalendar, AudioDetailModal, LibraryGrid, useDigitalLibrary } from "@/components/DigitalLibrary";

export default function DigitalLibraryPage() {
  const {
    sortedPlants,
    sortedAudios,
    scrollLeft,
    scrollAreaRef,
    handleScroll,
    selectedAudio,
    isModalOpen,
    animationData,
    handleAudioClick,
    closeModal
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
        />
      </div>

      <div className="calendar mt-12 flex justify-center scale-70">
        <DigitalCalendar scrollLeft={scrollLeft} />
      </div>
      
      {/* 音频详情模态框 */}
      <AudioDetailModal 
        audioRecord={selectedAudio}
        isOpen={isModalOpen}
        onClose={closeModal}
        animationData={animationData}
      />
    </div>
  )
}
