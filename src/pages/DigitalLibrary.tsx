import { useEffect, useRef } from "react";

export default function DigitalLibraryPage() {

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // 页面加载时向右滚动 300px
      scrollAreaRef.current.scrollLeft = 90;
    }
  }, []);

  return (
    <div 
      className="w-full h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("/library.png")` }}
    >
      {/* 横向滚动容器 */}
      <div 
        ref={scrollAreaRef}
        data-horizontal-scroll
        className="absolute top-1/4 -translate-y-1/2 left-0 w-full overflow-x-auto overflow-y-hidden scrollbar-hidden pl-6"
      >
        {/* 内容容器 - 足够宽以容纳所有卡片 */}
        <div className="w-[2400px] flex flex-col gap-5">
          {/* 第一行卡片 */}
          <div className="flex gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`book-${i + 1}`}
                className="min-w-[200px] h-[150px] rounded-xl flex items-center justify-center text-base font-bold text-gray-700 flex-shrink-0 border-2 border-white/30 shadow-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
                style={{
                  backgroundColor: `hsl(${(i * 36) % 360}, 70%, 80%)`
                }}
              >
                图书 {i + 1}
              </div>
            ))}
          </div>

          {/* 第二行卡片 */}
          <div className="flex gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`doc-${i + 1}`}
                className="min-w-[200px] h-[150px] rounded-xl flex items-center justify-center text-base font-bold text-gray-700 flex-shrink-0 border-2 border-white/30 shadow-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
                style={{
                  backgroundColor: `hsl(${((i * 36) + 180) % 360}, 60%, 75%)`
                }}
              >
                文档 {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
