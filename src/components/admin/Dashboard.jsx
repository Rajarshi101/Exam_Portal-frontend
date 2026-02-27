// pages/CandidateDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import api from '../api/api';
import './CandidateDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

function CandidateDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    upcomingExams: 0,
    averageScore: 0,
    totalViolations: 0
  });
  
  const [examHistory, setExamHistory] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [violationData, setViolationData] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data from your API
      const [examsRes, statsRes, activitiesRes] = await Promise.all([
        api.get('/api/student/exams'),
        api.get('/api/student/dashboard/stats'),
        api.get('/api/student/recent-activities')
      ]);

      const exams = examsRes.data;
      const stats = statsRes.data;
      const activities = activitiesRes.data;

      // Process exams data
      processExamsData(exams);
      
      // Set stats
      setStats({
        totalExams: exams.length,
        completedExams: exams.filter(e => e.status === 'completed').length,
        upcomingExams: exams.filter(e => e.status === 'upcoming').length,
        averageScore: stats.averageScore || 0,
        totalViolations: stats.totalViolations || 0
      });

      setExamHistory(exams);
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processExamsData = (exams) => {
    // Performance over time
    const completedExams = exams.filter(e => e.status === 'completed').sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setPerformanceData({
      labels: completedExams.map(e => new Date(e.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Score %',
          data: completedExams.map(e => e.score || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    });

    // Violations by type
    const violationTypes = {};
    exams.forEach(exam => {
      exam.violations?.forEach(v => {
        violationTypes[v.type] = (violationTypes[v.type] || 0) + 1;
      });
    });

    setViolationData({
      labels: Object.keys(violationTypes),
      datasets: [
        {
          label: 'Violations',
          data: Object.values(violationTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderWidth: 1
        }
      ]
    });
  };

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Exam Performance Overview'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Violations by Type'
      }
    }
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  // Sample data for demonstration (replace with actual data)
  const examStatusData = {
    labels: ['Completed', 'Upcoming', 'In Progress'],
    datasets: [
      {
        label: 'Exams',
        data: [stats.completedExams, stats.upcomingExams, stats.totalExams - stats.completedExams - stats.upcomingExams],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderWidth: 1
      }
    ]
  };

  const subjectPerformanceData = {
    labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
    datasets: [
      {
        label: 'Average Score',
        data: [85, 78, 92, 88, 76],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      }
    ]
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="candidate-dashboard">
      <h1>Welcome Back, Candidate!</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Exams</h3>
          <p className="stat-value">{stats.totalExams}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completedExams}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p className="stat-value">{stats.averageScore}%</p>
        </div>
        <div className="stat-card">
          <h3>Violations</h3>
          <p className="stat-value">{stats.totalViolations}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Exam Status Doughnut Chart */}
        <div className="chart-card">
          <h3>Exam Status</h3>
          <div className="chart-container">
            <Doughnut 
              data={examStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>

        {/* Subject Performance Bar Chart */}
        <div className="chart-card">
          <h3>Subject Performance</h3>
          <div className="chart-container">
            <Bar 
              data={subjectPerformanceData}
              options={{
                ...barOptions,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        {/* Performance Trend Line Chart */}
        <div className="chart-card full-width">
          <h3>Performance Trend</h3>
          <div className="chart-container" style={{ height: '300px' }}>
            <Line 
              data={performanceData.labels?.length ? performanceData : {
                labels: ['Exam 1', 'Exam 2', 'Exam 3', 'Exam 4', 'Exam 5'],
                datasets: [{
                  label: 'Score %',
                  data: [65, 75, 80, 85, 90],
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                ...lineOptions,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        {/* Violations Pie Chart */}
        {violationData.labels?.length > 0 && (
          <div className="chart-card">
            <h3>Violations by Type</h3>
            <div className="chart-container">
              <Pie 
                data={violationData}
                options={{
                  ...pieOptions,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activities-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-details">
                <p className="activity-text">{activity.text}</p>
                <p className="activity-time">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="upcoming-exams">
        <h3>Upcoming Exams</h3>
        <div className="exams-list">
          {examHistory.filter(e => e.status === 'upcoming').map((exam, index) => (
            <div key={index} className="exam-item">
              <h4>{exam.title}</h4>
              <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
              <p>Duration: {exam.duration} minutes</p>
              <button 
                className="start-exam-btn"
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;