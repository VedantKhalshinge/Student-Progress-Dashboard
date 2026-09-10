import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, CheckCircle, PlayCircle, Clock, BookOpen, Calendar, History, Loader2 } from 'lucide-react';

export default function LessonDetailModal({ lessonId, onClose, onActivityRecorded, isReadOnly = false }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!lessonId) return;

    let isMounted = true;
    async function fetchLesson() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/lessons/${lessonId}`);
        if (isMounted) {
          setLesson(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load lesson details');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLesson();
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const handleRecordActivity = async (type, durationMinutes = 0) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/activity', {
        lessonId,
        type,
        durationMinutes,
      });

      // Refetch lesson detail
      const res = await api.get(`/lessons/${lessonId}`);
      setLesson(res.data);

      if (type === 'LESSON_COMPLETED') {
        setSuccessMsg('Great job! Lesson marked as completed.');
      } else if (type === 'LESSON_OPENED') {
        setSuccessMsg('Lesson opened! Status changed to In Progress.');
      } else {
        setSuccessMsg(`Logged ${durationMinutes} minutes of study time!`);
      }

      if (onActivityRecorded) {
        onActivityRecorded();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record activity');
    } finally {
      setActionLoading(false);
    }
  };

  if (!lessonId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-course-badge">{lesson?.courseName || 'Course'}</span>
            <h2 className="modal-title">{loading ? 'Loading Lesson...' : lesson?.title}</h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <Loader2 size={32} className="spin" />
              <span>Fetching lesson details...</span>
            </div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : lesson ? (
            <>
              {successMsg && <div className="alert-success">{successMsg}</div>}

              {/* Status Banner */}
              <div className="modal-status-banner">
                <div className="status-banner-left">
                  <span className="status-label-prefix">Current Status:</span>
                  <span className={`badge-status status-${lesson.status?.toLowerCase().replace('_', '-')}`}>
                    {lesson.status?.replace('_', ' ')}
                  </span>
                </div>
                {lesson.completedAt && (
                  <div className="status-banner-right">
                    <Calendar size={14} />
                    <span>Completed on {new Date(lesson.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Lesson Description */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <BookOpen size={16} />
                  <span>Overview & Objectives</span>
                </h4>
                <p className="lesson-description-text">{lesson.description}</p>
              </div>

              {/* Action Buttons for Students */}
              {!isReadOnly && (
                <div className="modal-section">
                  <h4 className="modal-section-title">
                    <PlayCircle size={16} />
                    <span>Actions & Progress Tracking</span>
                  </h4>
                  <div className="action-buttons-row">
                    {lesson.status !== 'COMPLETED' && (
                      <button
                        className="btn-action btn-open-lesson"
                        onClick={() => handleRecordActivity('LESSON_OPENED', 10)}
                        disabled={actionLoading}
                      >
                        <PlayCircle size={16} />
                        <span>{lesson.status === 'IN_PROGRESS' ? 'Resume Lesson' : 'Open Lesson'}</span>
                      </button>
                    )}

                    {lesson.status !== 'COMPLETED' ? (
                      <button
                        className="btn-action btn-complete-lesson"
                        onClick={() => handleRecordActivity('LESSON_COMPLETED', 30)}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={16} />
                        <span>Mark as Completed</span>
                      </button>
                    ) : (
                      <button
                        className="btn-action btn-study-more"
                        onClick={() => handleRecordActivity('STUDY_SESSION', 25)}
                        disabled={actionLoading}
                      >
                        <Clock size={16} />
                        <span>Log 25m Review Session</span>
                      </button>
                    )}

                    <button
                      className="btn-action btn-log-study"
                      onClick={() => handleRecordActivity('STUDY_SESSION', 30)}
                      disabled={actionLoading}
                    >
                      <Clock size={16} />
                      <span>Log 30m Study Time</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity Log */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <History size={16} />
                  <span>Recent Activity on this Lesson</span>
                </h4>
                {lesson.recentActivities && lesson.recentActivities.length > 0 ? (
                  <div className="activity-timeline">
                    {lesson.recentActivities.map((act) => (
                      <div key={act.id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-title">
                            {act.type.replace('_', ' ')}
                            {act.durationMinutes > 0 && ` (${act.durationMinutes} mins)`}
                          </div>
                          <div className="timeline-time">
                            {new Date(act.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="timeline-empty">No activity recorded for this lesson yet.</p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
