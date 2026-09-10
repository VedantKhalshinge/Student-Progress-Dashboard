import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isMentor } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="brand-title">EduTrack</div>
            <div className="brand-subtitle">Student Progress Dashboard</div>
          </div>
        </div>

        {user && (
          <div className="navbar-user-section">
            <div className="user-profile">
              <div className="user-avatar">
                {isMentor ? <ShieldCheck size={18} /> : <User size={18} />}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <span className={`role-badge ${isMentor ? 'role-mentor' : 'role-student'}`}>
                {user.role}
              </span>
            </div>

            <button onClick={logout} className="btn-logout" title="Log out">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
