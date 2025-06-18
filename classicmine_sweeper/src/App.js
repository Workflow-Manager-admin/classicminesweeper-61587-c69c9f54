import React from 'react';
import './App.css';
import ClassicMineSweeper from './ClassicMineSweeper';
import './ClassicMineSweeper.css';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn" disabled>MineSweeper App</button>
          </div>
        </div>
      </nav>
      <main>
        <div className="container">
          <ClassicMineSweeper />
        </div>
      </main>
    </div>
  );
}

export default App;