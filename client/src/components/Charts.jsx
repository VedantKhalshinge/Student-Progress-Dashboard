import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Calendar } from 'lucide-react';

const STATUS_COLORS = {
  Completed: '#10b981',   // Emerald
  'In Progress': '#f59e0b', // Amber
  'Not Started': '#94a3b8', // Slate
};

function formatXAxisDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${monthNames[m]} ${d}`;
  }
  return dateStr;
}

function CustomLineTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const minutes = payload[0].value;
    const hours = (minutes / 60).toFixed(1);
    return (
      <div className="custom-tooltip">
        <div className="tooltip-date">{formatXAxisDate(label)}</div>
        <div className="tooltip-val">
          <span className="tooltip-dot line-dot"></span>
          <span>{minutes} minutes ({hours} hrs)</span>
        </div>
      </div>
    );
  }
  return null;
}

function CustomDonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="custom-tooltip">
        <div className="tooltip-label" style={{ color: data.payload.color }}>
          {data.name}
        </div>
        <div className="tooltip-val">
          <strong>{data.value}</strong> lessons
        </div>
      </div>
    );
  }
  return null;
}

export default function Charts({ timeSeriesData = [], lessonStatusData = null }) {
  // Donut chart data
  const donutData = lessonStatusData
    ? [
        { name: 'Completed', value: lessonStatusData.completed || 0, color: STATUS_COLORS.Completed },
        { name: 'In Progress', value: lessonStatusData.inProgress || 0, color: STATUS_COLORS['In Progress'] },
        { name: 'Not Started', value: lessonStatusData.notStarted || 0, color: STATUS_COLORS['Not Started'] },
      ]
    : [];

  const totalLessons = donutData.reduce((acc, curr) => acc + curr.value, 0);

  // Calculate 30-day stats
  const total30DayMinutes = timeSeriesData.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
  const avgDailyMinutes = timeSeriesData.length > 0 ? Math.round(total30DayMinutes / timeSeriesData.length) : 0;

  return (
    <div className="charts-grid">
      {/* 1. Line Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <div className="chart-icon-wrap icon-blue">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="chart-title">Daily Study Time</h3>
              <p className="chart-subtitle">Time spent per day over the last 30 days (from API)</p>
            </div>
          </div>
          <div className="chart-stat-badge">
            <Calendar size={14} />
            <span>Avg: {avgDailyMinutes} min/day</span>
          </div>
        </div>

        <div className="chart-body">
          {timeSeriesData.length === 0 ? (
            <div className="chart-empty">No time-series data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={timeSeriesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisDate}
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={4}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="m"
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#4f46e5' }}
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Donut Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <div className="chart-icon-wrap icon-purple">
              <PieIcon size={20} />
            </div>
            <div>
              <h3 className="chart-title">Lesson Status Breakdown</h3>
              <p className="chart-subtitle">Completed, In Progress & Not Started (from API)</p>
            </div>
          </div>
          <div className="chart-stat-badge">
            <span>Total: {totalLessons} Lessons</span>
          </div>
        </div>

        <div className="chart-body donut-body">
          {totalLessons === 0 ? (
            <div className="chart-empty">No lesson data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="46%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => {
                    const item = donutData.find((d) => d.name === value);
                    const pct = totalLessons > 0 ? Math.round((item.value / totalLessons) * 100) : 0;
                    return (
                      <span className="legend-item-text">
                        {value}: <strong>{item?.value}</strong> ({pct}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
