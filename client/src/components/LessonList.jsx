import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, BookOpen, CheckCircle2, Clock, ChevronRight, Check } from 'lucide-react';
import LessonDetailModal from './LessonDetailModal';

export default function LessonList({ lessons = [], onActivityRecorded, isReadOnly = false }) {
  const [searchParams] = useSearchParams();
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  useEffect(() => {
    if (searchParams.get('openLesson') === '1' && lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [searchParams, lessons, selectedLessonId]);

  // Unique courses for filter
  const courseOptions = useMemo(() => {
    const set = new Set(lessons.map((l) => l.courseName));
    return Array.from(set);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || l.status === statusFilter;

      const matchesCourse =
        courseFilter === 'ALL' || l.courseName === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [lessons, searchQuery, statusFilter, courseFilter]);

  return (
    <div className="card-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <BookOpen size={20} className="section-icon" />
          <div>
            <h3 className="section-title">Curriculum Lessons</h3>
            <p className="section-subtitle">Click on any lesson to open its details, status, and track activity</p>
          </div>
        </div>
        <div className="section-counter">
          Showing <strong>{filteredLessons.length}</strong> of {lessons.length} lessons
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search lessons by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="select-wrap">
            <select
              className="filter-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="ALL">All Courses ({courseOptions.length})</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="select-wrap">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson List Table / Cards */}
      <div className="lessons-container">
        {filteredLessons.length === 0 ? (
          <div className="lessons-empty">
            <p>No lessons match your search or filters.</p>
          </div>
        ) : (
          <div className="lessons-table">
            <div className="table-header">
              <div className="col-course">Course</div>
              <div className="col-title">Lesson Title</div>
              <div className="col-status">Status</div>
              <div className="col-date">Completed At</div>
              <div className="col-action">Action</div>
            </div>

            {filteredLessons.map((lesson) => {
              const statusClass = `badge-status status-${lesson.status.toLowerCase().replace('_', '-')}`;
              const formattedDate = lesson.completedAt
                ? new Date(lesson.completedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={lesson.id}
                  className="table-row"
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  <div className="col-course">
                    <span className="course-pill">{lesson.courseName}</span>
                  </div>
                  <div className="col-title">
                    <span className="lesson-item-title">{lesson.title}</span>
                    <span className="lesson-item-desc">{lesson.description}</span>
                  </div>
                  <div className="col-status">
                    <span className={statusClass}>
                      {lesson.status === 'COMPLETED' && <Check size={12} className="status-icon" />}
                      {lesson.status === 'IN_PROGRESS' && <Clock size={12} className="status-icon" />}
                      {lesson.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-date">
                    <span className="date-text">{formattedDate}</span>
                  </div>
                  <div className="col-action">
                    <button
                      className="btn-view-lesson"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLessonId(lesson.id);
                      }}
                    >
                      <span>View</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lesson Details Modal */}
      {selectedLessonId && (
        <LessonDetailModal
          lessonId={selectedLessonId}
          onClose={() => setSelectedLessonId(null)}
          onActivityRecorded={onActivityRecorded}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
