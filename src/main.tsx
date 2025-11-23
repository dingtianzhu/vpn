import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // 确保这个路径是对的

// 注意这里的 '!' (非空断言)，TS 需要它来确认 root 元素一定存在
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);