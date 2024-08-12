// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import User from './user';
import Admin from './admin';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/user">User</Link></li>
            <li><Link to="/vamsee">vamsee</Link></li>
            <li><Link to="/test1">test1</Link></li>
            <li><Link to="/test2">test2</Link></li>
            <li><Link to="/test3">test3</Link></li>
            <li><Link to="/test4">test4</Link></li>
            <li><Link to="/test5">test5</Link></li>
            <li><Link to="/test6">test6</Link></li>
            <li><Link to="/lahari">lahari</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/user" element={<User />} />
          <Route path="/vamsee" element={<Admin adminId="vamsee" />} />
          <Route path="/test1" element={<Admin adminId="test1" />} />
          <Route path="/test2" element={<Admin adminId="test2" />} />
          <Route path="/test3" element={<Admin adminId="test3" />} />
          <Route path="/test4" element={<Admin adminId="test4" />} />
          <Route path="/test5" element={<Admin adminId="test5" />} />
          <Route path="/test6" element={<Admin adminId="test6" />} />
          <Route path="/lahari" element={<Admin adminId="lahari" />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
