import React from 'react';
import { Heart, Shield, Code, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-left">
          <span>
            Designed & Developed with <Heart size={14} className="heart-icon" /> by{' '}
            <a
              href="https://github.com/VedantKhalshinge"
              target="_blank"
              rel="noopener noreferrer"
              className="author-link"
            >
              Vedant Khalshinge
            </a>
          </span>
        </div>
        <div className="footer-right">
          <span className="footer-badge">
            <Shield size={12} /> © 2026 EduTrack • All Rights Reserved
          </span>
          <a
            href="https://github.com/VedantKhalshinge/Student-Progress-Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-gh-link"
          >
            <Code size={14} />
            <span>GitHub Repository</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </footer>
  );
}