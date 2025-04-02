import React, { useState, useEffect, useRef } from 'react';
import { Button, Container, Row, Col, Form, ListGroup, Card, ProgressBar, Alert, Image, Navbar, Nav } from 'react-bootstrap';
import { FaPlay, FaPause, FaUndo, FaCheck, FaTrash, FaVolumeMute, FaVolumeUp, FaEye, FaEyeSlash, FaSun, FaMoon, FaHourglass, FaSignOutAlt } from 'react-icons/fa';
import { Howl } from 'howler';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import Signup from './auth/Signup';
import PrivateRoute from './auth/PrivateRoute';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import Dashboard from './Dashboard';

function App() {
  return (
    
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
    
  );
}

export default App;