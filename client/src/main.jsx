import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css'; // base styles first so page stylesheets can override them
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
