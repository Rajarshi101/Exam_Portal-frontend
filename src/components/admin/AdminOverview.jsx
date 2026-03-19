import { getExamStats, getCandidateStats } from "../../api/adminStatsApi";
import OverviewExamTable from "./OverviewExamTable";

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

  return (
    <div className="admin-overview-container">

      {/* <h1 className="dashboard-title">Dashboard Overview</h1> */}

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

        {/* <div className="exam-stats-grid"> */}

          {/* SLOT 1 */}
          {/* <div className="slot-card"> */}
            <OverviewExamTable
              onSelectExam={(examId)=>setSelectedExamId(examId)}
              selectedExamId={selectedExamId}
            />
          {/* </div> */}

          {/* SLOT 2 */}
          {/* <div className="slot-card">
            <ExamAnalyticsPreview examId={selectedExamId}/>
          </div> */}

        {/* </div> */}

      </div>

    </div>
  );
}

export default AdminOverview;