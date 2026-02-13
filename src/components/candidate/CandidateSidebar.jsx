import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import "../../styles/CandidateSidebar.css";

function CandidateSidebar({ setActiveTab }) {

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="candidate-sidebar">
      <h2>Candidate Panel</h2>

      <button onClick={() => setActiveTab("upcoming")}>
        Upcoming Exams
      </button>

      <button onClick={() => setActiveTab("completed")}>
        Past Exams
      </button>

      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>

    </div>
  );
}

export default CandidateSidebar;