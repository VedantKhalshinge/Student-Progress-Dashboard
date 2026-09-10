import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import MetricsCards from '../components/MetricsCards';
import Charts from '../components/Charts';
import CourseProgressList from '../components/CourseProgressList';
import LessonList from '../components/LessonList';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [lessonStatus, setLessonStatus] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const [sumRes, tsRes, lsRes, lessRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/time-series'),
        api.get('/dashboard/lesson-status'),
        api.get('/lessons'),
      ]);

      setSummary(sumRes.data);
      setTimeSeries(tsRes.data);
      setLessonStatus(lsRes.data);
      setLessons(lessRes.data);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="spin text-primary" />
        <p>Loading your learning analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <div className="welcome-tag">
            <Sparkles size={14} />
            <span>Student Dashboard</span>
          </div>
          <h1 className="welcome-heading">Welcome back, {user?.name || 'Student'}!</h1>
          <p className="welcome-sub">
            Track your progress across courses, analyze your study habits over the past 30 days, and continue where you left off.
          </p>
        </div>

        <button
          className={`btn-refresh ${refreshing ? 'is-refreshing' : ''}`}
          onClick={() => loadData(true)}
          disabled={refreshing}
          title="Refresh dashboard data"
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Metrics Row */}
      <MetricsCards summary={summary} />

      {/* 2 Charts: 30-Day Line Chart + Donut Status Chart */}
      <Charts timeSeriesData={timeSeries} lessonStatusData={lessonStatus} />

      {/* Course Progress Percentages */}
      <CourseProgressList coursesProgress={summary?.coursesProgress || []} />

      {/* Interactive Lesson List with Modal Click */}
      <LessonList
        lessons={lessons}
        onActivityRecorded={() => loadData(true)}
        isReadOnly={false}
      />
    </div>
  );
}
