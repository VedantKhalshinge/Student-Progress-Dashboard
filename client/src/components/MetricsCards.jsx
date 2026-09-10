import React from 'react';
import { CheckCircle2, Clock, Award, BookOpen } from 'lucide-react';

export default function MetricsCards({ summary }) {
  if (!summary) return null;

  const {
    lessonsCompleted = 0,
    totalLessons = 0,
    totalTimeFormatted = '0h 0m',
    overallProgress = 0,
    coursesEnrolled = 0,
    coursesProgress = [],
  } = summary;

  const totalCourses = coursesEnrolled || coursesProgress.length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon-wrap icon-blue">
          <CheckCircle2 size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-label">Lessons Completed</div>
          <div className="metric-value">
            {lessonsCompleted} <span className="metric-sub">/ {totalLessons}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-tag tag-blue">
              {totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0}% of all lessons
            </span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-wrap icon-purple">
          <Clock size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-label">Time Spent</div>
          <div className="metric-value">{totalTimeFormatted}</div>
          <div className="metric-footer">
            <span className="metric-tag tag-purple">Across all sessions</span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-wrap icon-emerald">
          <Award size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-label">Overall Progress</div>
          <div className="metric-value">{overallProgress}%</div>
          <div className="metric-footer">
            <div className="progress-bar-sm">
              <div
                className="progress-fill-sm"
                style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-wrap icon-amber">
          <BookOpen size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-label">Enrolled Courses</div>
          <div className="metric-value">{totalCourses}</div>
          <div className="metric-footer">
            <span className="metric-tag tag-amber">Active curriculum</span>
          </div>
        </div>
      </div>
    </div>
  );
}
