import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 确保在你的应用启动之前，Buffer 已经被定义
// 这是解决 "Buffer is not defined" 错误的关键一步
import { Buffer } from 'buffer';
window.Buffer = Buffer;


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
