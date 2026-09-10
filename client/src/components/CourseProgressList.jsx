import React from 'react';
import { BookMarked, CheckCircle, Clock3 } from 'lucide-react';

export default function CourseProgressList({ coursesProgress = [] }) {
  if (!coursesProgress || coursesProgress.length === 0) {
    return null;
  }

  return (
    <div className="card-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <BookMarked size={20} className="section-icon" />
          <div>
            <h3 className="section-title">Course Progress</h3>
            <p className="section-subtitle">Real-time completion percentage for each enrolled course</p>
          </div>
        </div>
      </div>

      <div className="course-cards-grid">
        {coursesProgress.map((course) => {
          const { id, title, lessonsCompleted, totalLessons, progressPercentage } = course;
          const isComplete = progressPercentage === 100;

          return (
            <div key={id} className="course-card">
              <div className="course-card-top">
                <span className="course-title">{title}</span>
                <span className={`course-badge ${isComplete ? 'badge-complete' : 'badge-progress'}`}>
                  {progressPercentage}%
                </span>
              </div>

              <div className="course-meta">
                <span className="course-meta-item">
                  <CheckCircle size={14} className="text-emerald" />
                  <span>{lessonsCompleted} of {totalLessons} lessons done</span>
                </span>
                <span className="course-meta-item">
                  <Clock3 size={14} />
                  <span>{totalLessons - lessonsCompleted} remaining</span>
                </span>
              </div>

              <div className="course-progress-track">
                <div
                  className={`course-progress-bar ${isComplete ? 'bar-complete' : ''}`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
