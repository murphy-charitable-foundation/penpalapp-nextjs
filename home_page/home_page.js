import React from 'react';
import './style.css'; // Assuming the CSS file is in the same folder
import logo from '/public/logo.png';
import cover from '/public/murph.jpg';

function PenPalProgramUI() {
  return (
    <div>
      <header className="header">
        <div className="txt">
          <p id="tx1">Project: Pen Pal Program</p>
          <p id="tx2">Content: Design App and Web</p>
          <p id="tx3">Actualized: February 2024</p>
        </div>
      </header>

      <div className="content">
        <div className="logo-and-image">
          <div className="logo">
            <img src= {logo} alt="Murphy Charitable Foundation Logo" />
          </div>
          <div className="image">
            <img src={cover} alt="Pen Pal Program Image" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PenPalProgramUI;
