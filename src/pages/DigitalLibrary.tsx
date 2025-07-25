
export default function DigitalLibraryPage() {
  return (
    <div style={{
      backgroundImage: `url("/library.png")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '100%',
      height: '100vh',
      position: 'relative'
    }}>
      {/* 横向滚动容器 */}
      <div 
        data-horizontal-scroll
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '1200px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}>
        {/* 内容容器 - 足够宽以容纳所有卡片 */}
        <div style={{
          width: '2400px', // 10个卡片 × (200px + 16px间距) × 1.2 的宽度
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* 第一行卡片 */}
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`book-${i + 1}`}
                style={{
                  minWidth: '200px',
                  height: '150px',
                  backgroundColor: `hsl(${(i * 36) % 360}, 70%, 80%)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  flexShrink: 0,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                图书 {i + 1}
              </div>
            ))}
          </div>

          {/* 第二行卡片 */}
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`doc-${i + 1}`}
                style={{
                  minWidth: '200px',
                  height: '150px',
                  backgroundColor: `hsl(${((i * 36) + 180) % 360}, 60%, 75%)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  flexShrink: 0,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
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
