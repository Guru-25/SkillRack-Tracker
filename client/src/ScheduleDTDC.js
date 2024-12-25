import React, { useState, useEffect } from 'react';
import './Schedule.css';
import Cookies from 'js-cookie';

const ScheduledtDc = ({ initialValues }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finishDate, setFinishDate] = useState(Cookies.get('finishDate') || '');
  const [trackIncrement, setTrackIncrement] = useState(0);

  useEffect(() => {
    if (initialValues) {
      setInitialValues(initialValues);
    }
  }, [initialValues]);

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

  const [initialValuesState, setInitialValues] = useState({
    codeTrack: '',
    problems: ''
  });

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

    const { codeTrack, problems } = initialValuesState;

    if (!finishDate) {
      setError('Please enter the date!!');
      setLoading(false);
      return;
    }

    let currentTracks = parseInt(codeTrack);
    let currentProblems = parseInt(problems);

    const targetProblems = 600;
    const today = new Date();
    const finish = new Date(finishDate);

    // Set both dates to the start of the day (midnight) to exclude time
    today.setHours(0, 0, 0, 0);
    finish.setHours(0, 0, 0, 0);

    // Calculate the difference in milliseconds between the two dates
    const diffMilliseconds = finish - today;

    // Convert milliseconds to fraction of a day
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
        track: currentTracks,
        totalSolved: currentProblems,
      },
    ];

    let currentDate = new Date(today);
    let neededToSolve = targetProblems - currentProblems;
    let trackIncrement = neededToSolve / daysToFinish;
    setTrackIncrement(trackIncrement);

    for (let i = 1; i <= daysToFinish; i++) {
      currentDate.setDate(currentDate.getDate() + 1);

      currentTracks += trackIncrement;
      currentProblems += trackIncrement;

      newSchedule.push({
        date: currentDate.toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }),
        track: Math.round(currentTracks), // To keep the track value an integer
        totalSolved: Math.round(currentProblems), // Round totalSolved to avoid floating-point issues
      });

      if (currentProblems >= targetProblems) break;
    }

    setSchedule(newSchedule);
    setLoading(false);
  };

  if (loading) return <div className="loading">Generating schedule...</div>;

  return (
    <div className="schedule-container">
      <h2 className="schedule-title">Schedule to Unlock DT / DC</h2>
      <div className="form-container">
        <input
          type="date"
          value={finishDate}
          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')}
          onChange={(e) => setFinishDate(e.target.value)}
          className="input-field date-input"
          style={{ marginBottom: '14px' }}
        />
        <button onClick={generateSchedule} className="generate-button">Generate</button>
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
                  <th>Tracks</th>
                  <th>Solved</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((day, index) => (
                  <tr key={index}>
                    <td>{day.date}</td>
                    <td>{day.track}</td>
                    <td>{day.totalSolved}</td>
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

export default ScheduledtDc;