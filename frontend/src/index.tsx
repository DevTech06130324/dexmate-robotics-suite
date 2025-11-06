import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/variable.css';
import '@fontsource/space-grotesk/variable.css';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
