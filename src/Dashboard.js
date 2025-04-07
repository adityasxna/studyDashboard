import React, { useState, useEffect, useRef } from 'react';
import { Button, Container, Row, Col, Form, ListGroup, Card, ProgressBar, Alert, Image, Navbar, Nav } from 'react-bootstrap';
import { 
  FaPlay, FaPause, FaUndo, FaCheck, FaTrash, FaVolumeMute, 
  FaVolumeUp, FaEye, FaEyeSlash, FaSun, FaMoon, FaHourglass, 
  FaSignOutAlt, FaHistory 
} from 'react-icons/fa';
import { Howl } from 'howler';
import './index.css';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import Tasklog from './components/Tasklog';

const Dashboard = () => {
    // Dark Mode State
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = async () => {
        try {
          await signOut(auth);
          // Optional: You might want to redirect after logout
          // navigate('/login');
        } catch (error) {
          console.error('Logout failed:', error);
        }
      };
    
    // Apply dark mode theme
    useEffect(() => {
      document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);
  
    // Pomodoro Timer States
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const alertSound = useRef(null);
    const [showTasklog, setShowTasklog] = useState(false);
    
    // Cute GIF State
    const [showGif, setShowGif] = useState(true);
    const [currentGifIndex, setCurrentGifIndex] = useState(0);
    
    // Array of cute GIFs
    const cuteGifs = [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXd1d2RqMDhhbjk1OTlteHJmY2p4MTJmZzhweHF1OWptdW5keXJmZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3oKIPsx2VAYAgEHC12/giphy.gif", // Studying cat
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTd0ZzNxbTgyMnRzYnYyZWl6ZGZ3Z2tvNXprYTUxeWU5OGdneTg1aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/PMVB0m9UNjhwk/giphy.gif", // Coffee cup
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMW9iOWVraGt5Nmcwa2Y1dGdqeGN5cXNoeWE3Y2t1Z291ejlyaGh6biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l4KibK3JwaVo0CjDO/giphy.gif", // Pusheen typing
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWtzNjdkOGJzZW9xMGt5M200Yjg4ZHQ5OTdoMmd3YmppaGhxdDB2ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/W0cp0WkK6q2YnwM4Ox/giphy.gif" // Cute fox studying
    ];
    
    // Change GIF every 60 seconds
    useEffect(() => {
      const gifTimer = setInterval(() => {
        setCurrentGifIndex((prevIndex) => (prevIndex + 1) % cuteGifs.length);
      }, 60000);
      
      return () => clearInterval(gifTimer);
    }, []);
    
    // Initialize alert sound
    useEffect(() => {
      alertSound.current = new Howl({
        src: ['https://assets.coderrocketfuel.com/pomodoro-times-up.mp3'],
        volume: 0.5
      });
    }, []);
  
    // Pomodoro Timer Logic
    useEffect(() => {
      let timer;
      if (isActive) {
        timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsActive(false);
              if (!isBreak) {
                setPomodoroCount(prev => prev + 1);
                setShowAlert(true);
                alertSound.current.play();
              }
              return isBreak ? 25 * 60 : 5 * 60;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        clearInterval(timer);
      }
      return () => clearInterval(timer);
    }, [isActive, isBreak]);
  
    const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
    };
  
    const startBreak = () => {
      setIsBreak(true);
      setTimeLeft(5 * 60);
      setIsActive(true);
      setShowAlert(false);
    };
  
    // To-Do List
    const [task, setTask] = useState('');
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
  
    const addTask = async (e) => {
      e.preventDefault();
      if (task.trim()) {
        const newTask = { 
          text: task, 
          completed: false,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        };
        
        // Add to local state
        setTasks([...tasks, newTask]);
        setTask('');
        
        // Save to Firestore
        try {
          const docRef = await addDoc(collection(db, "tasks"), newTask);
          console.log("Task saved with ID: ", docRef.id);
        } catch (error) {
          console.error("Error adding task: ", error);
        }
      }
    };
  
    const toggleComplete = (index) => {
      const newTasks = [...tasks];
      newTasks[index].completed = !newTasks[index].completed;
      setTasks(newTasks);
      
      // Update completed tasks count
      setCompletedTasks(newTasks.filter(task => task.completed));
    };
  
    const removeTask = (index) => {
      setTasks(tasks.filter((_, i) => i !== index));
    };
  
    // Lofi Music Player
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    
    const tracks = [
      { title: 'Lofi Track 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { title: 'Lofi Track 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { title: 'Lofi Track 3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ];
    
    const sound = useRef(null);
  
    useEffect(() => {
      // Initialize the sound object
      sound.current = new Howl({
        src: [tracks[currentTrackIndex].url],
        loop: false,
        volume: volume,
        onend: () => {
          // Play the next track when current one ends
          nextTrack();
        }
      });
      
      // Cleanup function
      return () => {
        if (sound.current) {
          sound.current.unload();
        }
      };
    }, [currentTrackIndex]);
  
    const toggleMusic = () => {
      if (isPlaying) {
        sound.current.pause();
      } else {
        sound.current.play();
      }
      setIsPlaying(!isPlaying);
    };
    
    const nextTrack = () => {
      if (sound.current) {
        sound.current.stop();
      }
      
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIndex);
      
      // The useEffect will create a new Howl instance with the next track
      // We need to play it if music was already playing
      if (isPlaying) {
        setTimeout(() => {
          sound.current.play();
        }, 100);
      }
    };
    
    const changeVolume = (newVolume) => {
      setVolume(newVolume);
      if (sound.current) {
        sound.current.volume(newVolume);
      }
    };
  
    return (
      <div className={darkMode ? 'dark-mode' : 'light-mode'}>
        {/* Header with App Name, Logo, and Theme Toggle */}
        <Navbar className={`app-header ${darkMode ? 'navbar-dark bg-dark-blue' : 'navbar-light bg-light-green'}`} expand="lg">
          <Container>
            <Navbar.Brand href="#home" className="d-flex align-items-center">
              <FaHourglass size={24} className="me-2" />
              <span>sandClock</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                {/* Existing Theme Toggle Button */}
                <Button 
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  onClick={() => setDarkMode(!darkMode)}
                  className="theme-toggle-btn me-2"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <FaSun /> : <FaMoon />}
                </Button>
                <Button 
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  onClick={() => setShowTasklog(true)}
                  className="me-2"
                  title="Task History"
                >
                  <FaHistory />
                </Button>
                                
                {/* NEW: Add this Logout Button right after the theme toggle */}
                <Button 
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  onClick={handleLogout}
                  className="logout-btn"
                  aria-label="Logout"
                >
                  <FaSignOutAlt />
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
  
        <Container className="mt-5 mb-5 position-relative">
          {/* Cute GIF in corner */}
          {showGif && (
            <div className="cute-gif-container">
              <Image 
                src={cuteGifs[currentGifIndex]} 
                alt="Cute study companion" 
                className="cute-gif"
              />
              <Button 
                variant="light" 
                size="sm" 
                className="gif-toggle-btn"
                onClick={() => setShowGif(false)}
                title="Hide companion"
              >
                <FaEyeSlash />
              </Button>
            </div>
          )}
          
          {!showGif && (
            <Button 
              variant="light" 
              className="show-gif-btn"
              onClick={() => setShowGif(true)}
              title="Show companion"
            >
              <FaEye />
            </Button>
          )}
          
          <Row className="mb-4">
            <Col>
              <h1 className="display-4 text-center mb-4">Study Dashboard</h1>
            </Col>
          </Row>
          
          {showAlert && (
            <Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
              <Alert.Heading>Pomodoro Complete!</Alert.Heading>
              <p>
                Take a 5-minute break now. You've completed {pomodoroCount} pomodoro sessions.
              </p>
              <div className="d-flex justify-content-end">
                <Button onClick={startBreak} variant="outline-success">
                  Start Break
                </Button>
              </div>
            </Alert>
          )}
          
          <Row>
            {/* Pomodoro Timer */}
            <Col lg={4} md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className={darkMode ? "bg-dark-blue text-white" : "bg-primary text-white"}>
                  <h3 className="mb-0 text-center">{isBreak ? 'Break Time' : 'Focus Time'}</h3>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="timer-display">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
                  <div className="d-flex justify-content-center mb-3">
                    <Button
                      variant={isActive ? "danger" : "success"}
                      onClick={() => setIsActive(!isActive)}
                      className="me-2"
                    >
                      {isActive ? <FaPause /> : <FaPlay />} {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button variant="secondary" onClick={resetTimer}>
                      <FaUndo /> Reset
                    </Button>
                  </div>
                  <div className="text-center mt-auto">
                    <p>Completed: {pomodoroCount} Pomodoros</p>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => {
                        setIsBreak(!isBreak);
                        setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
                        setIsActive(false);
                      }}
                    >
                      {isBreak ? 'Switch to Focus' : 'Switch to Break'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* To-Do List */}
            <Col lg={4} md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className={darkMode ? "bg-dark-blue text-white" : "bg-info text-white"}>
                  <h3 className="mb-0 text-center">To-Do List</h3>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={addTask}>
                    <Form.Group className="mb-3 d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Add a new task"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                      />
                      <Button type="submit" className="ms-2" variant="primary">
                        Add
                      </Button>
                    </Form.Group>
                  </Form>
                  
                  {tasks.length > 0 && (
                    <>
                      <ProgressBar 
                        now={tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0} 
                        label={`${completedTasks.length}/${tasks.length}`} 
                        className="mb-3"
                      />
                      <ListGroup className="mt-3 task-list">
                        {tasks.map((task, index) => (
                          <ListGroup.Item 
                            key={index} 
                            className="d-flex justify-content-between align-items-center"
                            variant={task.completed ? "success" : ""}
                          >
                            <div 
                              className={task.completed ? "text-decoration-line-through" : ""}
                              style={{ cursor: "pointer", flex: 1 }}
                              onClick={() => toggleComplete(index)}
                            >
                              {task.text}
                            </div>
                            <div>
                              <Button
                                variant={task.completed ? "outline-success" : "outline-secondary"}
                                size="sm"
                                className="me-2"
                                onClick={() => toggleComplete(index)}
                              >
                                <FaCheck />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeTask(index)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </>
                  )}
                  
                  {tasks.length === 0 && (
                    <div className="text-center text-muted mt-4">
                      No tasks yet. Add some tasks to get started!
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
  
            {/* Lofi Music Player */}
            <Col lg={4} md={12} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className={darkMode ? "bg-dark-blue text-white" : "bg-success text-white"}>
                  <h3 className="mb-0 text-center">Lofi Music Player</h3>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3">
                    <h5>Now Playing:</h5>
                    <p className="mb-3">{tracks[currentTrackIndex].title}</p>
                  </div>
                  
                  <div className="d-flex justify-content-center mb-3">
                    <Button 
                      onClick={toggleMusic} 
                      variant={isPlaying ? "danger" : "success"}
                      className="me-2"
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button onClick={nextTrack} variant="primary">
                      Next Track
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <Form.Label className="d-flex justify-content-between">
                      <span><FaVolumeMute /></span>
                      <span>Volume</span>
                      <span><FaVolumeUp /></span>
                    </Form.Label>
                    <Form.Range 
                      min={0} 
                      max={1} 
                      step={0.1} 
                      value={volume}
                      onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <h6 className="text-center mb-2">Playlist</h6>
                    <ListGroup>
                      {tracks.map((track, index) => (
                        <ListGroup.Item 
                          key={index}
                          active={index === currentTrackIndex}
                          action
                          onClick={() => {
                            if (sound.current) {
                              sound.current.stop();
                            }
                            setCurrentTrackIndex(index);
                            if (isPlaying) {
                              setTimeout(() => {
                                sound.current.play();
                              }, 100);
                            }
                          }}
                        >
                          {track.title}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Footer */}
          <Row className="mt-4">
            <Col className="text-center">
              <p className="text-muted">
                Stay focused and productive! Remember to take breaks when needed.
              </p>
            </Col>
          </Row>
        </Container>
        <Tasklog show={showTasklog} handleClose={() => setShowTasklog(false)} />
      </div>
      
    );
  
    
}

export default Dashboard;