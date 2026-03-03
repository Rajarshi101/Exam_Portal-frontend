import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import "../../styles/CandidateSidebar.css";

function CandidateSidebar({ setActiveTab }) {

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setLocalActiveTab] = useState("upcoming");

  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setLocalActiveTab(tab);
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className={`candidate-sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* HEADER */}
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Candidate Panel</h2>}
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="sidebar-content">

        {/* Sliding Highlight */}
        <div
          className="nav-highlight"
          style={{
            transform:
              activeTab === "upcoming"
                ? "translateY(0px)"
                : activeTab === "completed"
                ? "translateY(60px)"
                : "translateY(0px)",
          }}
        />

        <button
          className={`nav-item ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => handleTabClick("upcoming")}
        >
          <i className="fas fa-calendar-alt"></i>
          {!collapsed && <span>Upcoming Exams</span>}
        </button>

        <button
          className={`nav-item ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => handleTabClick("completed")}
        >
          <i className="fas fa-history"></i>
          {!collapsed && <span>Past Exams</span>}
        </button>

        <button onClick={handleLogout} className="nav-item logout-btn">
          <i className="fas fa-power-off"></i>
          {!collapsed && <span>Logout</span>}
        </button>

      </div>
    </div>
  );
}

export default CandidateSidebar;