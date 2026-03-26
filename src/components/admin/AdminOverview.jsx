import { getExamStats, getCandidateStats } from "../../api/adminStatsApi";
import OverviewExamTable from "./OverviewExamTable";
import BatchStatsView from "./BatchStatsView";
 
import { useEffect, useState } from "react";
 
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from "recharts";
 
import "../../styles/AdminOverview.css";
 
const COLORS = ["#6c63ff", "#ff7a45"];
 
function AdminOverview() {
  const [examStats, setExamStats] = useState(null);
  const [candidateStats, setCandidateStats] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [showBatchStats, setShowBatchStats] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
 
  useEffect(() => {
    fetchExamStats();
    fetchCandidateStats();
  }, []);
 
  const fetchExamStats = async () => {
    try {
      const res = await getExamStats();
      setExamStats(res.data);
    } catch (err) {
      console.error("Failed to fetch exam stats", err);
    }
  };
 
  const fetchCandidateStats = async () => {
    try {
      const res = await getCandidateStats();
      setCandidateStats(res.data);
    } catch (err) {
      console.error("Failed to fetch candidate stats", err);
    }
  };
 
  const handleBatchStatsClick = () => {
    setShowBatchStats(true);
    setSelectedBatch(null);
  };
 
  const handleBackToDashboard = () => {
    setShowBatchStats(false);
    setSelectedBatch(null);
  };
 
  if (!examStats || !candidateStats) {
    return <p>Loading statistics...</p>;
  }
 
  const pieData = [
    { name: "Published", value: examStats.published },
    { name: "Draft", value: examStats.draft }
  ];
 
  const barData = [
    { name: "Invited", value: candidateStats.invited },
    { name: "Pending", value: candidateStats.pending },
    { name: "Completed", value: candidateStats.completed },
    { name: "Expired", value: candidateStats.expired }
  ];
 
  // If showing batch stats, render the BatchStatsView component
  if (showBatchStats) {
    return (
      <BatchStatsView
        selectedBatch={selectedBatch}
        onBack={handleBackToDashboard}
      />
    );
  }
 
  return (
    <div className="admin-overview-container">
      {/* Add Batch Stats Button */}
      <div className="dashboard-header">
        <button
          className="batch-stats-button"
          onClick={handleBatchStatsClick}
        >
          📊 Batch-wise Statistics
        </button>
      </div>
 
      {/* Top charts */}
      <div className="overview-charts">
        <div className="chart-card">
          <h3>Exam Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={120} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p>Total Exams: {examStats.total}</p>
        </div>
 
        <div className="chart-card">
          <h3>Candidate Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="value" fill="#6c63ff"/>
            </BarChart>
          </ResponsiveContainer>
          <p>Total Invites: {candidateStats.total}</p>
        </div>
      </div>
 
      {/* Exam wise stats */}
      <div className="exam-wise-stats">
        <h2>Exam Wise Statistics</h2>
        <OverviewExamTable
          onSelectExam={(examId)=>setSelectedExamId(examId)}
          selectedExamId={selectedExamId}
        />
      </div>
    </div>
  );
}
 
export default AdminOverview;