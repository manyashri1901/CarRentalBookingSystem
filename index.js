// carrentapp/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css'; // or './App.css' if that's where your styles are

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
