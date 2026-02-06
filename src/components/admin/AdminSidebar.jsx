import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import "../../styles/AdminSidebar.css";

function AdminSidebar({ setActiveTab }) {

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>

      <button onClick={() => setActiveTab("overview")}>
        Dashboard Overview
      </button>

      <button onClick={() => setActiveTab("exams")}>
        Create Exam
      </button>

      <button onClick={() => setActiveTab("allExams")}>
        All Exams
      </button>

      <button onClick={() => setActiveTab("inviteAdmin")}>
        Invite Admin
      </button>

      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>

    </div>
  );
}

export default AdminSidebar;