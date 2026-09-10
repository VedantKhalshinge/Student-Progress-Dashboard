import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import MetricsCards from '../components/MetricsCards';
import Charts from '../components/Charts';
import CourseProgressList from '../components/CourseProgressList';
import LessonList from '../components/LessonList';
import { Users, User, ShieldCheck, ArrowRight, Loader2, RefreshCw, Eye } from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentDataLoading, setStudentDataLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected student's detailed dashboard state
  const [studentSummary, setStudentSummary] = useState(null);
  const [studentTimeSeries, setStudentTimeSeries] = useState([]);
  const [studentLessonStatus, setStudentLessonStatus] = useState(null);
  const [studentLessons, setStudentLessons] = useState([]);

  // Fetch mentor's assigned students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/mentor/students');
      setStudents(res.data);
      if (res.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching mentor students:', err);
      setError(err.response?.data?.error || 'Failed to fetch assigned students');
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // When selectedStudentId changes, fetch their complete analytics
  const fetchSelectedStudentData = useCallback(async (id) => {
    if (!id) return;
    setStudentDataLoading(true);
    try {
      const [sumRes, tsRes, lsRes, lessRes] = await Promise.all([
        api.get(`/mentor/students/${id}/summary`),
        api.get(`/mentor/students/${id}/time-series`),
        api.get(`/mentor/students/${id}/lesson-status`),
        api.get(`/mentor/students/${id}/lessons`),
      ]);

      setStudentSummary(sumRes.data);
      setStudentTimeSeries(tsRes.data);
      setStudentLessonStatus(lsRes.data);
      setStudentLessons(lessRes.data);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err.response?.data?.error || 'Failed to load student progress');
    } finally {
      setStudentDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchSelectedStudentData(selectedStudentId);
    }
  }, [selectedStudentId, fetchSelectedStudentData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="spin text-primary" />
        <p>Loading assigned students...</p>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="dashboard-page">
      {/* Mentor Welcome Banner */}
      <div className="welcome-banner mentor-banner">
        <div className="welcome-text">
          <div className="welcome-tag tag-mentor">
            <ShieldCheck size={14} />
            <span>Mentor Portal</span>
          </div>
          <h1 className="welcome-heading">Welcome, {user?.name || 'Mentor'}!</h1>
          <p className="welcome-sub">
            Monitor and support your assigned cohort. You have access to {students.length} assigned students.
          </p>
        </div>

        <button
          className="btn-refresh"
          onClick={() => {
            fetchStudents();
            if (selectedStudentId) fetchSelectedStudentData(selectedStudentId);
          }}
          title="Refresh cohort data"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Assigned Students Selector Cards */}
      <div className="card-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Users size={20} className="section-icon" />
            <div>
              <h3 className="section-title">Your Assigned Students ({students.length})</h3>
              <p className="section-subtitle">Select a student to view their 30-day time series, course progress, and curriculum status</p>
            </div>
          </div>
        </div>

        <div className="mentor-students-grid">
          {students.map((student) => {
            const isSelected = student.id === selectedStudentId;

            return (
              <div
                key={student.id}
                className={`student-roster-card ${isSelected ? 'roster-card-active' : ''}`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <div className="roster-card-top">
                  <div className="student-avatar-wrap">
                    <User size={18} />
                  </div>
                  <div className="student-roster-info">
                    <div className="student-name">{student.name}</div>
                    <div className="student-email">{student.email}</div>
                  </div>
                  {isSelected && (
                    <span className="badge-active-indicator">
                      <Eye size={12} /> Active
                    </span>
                  )}
                </div>

                <div className="roster-card-stats">
                  <div className="roster-stat-col">
                    <span className="roster-stat-label">Progress</span>
                    <span className="roster-stat-val">{student.overallProgress}%</span>
                  </div>
                  <div className="roster-stat-col">
                    <span className="roster-stat-label">Completed</span>
                    <span className="roster-stat-val">
                      {student.lessonsCompleted}/{student.totalLessons}
                    </span>
                  </div>
                  <div className="roster-stat-col">
                    <span className="roster-stat-label">Time Spent</span>
                    <span className="roster-stat-val">{student.totalTimeFormatted}</span>
                  </div>
                </div>

                <div className="roster-progress-track">
                  <div
                    className="roster-progress-fill"
                    style={{ width: `${student.overallProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Student Drill-Down View */}
      {selectedStudent && (
        <div className="student-drilldown-wrap">
          <div className="drilldown-header">
            <div className="drilldown-header-title">
              <span className="drilldown-badge">Student Progress Report</span>
              <h2>{selectedStudent.name} ({selectedStudent.email})</h2>
            </div>
            {studentDataLoading && (
              <div className="drilldown-loading-tag">
                <Loader2 size={14} className="spin" />
                <span>Updating report...</span>
              </div>
            )}
          </div>

          {studentDataLoading && !studentSummary ? (
            <div className="dashboard-loading">
              <Loader2 size={32} className="spin text-primary" />
              <p>Loading {selectedStudent.name}&apos;s progress...</p>
            </div>
          ) : (
            <>
              {/* Summary Numbers */}
              <MetricsCards summary={studentSummary} />

              {/* 30-Day Line Chart + Donut Status Chart */}
              <Charts
                timeSeriesData={studentTimeSeries}
                lessonStatusData={studentLessonStatus}
              />

              {/* Course Progress Percentages */}
              <CourseProgressList coursesProgress={studentSummary?.coursesProgress || []} />

              {/* Lesson List (Mentor View is read-only) */}
              <LessonList
                lessons={studentLessons}
                onActivityRecorded={() => {}}
                isReadOnly={true}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
