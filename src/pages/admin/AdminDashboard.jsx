import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../components/admin/AdminSidebar";
import CreateExamModal from "../../components/admin/CreateExamModal";
import InviteAdmin from "../../components/admin/InviteAdmin";
import AdminMonitoringDashboard from "../../components/admin/AdminMonitoringDashboard";
import ExamTable from "../../components/admin/ExamTable";
import CreateExamWizard from "../../components/admin/CreateExamWizard";

import "../../styles/AdminDashboard.css";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("allExams");
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const navigate = useNavigate();

  // 🔐 JWT expiry check
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  // 🚪 Logout
  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   navigate("/");
  // };

  const handleMonitorExam = (examId) => {
    setSelectedExamId(examId);
    setActiveTab("monitorExam");
  };

  const handleBackFromMonitoring = () => {
    setSelectedExamId(null);
    setActiveTab("allExams");
  };

  return (
    <div className="page-container">
      <Header />
    <div className="page-content admin-dashboard">
      <AdminSidebar setActiveTab={setActiveTab} activeTab={activeTab} />

      <div className="admin-main">
        {/* 🔝 Top Bar */}
        {/* <div className="admin-topbar">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div> */}

        {/* 📄 Content */}
        <div className="admin-content">
          {activeTab === "overview" && (
            <>
              <h1>Dashboard Overview</h1>
              <p>Welcome to the Admin Dashboard.</p>
            </>
          )}


          {activeTab === "exams" && (
          <>
            <h1>Create New Exam</h1>
            <CreateExamWizard />
          </>
        )}
 

          

          {activeTab === "allExams" && (
            <>
              <div className="exams-header">
                <h1>All Exams</h1>
                <button 
                  className="btn-create-exam" 
                  onClick={() => setShowCreateExamModal(true)}
                >
                  + Create New Exam
                </button>
              </div>
              <ExamTable 
                onMonitorExam={handleMonitorExam}
              />
            </>
          )}

          {activeTab === "monitorExam" && selectedExamId && (
            <AdminMonitoringDashboard
              examId={selectedExamId}
              onBack={handleBackFromMonitoring}
            />
          )}

          {activeTab === "inviteAdmin" && (
            <>
              <h1>Invite Admin</h1>
              <InviteAdmin />
            </>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateExamModal && (
        <CreateExamModal onClose={() => setShowCreateExamModal(false)} />
      )}
    </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;