import React, { useState, useEffect } from 'react';
import './Schedule.css';
import Cookies from 'js-cookie';

const Schedule = ({ initialValues }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finishDate, setFinishDate] = useState(Cookies.get('finishDate') || '');
  const [manualTarget, setManualTarget] = useState(Cookies.get('manualTarget') === 'true' || false);
  const [targetPoints, setTargetPoints] = useState(Cookies.get('targetPoints') || '');
  const [displayPoints, setDisplayPoints] = useState('');
  const [trackIncrement, setTrackIncrement] = useState(0);

  const [initialValuesState, setInitialValues] = useState({
    codeTrack: '',
    dt: '',
    dc: '',
    points: '',
    requiredPoints: '',
    codeTest: ''
  });

  useEffect(() => {
    if (initialValues) {
      setInitialValues({
        ...initialValues,
        requiredPoints: initialValues.requiredPoints || ''
      });

      if (!manualTarget) {
        setManualTarget(
          (initialValues.requiredPoints === 0 || (initialValues.points >= initialValues.requiredPoints))
        );
        setTargetPoints(
          (initialValues.requiredPoints > 0 && initialValues.points < initialValues.requiredPoints) ? initialValues.requiredPoints : ''
        );
        setDisplayPoints(initialValues.requiredPoints);
      }
    }
  }, [initialValues, manualTarget]);

  useEffect(() => {
    setDisplayPoints(
      manualTarget ? targetPoints : initialValuesState.requiredPoints
    );
  }, [targetPoints, manualTarget, initialValuesState.requiredPoints]);

  useEffect(() => {
    if (initialValues.deadline) {
      const currentDate = new Date();
      const deadlineDate = new Date(initialValues.deadline);
      if (
        initialValues.points < initialValues.requiredPoints &&
        currentDate < deadlineDate
      ) {
        setFinishDate(initialValues.deadline);
      }
    }
  }, [initialValues.deadline, initialValues.points, initialValues.requiredPoints]);

  useEffect(() => {
    const savedFinishDate = Cookies.get('finishDate');
    if (savedFinishDate) {
      setFinishDate(savedFinishDate);
    }
  }, []);
  
  useEffect(() => {
    Cookies.set('finishDate', finishDate, {
      expires: 365,
      sameSite: 'Lax',
      secure: true
    });
  }, [finishDate]);

  useEffect(() => {
    const savedTargetPoints = Cookies.get('targetPoints');
    if (savedTargetPoints) {
      setTargetPoints(savedTargetPoints);
    }
  }, []);
  
  useEffect(() => {
    Cookies.set('targetPoints', targetPoints, {
      expires: 365,
      sameSite: 'Lax',
      secure: true
    });
  }, [targetPoints]);

  useEffect(() => {
    Cookies.set('manualTarget', manualTarget, {
      expires: 365,
      sameSite: 'Lax',
      secure: true
    });
  }, [manualTarget]);

  const calculatePoints = (tracks, dt, dc, codeTest) => {
    return Math.floor(tracks) * 2 + Math.floor(dt) * 20 + Math.floor(dc) * 2 + Math.floor(codeTest) * 30;
  };

  const getDifficulty = (increment) => {
    if (increment <= 10) return 'Easy';
    if (increment <= 25) return 'Medium';
    if (increment <= 50) return 'Hard';
    return 'Very Hard';
  };

  const getDifficultyColor = (increment) => {
    if (increment <= 10) return '#4CAF50';
    if (increment <= 25) return '#ffa500';
    return '#F44336';
  };

  const generateSchedule = () => {
    setLoading(true);
    setError('');

    const { codeTrack, dt, dc, points, codeTest } = initialValuesState;

    if (!finishDate) {
      setError('Please enter the date!!');
      setLoading(false);
      return;
    }

    if (manualTarget && !targetPoints) {
      setError('Please enter target points!!');
      setLoading(false);
      return;
    }

    let currentTracks = parseInt(codeTrack);
    let currentDt = parseInt(dt);
    let currentDc = parseInt(dc);
    let currentPoints = parseInt(points);
    let currentCodeTest = parseInt(codeTest);

    const targetPointsValue = manualTarget ? 
      (targetPoints || 0) : 
      (initialValuesState.requiredPoints || 0);

    if (targetPointsValue < 1) {
      setError('Target points must be greater than 0!');
      setLoading(false);
      return;
    }
    
    if (targetPointsValue > 99999) {
      setError('Target points cannot exceed 99999!');
      setLoading(false);
      return;
    }

    if (targetPointsValue <= currentPoints) {
      setError(`Target points must be greater than current points ${currentPoints}!!`);
      setLoading(false);
      return;
    }

    const today = new Date();
    const finish = new Date(finishDate);

    today.setHours(0, 0, 0, 0);
    finish.setHours(0, 0, 0, 0);

    const diffMilliseconds = finish - today;
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const daysToFinish = diffMilliseconds / oneDayInMilliseconds;

    if (daysToFinish <= 0) {
      setError('Date must be in the future!!');
      setLoading(false);
      return;
    }

    let newSchedule = [
      {
        date: today.toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }),
        tracks: currentTracks,
        dt: currentDt,
        dc: currentDc,
        points: currentPoints,
      },
    ];

    let currentDate = new Date(today);
    let remainingPoints = targetPointsValue - currentPoints;
    
    const pointsFromDtDc = daysToFinish * (20 + 2);
    const remainingPointsForTracks = remainingPoints - pointsFromDtDc;
    const trackIncrement = Math.max(0, Math.ceil(remainingPointsForTracks / (2 * daysToFinish)));
    setTrackIncrement(trackIncrement);

    for (let i = 1; i <= daysToFinish; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDt += 1;
      currentDc += 1;
      currentTracks += trackIncrement;

      currentPoints = calculatePoints(currentTracks, currentDt, currentDc, currentCodeTest);
      
      if (currentPoints >= targetPointsValue) {
        const prevDt = currentDt - 1;
        const prevDc = currentDc - 1;
        const prevTracks = currentTracks - trackIncrement;
        let prevPoints = calculatePoints(prevTracks, prevDt, prevDc, currentCodeTest);
        
        let finalDt = prevDt;
        let finalDc = prevDc;
        let finalTracks = prevTracks;
        let finalPoints = prevPoints;
        
        const pointsNeeded = targetPointsValue - prevPoints;

        if (pointsNeeded <= 2) {
          finalDc++;
          finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
          
          if (finalPoints < targetPointsValue) {
            finalDt++;
            finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
            
            while (finalPoints < targetPointsValue) {
              finalTracks++;
              finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
            }
          }
        } else {
          finalDt++;
          finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
          
          if (finalPoints < targetPointsValue) {
            finalDc++;
            finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
            
            while (finalPoints < targetPointsValue) {
              finalTracks++;
              finalPoints = calculatePoints(finalTracks, finalDt, finalDc, currentCodeTest);
            }
          }
        }

        newSchedule.push({
          date: currentDate.toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }),
          tracks: Math.floor(finalTracks),
          dt: finalDt,
          dc: finalDc,
          points: Math.floor(finalPoints)
        });
        break;
      }

      newSchedule.push({
        date: currentDate.toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }),
        tracks: Math.floor(currentTracks),
        dt: currentDt,
        dc: currentDc,
        points: Math.floor(currentPoints)
      });
    }

    setSchedule(newSchedule);
    setLoading(false);
  };

  if (loading) return <div className="loading">Generating schedule...</div>;

  return (
    <div className="schedule-container">
      <h2 className="schedule-title">Schedule for {displayPoints === 0 ? "" : `${displayPoints}`} Points</h2>
      <div className="form-container">
        <input
          type="date"
          value={finishDate}
          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')}
          onChange={(e) => setFinishDate(e.target.value)}
          className="input-field date-input"
        />
        <div className="manual-target-container">
          {(initialValues.requiredPoints !== 0 && (initialValues.points < initialValues.requiredPoints)) && (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualTarget}
                  onChange={() => {
                    setManualTarget(!manualTarget);
                    if (!manualTarget) {
                      setTargetPoints(initialValuesState.requiredPoints > 0 ? initialValuesState.requiredPoints : '');
                    }
                  }}
                  style={{ marginBottom: '18px' }}
                />
                &nbsp;Manually set target points
              </label>
            </div>
          )}
          {manualTarget && (
            <div className="fade-in">
              <input
                type="number"
                value={targetPoints}
                onChange={(e) => setTargetPoints(e.target.value)}
                placeholder={`Points > ${initialValues.points}`}
                className="input-field target-input"
              />
            </div>
          )}
        </div>
        <button onClick={generateSchedule} className="generate-button" style={{ marginTop: '10px'}} >Generate</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {schedule.length > 0 && (
        <>
          <div style={{ padding: '1px', textAlign: 'center' }}>
            <p><b>Tracks / day</b>: {Math.ceil(trackIncrement)}</p>
            <p>
              <b>Difficulty</b>: 
              <span style={{ color: getDifficultyColor(trackIncrement), fontWeight: 'bold', marginLeft: '5px' }}>
                {getDifficulty(trackIncrement)}
              </span>
            </p>
          </div>
          <div className="schedule-table-container fade-in">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Track</th>
                  <th>DT</th>
                  <th>DC</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((day, index) => (
                  <tr key={index}>
                    <td>{day.date}</td>
                    <td>{day.tracks}</td>
                    <td>{day.dt}</td>
                    <td>{day.dc}</td>
                    <td>{day.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Schedule;
