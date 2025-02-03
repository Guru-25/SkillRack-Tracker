import React from 'react';

const Summary = ({ codeTutor, codeTrack, codeTest, dt, dc, totalPoints, percentage }) => {
  return (
    <aside style={{ 
      textAlign: 'center', 
      margin: '20px auto', 
      padding: '20px', 
      border: `1px solid var(--summary-border)`,
      borderRadius: '8px', 
      backgroundColor: 'var(--card-bg)', 
      color: 'var(--text-color)',
      width: 'fit-content'
    }}>
      <h3 className='fix-width' >Points Calculation Summary</h3>
      <p>Code Tutor: {codeTutor} x 0 = 0</p>
      <p>Code Tracks: {codeTrack} x 2 = {codeTrack * 2}</p>
      <p>DC: {dc} x 2 = {dc * 2}</p>
      <p>DT: {dt} x 20 = {dt * 20}</p>
      <p>Code Tests: {codeTest} x 30 = {codeTest * 30}</p>
      <hr />
      <p><strong>Points = {totalPoints}</strong> {percentage <= 100 ? `(${percentage}%)` : ''}</p>
    </aside>
  );
};

export default Summary;
