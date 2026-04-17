import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { getBatchEmails, getBatchExamStats, getExamBatchDetails } from "../../api/adminAnalyticsApi";
import batchManagementApi from "../../api/batchManagementApi";
import "../../styles/BatchStatsView.css";
 
const COLORS = ["#6c63ff", "#ff7a45", "#52c41a", "#faad14"];
 
function BatchStatsView({ selectedBatch, onBack }) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedBatchName, setSelectedBatchName] = useState("");
  const [batchStats, setBatchStats] = useState(null);
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [examDetails, setExamDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [batchTotalStudents, setBatchTotalStudents] = useState(0);
  const searchTimeoutRef = useRef(null);
 
  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);
 
  // Fetch batches
  useEffect(() => {
    if (!selectedBatch) fetchBatches();
  }, [debouncedSearchTerm, currentPage]);
 
  useEffect(() => {
    if (selectedBatch) {
      setSelectedBatchId(selectedBatch.id);
      setSelectedBatchName(selectedBatch.name);
      handleBatchSelect(selectedBatch.id);
    }
  }, [selectedBatch]);
 
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await batchManagementApi.batch.getAllBatches({
        page: currentPage,
        size: 10,
        name: debouncedSearchTerm || undefined
      });
      setBatches(response.data || []);
      setTotalPages(response.totalPages || 0);
      setTotalBatches(response.total || 0);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleBatchSelect = async (batchId) => {
    try {
      setLoading(true);
      setSelectedBatchId(batchId);
      const batch = batches.find(b => b.id === batchId);
      if (batch) setSelectedBatchName(batch.name);
      setBatchStats(null);
      setExamDetails(null);
      setActiveTab("overview");
 
      // Get total students count from API
      const studentsResponse = await getBatchEmails(batchId);
      const totalStudents = studentsResponse.total || 0;
      setBatchTotalStudents(totalStudents);
     
      const emails = studentsResponse.data?.map(student => student.email) || [];
 
      if (emails.length === 0) {
        setBatchStats([]);
        return;
      }
 
      const statsResponse = await getBatchExamStats(batchId, emails);
      setBatchStats(statsResponse);
    } catch (error) {
      console.error("Error fetching batch stats:", error);
      setBatchStats([]);
    } finally {
      setLoading(false);
    }
  };
 
  const handleExamClick = async (examData) => {
    try {
      setLoading(true);
      setSelectedExamTitle(examData.examTitle);
      const details = await getExamBatchDetails(examData.examId, selectedBatchId);
      console.log("Exam Details:", details);
      setExamDetails(details);
      setActiveTab("exam-details");
    } catch (error) {
      console.error("Error fetching exam details:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleBackToOverview = () => {
    setActiveTab("overview");
    setExamDetails(null);
  };
 
  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(0);
  };
 
  // Bar chart tooltip
  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.examTitle}</p>
          <p className="tooltip-count">Students: {data.totalStudents}</p>
          {data.emails && data.emails.length > 0 && (
            <div className="tooltip-emails">
              <strong>Student Emails:</strong>
              <ul>
                {data.emails.slice(0, 3).map((email, idx) => (
                  <li key={idx}>{email}</li>
                ))}
                {data.emails.length > 3 && <li>+{data.emails.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };
 
  // Line chart tooltip for score distribution
  const ScoreTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPassed = examDetails?.cutoff && data.marks >= examDetails.cutoff;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.email}</p>
          <p className="tooltip-count">Score: {data.marks}</p>
          {data.violations > 0 && (
            <p className="tooltip-violations">⚠️ Violations: {data.violations}</p>
          )}
          {examDetails?.cutoff && (
            <p className={`tooltip-status ${isPassed ? "passed" : "failed"}`}>
              {isPassed ? "✓ Passed" : "✗ Failed"} (Cutoff: {examDetails.cutoff})
            </p>
          )}
        </div>
      );
    }
    return null;
  };
 
  // Pie chart tooltip
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = (examDetails?.invited || 0) + (examDetails?.pending || 0) +
                    (examDetails?.completed || 0) + (examDetails?.expired || 0);
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-count">Count: {data.value}</p>
          <p className="tooltip-percent">Percentage: {percent}%</p>
        </div>
      );
    }
    return null;
  };
 
  const getPieData = () => {
    if (!examDetails) return [];
    return [
      { name: "Invited", value: examDetails.invited || 0 },
      { name: "Pending", value: examDetails.pending || 0 },
      { name: "Completed", value: examDetails.completed || 0 },
      { name: "Expired", value: examDetails.expired || 0 }
    ].filter(item => item.value > 0);
  };
 
  // Prepare data for line graph - students on X-axis, scores on Y-axis
  const getScoreData = () => {
    if (!examDetails?.graphPoints) return [];
    return examDetails.graphPoints.map((point, index) => ({
      email: point.email,
      marks: point.marks,
      violations: point.violations,
      index: index + 1
    }));
  };
 
  return (
    <div className="batch-stats-view">
      {/* Header */}
      {/* <div className="batch-stats-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2>Batch-wise Statistics</h2>
        {selectedBatchName && (
          <div className="selected-batch">Batch: <strong>{selectedBatchName}</strong></div>
        )}
      </div> */}
 
      {/* <div className="batch-stats-content"> */}
        <div className="batch-list-header">
          {/* <h3>Select Batch</h3> */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
            {/* {searchTerm && (
              
            )} */}
          </div>
          <div className="filter-controls">
            <button className="clear-search" onClick={clearSearch}>Clear Filters</button>
          </div>
        </div>
        <div className="batch-stats-grid">
          <div className="slot-card">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                    <tr
                        key={batch.id}
                        className={`clickable-row ${selectedBatchId === batch.id ? "selected-row" : ""}`}
                        // className={`batch-item ${selectedBatchId === batch.id ? "active" : ""}`}
                        // onClick={() => onSelectExam(exam.id)}
                        onClick={() => handleBatchSelect(batch.id)}
                    >
                      <td className="batch-name">
                        <strong>{batch.name || "Unnamed Batch"}</strong>
                        {/* {exam.description && (
                          <small className="exam-desc">{exam.description}</small>
                        )}
                        <small>ID: {exam.id}</small> */}
                      </td>
                      <td>{batch.description || "No description"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Left Panel - Batch List */}
            {/* <div className="batch-list-panel">
              <div className="batch-items">
                {loading && batches.length === 0 ? (
                  <div className="loading-text">Loading...</div>
                ) : (
                  batches.map(batch => (
                    <button
                      key={batch.id}
                      className={`batch-item ${selectedBatchId === batch.id ? "active" : ""}`}
                      onClick={() => handleBatchSelect(batch.id)}
                    >
                      <div className="batch-name">{batch.name}</div>
                      <div className="batch-desc">{batch.description || "No description"}</div>
                    </button>
                  ))
                )}
                {batches.length === 0 && !loading && (
                  <div className="no-data-text">No batches found</div>
                )}
              </div> */}
    
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                    Previous
                  </button>
                  <span>{currentPage + 1} / {totalPages}</span>
                  <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
                    Next
                  </button>
                </div>
              )}
              <div className="total-batches">Total: {totalBatches} batches</div>
            {/* </div> */}
          </div>
          <div className="slot-card">
            {/* Right Panel - Statistics */}
            {/* <div className="stats-panel"> */}
              {!selectedBatchId ? (
                <div className="empty-state">Select a batch to view statistics</div>
              ) : loading ? (
                <div className="empty-state">Loading statistics...</div>
              ) : activeTab === "overview" ? (
                <>
                  {batchStats && batchStats.length > 0 ? (
                    <>
                      {/* Summary Stats */}
                      <div className="summary-card">
                          <div className="stat-box">
                            <h4>Total Exams</h4>
                            <p>{batchStats.length}</p>
                          </div>
                          <div className="stat-box">
                            <h4>Total Students</h4>
                            <p>{batchTotalStudents}</p>
                          </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="chart-card">
                        <h3>Exam-wise Student Distribution</h3>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={batchStats} margin={{ top: 20, right: 30, left: 40, bottom: 80 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="examTitle"
                                angle={-35}
                                textAnchor="end"
                                height={70}
                                interval={0}
                                tick={{ fontSize: 11 }}
                              />
                              <YAxis label={{ value: "Students", angle: -90, position: "insideLeft", offset: -5 }}/>
                              <Tooltip content={<BarTooltip />} />
                              <Bar
                                dataKey="totalStudents"
                                fill="#6c63ff"
                                onClick={(data) => handleExamClick(data)}
                                cursor="pointer"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="chart-hint">Click any bar for exam details</p>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">No exam data available for this batch</div>
                  )}
                </>
              ) : (
                examDetails && (
                  <>
                    <div className="stat-header">
                      <h3 className="selected-exam-title">Exam Title: {selectedExamTitle}</h3>
                      <button className="back-to-overview" onClick={handleBackToOverview}>
                      ← Back to Overview
                    </button>
                    </div>
                    {/* Pie Chart */}
                    <div className="chart-card batch">
                      <h3>Candidate Status</h3>
                      <div className="chart-card-slots">
                      <div className="chart-container pie-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getPieData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={false}
                            >
                              {getPieData().map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                            <Legend
                              verticalAlign="bottom"
                              height={40}
                              formatter={(value) => value}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Stats Cards */}
                      <div className="summary-card batch">
                        {/* <div className="stat-card submissions"> */}
                          {/* <div className="stat-icon">📊</div> */}
                          <div className="stat-box submission">
                            <h4>Submissions</h4>
                            <p>{examDetails.submissions || 0}</p>
                          </div>
                        {/* </div> */}
                        {/* <div className="stat-card passed"> */}
                          {/* <div className="stat-icon">✅</div> */}
                          <div className="stat-box passed">
                            <h4>Passed</h4>
                            <p>{examDetails.qualified || 0}</p>
                          </div>
                        {/* </div> */}
                        {/* <div className="stat-card failed"> */}
                          {/* <div className="stat-icon">❌</div> */}
                          <div className="stat-box failed">
                            <h4>Failed</h4>
                            <p>{examDetails.failed || 0}</p>
                          </div>
                        {/* </div> */}
                      </div>
                      </div>
                    </div>
    
                    {/* Score Distribution - Line Chart with Students on X-axis */}
                    {getScoreData().length > 0 && (
                      <div className="chart-card">
                        <h3>Score Distribution</h3>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={450}>
                            <LineChart
                              data={getScoreData()}
                              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="email"
                                angle={-45}
                                textAnchor="end"
                                height={90}
                                interval={0}
                                tick={{ fontSize: 11 }}
                              />
                              <YAxis
                                label={{ value: "Score", angle: -90, position: "insideLeft", offset: -5 }}
                                domain={[0, 'auto']}
                              />
                              <Tooltip content={<ScoreTooltip />} />
                              <Legend verticalAlign="top" height={36} />
                              <Line
                                type="monotone"
                                dataKey="marks"
                                stroke="#6c63ff"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                                name="Student Score"
                                dot={(props) => {
                                  const { cx, cy, payload } = props;
                                  const isPassed = examDetails?.cutoff && payload.marks >= examDetails.cutoff;
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={6}
                                      fill={isPassed ? "#52c41a" : "#ff4d4f"}
                                      stroke="white"
                                      strokeWidth={2}
                                      cursor="pointer"
                                    />
                                  );
                                }}
                              />
                              {examDetails?.cutoff && examDetails.cutoff > 0 && (
                                <ReferenceLine
                                  y={examDetails.cutoff}
                                  stroke="#ff4d4f"
                                  strokeDasharray="5 5"
                                  strokeWidth={2}
                                  label={{
                                    value: `Cutoff: ${examDetails.cutoff}`,
                                    fill: "#ff4d4f",
                                    position: "right",
                                    fontSize: 12,
                                    fontWeight: "bold"
                                  }}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="chart-hint">
                          💡 Green dots = Passed, Red dots = Failed | Hover on dots for details
                        </p>
                      </div>
                    )}
                  </>
                )
              )}
            {/* </div> */}
          </div>
        </div>
      {/* </div> */}
    </div>
  );
}
 
export default BatchStatsView;