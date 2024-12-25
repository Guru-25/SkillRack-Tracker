import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { IoMdArrowRoundForward } from "react-icons/io";
// import { FaLinkedin } from 'react-icons/fa';
// // import { useHistory } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { HelmetProvider, Helmet } from 'react-helmet-async';
import Summary from './Summary';
import Schedule from './Schedule';
import ScheduleDTDC from './ScheduleDTDC';
import './App.css';

// Custom Modal Component
const Modal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;
  return (
    <div className="modal">
      <div className="modal-content fade-in">
        <p>{message}</p>
        <button onClick={onConfirm} className="modal-button">Yes</button>
        <button onClick={onClose} className="modal-button">No</button>
      </div>
    </div>
  );
};

const getName = (name) => {
  const words = name.split(' ').filter(word => word.length > 0);
  
  let selectedName = words[0];
  
  if (selectedName.length <= 2) {
    const longerName = words.find(word => word.length > 2);
    if (longerName) {
      selectedName = longerName;
    } else {
      selectedName = words[words.length - 1];
      return selectedName;
    }
  }
  
  return selectedName.toLowerCase().charAt(0).toUpperCase() + selectedName.slice(1).toLowerCase();
}

const getGreeting = (name) => {
  // const date = new Date().toLocaleString('en-GB', { 
  //   timeZone: 'Asia/Kolkata',
  //   hour12: false
  // });
  // const hour = parseInt(date.split(',')[1].split(':')[0]);
  
  const capitalizedName = getName(name);
  
  // let greeting = '';
  // if (hour >= 6 && hour < 12) {
  //   greeting = 'Good morning';
  // } else if (hour >= 12 && hour < 17) {
  //   greeting = 'Good afternoon';
  // } else if (hour >= 17 && hour < 20) {
  //   greeting = 'Good evening';
  // } else {
  //   greeting = 'Happy late night';
  // }
  
  return `🎄 Merry Christmas ${capitalizedName} 😊`;
}

// const ReleaseNote = () => {
//   return (
//     <div className="release-note">
//       <span className="new-badge">NEW!</span>Plan with AI <b>2.0</b>: Smarter, better — try now!
//     </div>
//   );
// };

const App = () => {
  const initialState = {
    url: '',
    points: 0,
    percentage: 0,
    error: '',
    isValidUrl: false,
    lastFetched: null,
    name: '',
    codeTutor: 0,
    codeTrack: 0,
    codeTest: 0,
    dt: 0,
    dc: 0,
    requiredPoints: 0,
    deadline: null,
    college: null,
    year: 0,
    showSchedule: false,
    showScheduleDTDC: false,
    loading: false,
    showLogoutModal: false
  };

  // const [isStandalone, setIsStandalone] = useState(false);
  // const [isMobile, setIsMobile] = useState(false);

  const [state, setState] = useState(initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = Cookies.get('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isVisible, setIsVisible] = useState(true);
  // const [certificateUrl, setCertificateUrl] = useState('');
  // // const history = useHistory();
  const handleStateChange = useCallback((newState) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  const fetchData = useCallback((data) => {
    handleStateChange({
      name: data.name,
      points: data.points,
      percentage: data.percentage,
      lastFetched: data.lastFetched,
      codeTutor: data.codeTutor,
      codeTrack: data.codeTrack,
      codeTest: data.codeTest,
      dt: data.dt,
      dc: data.dc,
      requiredPoints: data.requiredPoints,
      deadline: data.deadline,
      college: data.college,
      year: data.year
    });
  }, [handleStateChange]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Save theme to cookie
    Cookies.set('theme', theme, { 
      expires: 365,
      sameSite: 'Lax',
      secure: true
    }); // Expires in 1 year
  }, [theme]);

  useEffect(() => {
    // // Check if the app is running as an installed PWA
    // const checkStandalone = () => {
    //   if (window.matchMedia('(display-mode: standalone)').matches) {
    //     setIsStandalone(true);
    //   } else if (window.navigator.standalone) {  // For iOS devices
    //     setIsStandalone(true);
    //   } else {
    //     setIsStandalone(false);
    //   }
    // };

    // // Check if the user is on a mobile device
    // const checkMobile = () => {
    //   setIsMobile(window.innerWidth <= 768); // Adjust the width as necessary
    // };

    // checkStandalone();
    // checkMobile();

    // window.addEventListener('resize', checkMobile);

    const fetchInitialData = async () => {
      const lastUrl = Cookies.get('lastUrl');

      if (lastUrl) {
        try {
          const { data } = await axios.get(`/api/points/refresh?url=${encodeURIComponent(lastUrl)}`);
          if (data && data.name !== '') {
            fetchData(data);
            handleStateChange({ isValidUrl: true, url: lastUrl });
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            handleStateChange({ error: 'Too many requests! Please try again after 60 seconds!!', loading: false });
          }
          Cookies.remove('lastUrl');
        }
      }
      setIsInitialized(true);
      setIsLoading(false);
    };

    fetchInitialData();
  }, [fetchData, handleStateChange]);

  // Theme management
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  };

  // Scroll handling
  useEffect(() => {
    let prevScrollPos = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setIsVisible(prevScrollPos > currentScrollPos || currentScrollPos < 50);
      prevScrollPos = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isValidSkillRackUrl = (url) => {
    const regex = /^https?:\/\/www\.skillrack\.com/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleStateChange({ error: '' });

    if (!isValidSkillRackUrl(state.url)) {
      handleStateChange({ error: 'Invalid URL! Please watch the above Tutorial video!!' });
      return;
    }

    handleStateChange({ loading: true });
    try {
      const { data } = await axios.post('/api/points', { url: state.url });
      if (data && data.name !== '') {
        fetchData(data);
        handleStateChange({ isValidUrl: true, loading: false });
        Cookies.set('lastUrl', data.url, {
          expires: 365, // Set to expire in 1 year
          sameSite: 'Lax',
          secure: true
        });
      } else {
        handleStateChange({ error: 'Invalid URL! Please watch the above Tutorial video!!', loading: false });
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        handleStateChange({ error: 'Too many requests! Please try again after 60 seconds!!', loading: false });
      } else {
        handleStateChange({ error: 'Invalid URL! Please watch the above Tutorial video!!', loading: false });
      }
    }
    handleStateChange({ loading: false });
  };

  const handleLogout = () => {
    handleStateChange({ showLogoutModal: true });
  };

  const confirmLogout = () => {
    setState(initialState);
    Cookies.remove('lastUrl');
    Cookies.remove('finishDate');
    Cookies.remove('manualTarget');
    Cookies.remove('targetPoints');
  };

  const handleGenerateSchedule = () => {
    handleStateChange({ showSchedule: true });
  };

  const handleGenerateScheduleDTDC = () => {
    handleStateChange({ showScheduleDTDC: true });
  };

  // const handleGenerateCertificate = async () => {
  //   try {
  //     const { data } = await axios.post('/api/certificate/generate', {
  //       userId: state.id, // Add 'id' to state when fetching user data
  //       name: state.name,
  //       points: state.points,
  //       message: 'Certified SkillRack Points Achiever'
  //     });
  //     setCertificateUrl(data.url);
  //   } catch (error) {
  //     console.error('Error generating certificate:', error);
  //   }
  // };

  // const handleShareOnLinkedIn = () => {
  //   const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;
  //   window.open(shareUrl, '_blank');
  // };

  // Don't render anything until initialization is complete or while loading
  if (!isInitialized || isLoading || state.loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)'
      }}>
        <h1 style={{
          animation: 'pulse 2s infinite'
        }}>
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Helmet>
          <title>SkillRack Tracker</title>
          <meta property="og:title" content="SkillRack Tracker" />
          <meta name="description" content="Track and calculate your SkillRack points effortlessly using this powerful tool." />
          <link rel="canonical" href="https://skillrack.gururaja.in" />
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "SkillRack Tracker",
                "alternateName": "SkillTrack",
                "url": "https://skillrack.gururaja.in/",
                "description": "Track and calculate your SkillRack points effortlessly using this powerful tool.",
                "author": {
                  "@type": "Person",
                  "name": "Guru"
                }
              }
            `}
          </script>
        </Helmet>
        <h1>SkillRack Tracker</h1>
        <Analytics/>
        <SpeedInsights/>
        <button 
          className={`theme-toggle ${isVisible ? 'visible' : 'hidden'}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MdDarkMode color='orange' size={18} /> : <MdLightMode color='orange' size={18} />}
        </button>
        {!state.isValidUrl && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <p style={{maxWidth: 600}}>Login to <a href="https://www.skillrack.com/faces/candidate/manageprofile.xhtml" target="_blank" rel="noopener noreferrer"><b>SkillRack</b></a> <IoMdArrowRoundForward size={12}/> Profile <IoMdArrowRoundForward size={12}/> Enter Password <IoMdArrowRoundForward size={12}/> Click "View" <IoMdArrowRoundForward size={12}/> Copy the URL<br /><br />Tutorial: <a href="https://youtu.be/BsrCYe9Ytuw" target="_blank" rel="noopener noreferrer"><b>Watch on YouTube</b></a></p>
            <input
              type="password"
              value={state.url}
              onChange={(e) => handleStateChange({ url: e.target.value.trim() })}
              placeholder="Paste Profile URL"
              name="profile_url"
              style={{ width: '100%', maxWidth: '300px', padding: '10px', boxSizing: 'border-box' }}
            />
            <button type="submit" className="submit-button">Submit</button>
            {state.error && (
              <p style={{ 
                color: 'var(--error-color)',
              }}>
                {state.error}
              </p>
            )}
          </form>
        )}
        {state.isValidUrl && (
          <>
            {/* <ReleaseNote />
            <br style={{ marginBottom: '6px' }} /> */}
            <p>Updated on {state.lastFetched}</p>
            <br style={{ marginBottom: '15px' }} />
            <h2 className='fix-width'>{getGreeting(state.name)}</h2>
            <div style={{ width: '200px', margin: '50px auto' }}>
              <CircularProgressbar
                value={state.percentage}
                text={(state.points <= state.requiredPoints) && (state.points !== 0) 
                  ? `${state.points}/${state.requiredPoints}` 
                  : `${state.points}`}
                styles={buildStyles({
                  // Use CSS variables for theme-aware colors
                  textColor: 'var(--progress-text)',
                  pathColor: 'var(--progress-circle)',
                  trailColor: 'var(--input-border)',
                  textSize: '16px',
                  // Add transition for smooth theme switching
                  transition: 'stroke-dashoffset 0.5s ease 0s',
                })}
              />
            </div>

            {state.points >= state.requiredPoints && state.requiredPoints !== 0 && (
              <>
                <h3 className='fix-width'>Congratulations 🎉 {getName(state.name)} on completing {state.requiredPoints} points!</h3>
                <br />
              </>
            )}
            <Summary
              codeTutor={state.codeTutor}
              codeTrack={state.codeTrack}
              codeTest={state.codeTest}
              dt={state.dt}
              dc={state.dc}
              totalPoints={state.points}
              percentage={state.percentage}
            />
            <br /><br />
            
            {((state.codeTutor + state.codeTrack + state.codeTest) >= 600) && (
              <>
                <button onClick={handleGenerateSchedule} className="generate-schedule-button">✨ Plan with AI ✨</button><br /><br /><br /><br />
                {state.showSchedule && (
                  <div className="fade-in">
                    <Schedule
                      initialValues={{
                        codeTrack: state.codeTrack,
                        dt: state.dt,
                        dc: state.dc,
                        points: state.points,
                        requiredPoints: state.requiredPoints,
                        deadline: state.deadline,
                        codeTest: state.codeTest
                      }}
                    />
                    <br />
                  </div>
                )}
              </>
            )}
            {(state.codeTutor + state.codeTrack + state.codeTest) < 600 && (
              <>
                <button onClick={handleGenerateScheduleDTDC} className="generate-schedule-button">✨ Plan with AI ✨</button><br /><br /><br /><br />
                {state.showScheduleDTDC && (
                  <div className="fade-in">
                    <ScheduleDTDC
                      initialValues={{
                        codeTrack: state.codeTrack,
                        problems: state.codeTrack + state.codeTutor + state.codeTest,
                      }}
                    />
                    <br />
                  </div>
                )}
              </>
            )}

            {/* <br /><br />
            <button onClick={handleGenerateCertificate} className="generate-certificate-button">Generate Certificate</button>
            {certificateUrl && (
              <div className="certificate-share">
                <p>Your certificate is ready!</p>
                <input type="text" value={certificateUrl} readOnly />
                <button onClick={() => navigator.clipboard.writeText(certificateUrl)}>Copy URL</button>
                <button onClick={handleShareOnLinkedIn}><FaLinkedin size={20} /> Share on LinkedIn</button>
              </div>
            )} */}
          </>
        )}
        <footer>
          {/* {!isStandalone && isMobile && (
            <a href="https://play.google.com/store/apps/details?id=in.gururaja.in.skillrack" target="_blank" rel="noopener noreferrer">
              <img src=".assets/badge_googleplay.png" alt="Get it on Google Play" height="80" />
            </a>
          )}
          <br /><br /> */}
          {state.isValidUrl && (
            <>
              <details>
                <summary>&nbsp;Support this Service!</summary>
                <br />
                <p style={{ maxWidth: "350px", textAlign: "center", margin: "0 auto" }}>
                    If you find this platform helpful, a small donation of ₹5-10 can help us cover server costs and improve the service. 
                    Every contribution makes a difference, and we truly appreciate your support!
                </p>
                <p>
                  <strong>Donate here:&nbsp;
                    <a 
                        href="https://gururaja.in/donate" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        Click to Donate
                    </a>
                  </strong>
                </p>
              </details>
              <br /><br />
              <div className='para-container'>
                <ul>
                  <li><b>College</b>: {state.college.includes(",") ? state.college.split(",")[0] : state.college}</li>
                  <li><b>Year</b>: {state.year}</li>
                  <li><b>Required Points</b>: {state.requiredPoints !== 0 ? state.requiredPoints : <i>Unknown</i>}</li>
                  <li><b>Deadline</b>: {state.deadline !== null ? new Date(state.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : <i>Unknown</i>}</li>
                </ul>
                <div style={{paddingBottom: '16px'}}>
                  <details>
                    <summary style={{textAlign: 'center'}}>&nbsp;Report</summary>
                      <br/>
                      Email <a href="mailto:mail@gururaja.in">mail@gururaja.in</a> with the correct details assigned by your college!
                  </details>
                </div>
              </div>
              <br /><br />
            </>
          )}
          {/* <ReleaseNote /> */}
          {state.isValidUrl && (
            <>
              <button onClick={handleLogout} className="logout-button">Logout</button>
              
            </>
          )}
          <br /><br /><br /><br />
          made with ❤️ by <a href="https://gururaja.in" target="_blank" rel="noopener noreferrer"><b>someone</b></a>
        </footer>
        <Modal
          show={state.showLogoutModal}
          onClose={() => handleStateChange({ showLogoutModal: false })}
          onConfirm={confirmLogout}
          message="Are you sure you want to Logout?"
        />
      </div>
    </HelmetProvider>
  );
};

export default App;
