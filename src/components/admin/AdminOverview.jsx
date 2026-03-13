// import { getExamStats, getCandidateStats } from "../../api/adminStatsApi";
// import ExamAnalyticsModal from "./ExamAnalyticsModal";
// // import ExamTable from "./ExamTable";
// import OverviewExamTable from "./OverviewExamTable";
// import { useEffect, useState } from "react";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Legend,
//   ResponsiveContainer
// } from "recharts";

// import "../../styles/AdminOverview.css";

// const COLORS = ["#6c63ff", "#ff7a45"];

// function AdminOverview() {

//   const [examStats, setExamStats] = useState(null);
//   const [candidateStats, setCandidateStats] = useState(null);
//   const [showAnalytics,setShowAnalytics] = useState(false);
//   const [activeTab, setActiveTab] = useState("allExams");
//   const [selectedExamId, setSelectedExamId] = useState(null);

//   useEffect(() => {
//     fetchExamStats();
//     fetchCandidateStats();
//   }, []);

//   const openAnalytics = (examId) => {
//     setSelectedExamId(examId);
//     setShowAnalytics(true);
//   };

//   const handleMonitorExam = (examId) => {
//     setSelectedExamId(examId);
//     setActiveTab("monitorExam");
//   };

//   const fetchExamStats = async () => {
//     try {
//       const res = await getExamStats();
//       setExamStats(res.data);
//     } catch (err) {
//       console.error("Failed to fetch exam stats", err);
//     }
//   };

//   const fetchCandidateStats = async () => {
//     try {
//       const res = await getCandidateStats();
//       setCandidateStats(res.data);
//     } catch (err) {
//       console.error("Failed to fetch candidate stats", err);
//     }
//   };

//   if (!examStats || !candidateStats) {
//     return <p>Loading statistics...</p>;
//   }

//   const pieData = [
//     { name: "Published", value: examStats.published },
//     { name: "Draft", value: examStats.draft }
//   ];

//   const barData = [
//     { name: "Invited", value: candidateStats.invited },
//     { name: "Pending", value: candidateStats.pending },
//     { name: "Completed", value: candidateStats.completed },
//     { name: "Expired", value: candidateStats.expired }
//   ];

//   return (
//     <div className="admin-overview-container">

//       <div className="overview-left">

//         {/* Pie Chart */}
//         <div className="chart-card">
//           <h3>Exam Status Distribution</h3>

//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={pieData}
//                 dataKey="value"
//                 outerRadius={120}
//                 label
//               >
//                 {pieData.map((entry, index) => (
//                   <Cell key={index} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>

//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>

//           <p>Total Exams: {examStats.total}</p>
//         </div>

//         {/* Bar Chart */}
//         <div className="chart-card">
//           <h3>Candidate Status Overview</h3>

//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={barData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name"/>
//               <YAxis/>
//               <Tooltip/>
//               <Legend/>

//               <Bar dataKey="value" fill="#6c63ff" />
//             </BarChart>
//           </ResponsiveContainer>

//           <p>Total Candidates: {candidateStats.total}</p>
//         </div>

//       </div>

//       {/* Right side placeholder (for next modal feature) */}
//       <div className="overview-right">

//         <div className="analytics-card">
//           <h3>Exam Analytics</h3>

//           <p>
//             Search an exam and view detailed statistics of candidate
//             performance.
//           </p>

//           <button className="view-stats-btn" onClick={()=>setShowAnalytics(true)}>
//             Open Analytics
//           </button>

//           <OverviewExamTable
//             onOpenAnalytics={openAnalytics}
//             // onMonitorExam={onMonitorExam}
//           />

//           {showAnalytics && (
//             <ExamAnalyticsModal
//               examId={selectedExamId}
//               onClose={()=>setShowAnalytics(false)}
//             />
//           )}

//           {/* {activeTab === "monitorExam" && selectedExamId && (
//             <AdminMonitoringDashboard
//               examId={selectedExamId}
//               onBack={handleBackFromMonitoring}
//             />
//           )} */}
//         </div>

//       </div>

//     </div>
//   );
// }

// export default AdminOverview;

import { getExamStats, getCandidateStats } from "../../api/adminStatsApi";
import ExamAnalyticsModal from "./ExamAnalyticsModal";
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

  const [showAnalytics, setShowAnalytics] = useState(false);
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

  const openAnalytics = (examId) => {
    setSelectedExamId(examId);
    setShowAnalytics(true);
  };

  if (!examStats || !candidateStats) {
    return <p className="loading-text">Loading statistics...</p>;
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

      {/* Page Title */}
      <h1 className="dashboard-title">Dashboard Overview</h1>

      {/* Top Charts Section */}
      <div className="overview-charts">

        {/* Exam Status Pie */}
        <div className="chart-card">

          <h3>Exam Status Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>

              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={120}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>

          <p className="chart-footer">
            Total Exams: {examStats.total}
          </p>

        </div>


        {/* Candidate Status Bar */}
        <div className="chart-card">

          <h3>Candidate Status Overview</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="value" fill="#6c63ff" />

            </BarChart>
          </ResponsiveContainer>

          <p className="chart-footer">
            Total Candidates: {candidateStats.total}
          </p>

        </div>

      </div>


      {/* Bottom Section */}
      <div className="exam-stats-section">

        <h2>Exam Wise Statistics</h2>

        <div className="exam-table-card">

          <OverviewExamTable
            onOpenAnalytics={openAnalytics}
          />

        </div>

      </div>


      {/* Analytics Modal */}
      {showAnalytics && (
        <ExamAnalyticsModal
          examId={selectedExamId}
          onClose={() => setShowAnalytics(false)}
        />
      )}

    </div>
  );
}

export default AdminOverview;