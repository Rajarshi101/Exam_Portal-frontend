import { useState, useEffect } from "react";
import CandidateSidebar from "../../components/candidate/CandidateSidebar";
// import CandidateExamCard from "../../components/candidate/CandidateExamCard";
import CandidateExamTable from "../../components/candidate/CandidateExamTable";
import { useNavigate } from "react-router-dom";
import { getStudentExams } from "../../api/candidateApi";
import "../../styles/CandidateDashboard.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleStartExam = (id) => {
    navigate(`/system-check/${id}`);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getStudentExams({
        page: 0,
        size: 1000, // large number to get all exams
      });

      const examsData = response.data?.data || [];
      setExams(examsData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalExams = exams.length;

  const upcomingCount = exams.filter(exam => {
    const status = exam.status?.toUpperCase();
    const inviteRemaining = exam.inviteRemaining;

    return (
      inviteRemaining !== "EXPIRED" &&
      (status === "INVITED" || status === "PENDING" || status === "ONGOING")
    );
  }).length;

  const completedCount = exams.filter(exam => {
    const status = exam.status?.toUpperCase();

    return status === "COMPLETED" || status === "SUBMITTED";
  }).length;

  const expiredCount = exams.filter(exam => {
    const status = exam.status?.toUpperCase();
    const inviteRemaining = exam.inviteRemaining;

    return (
      inviteRemaining === "EXPIRED" &&
      status !== "COMPLETED" &&
      status !== "SUBMITTED"
    );
  }).length;

  // useEffect(() => {
  //   fetchExams();
  // }, []);

  // const fetchExams = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await getStudentExams();
      
  //     // Ensure we have an array
  //     // const examsData = Array.isArray(response.data) ? response.data : [];
  //     // setExams(examsData);
  //     const examsData = response.data?.data || [];
  //     setExams(examsData);

  //     console.log("Student Exams Response:", examsData);
      
  //   } catch (err) {
  //     console.error("Error fetching student exams:", err);
  //     setError("Failed to load exams. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Updated: Filter exams based on your API status values
  // const upcomingExams = exams.filter(exam => {
  //   const status = exam.status?.toUpperCase();
  //   const inviteRemaining = exam.inviteRemaining;

  //   // If expired → NOT upcoming
  //   if (inviteRemaining === "EXPIRED") {
  //     return false;
  //   }
  //   // "INVITED" means the student has been invited but hasn't started
  //   // "PENDING" means started but not completed
  //   return status === "INVITED" || status === "PENDING" || status === "ONGOING";
  // });

  // const completedExams = exams.filter(exam => {
  //   const status = exam.status?.toUpperCase();
  //   const inviteRemaining = exam.inviteRemaining;
  //   return status === "COMPLETED" || status === "SUBMITTED" || inviteRemaining === "EXPIRED";
  // });

  const formatInviteRemaining = (inviteRemaining) => {
    if (!inviteRemaining || inviteRemaining === "EXPIRED") {
      return "Expired";
    }
    return inviteRemaining;
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "INVITED":
        return "Invited - Start Exam";
      case "PENDING":
        return "Pending - Resume";
      case "ONGOING":
        return "Ongoing - Continue";
      case "COMPLETED":
        return "Completed";
      case "SUBMITTED":
        return "Submitted";
      default:
        return status;
    }
  };

  // Get button text based on status
  const getButtonText = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "INVITED":
        return "Start Exam";
      case "PENDING":
        return "Resume Exam";
      case "ONGOING":
        return "Continue Exam";
      default:
        return "Start Exam";
    }
  };

  return (
    <div className="page-container">
      <Header />
    <div className="page-content candidate-dashboard">
      <CandidateSidebar setActiveTab={setActiveTab} />

      <div className="candidate-content">
        {/* Stats Summary */}
        {!loading && !error && (
          <div className="exam-stats">
            <div className="stat-card">
              <h3>Total Exams</h3>
              <p className="stat-value">{totalExams}</p>
            </div>
            <div className="stat-card">
              <h3>Upcoming</h3>
              <p className="stat-value">{upcomingCount}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-value">{completedCount}</p>
            </div>
            <div className="stat-card">
              <h3>Expired</h3>
              <p className="stat-value">{expiredCount}</p>
            </div>
          </div>
        )}
        {/* {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchExams}>Try Again</button>
          </div>
        )} */}

        {
        // loading ? (
        //   <div className="loading">Loading exams...</div>
        // ) : 
        (
          <div className="exam-list">
            <div style={{ display: activeTab === "upcoming" ? "block" : "none" }}>
              <CandidateExamTable type="upcoming" onStartExam={handleStartExam}/>
            </div>
            <div style={{ display: activeTab === "past" ? "block" : "none" }}>
              <CandidateExamTable type="past"/>
            </div>
          </div>
        )}
      </div>
    </div>
      <Footer />
    </div>
  );
}

export default CandidateDashboard;