// AdminSidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import "../../styles/AdminSidebar.css";

function AdminSidebar({ setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setLocalActiveTab] = useState("allExams");
  const navigate = useNavigate();

  const handleTabClick = (tabKey) => {
    setLocalActiveTab(tabKey);
    setActiveTab(tabKey);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Calculate highlight position based on active tab
  const getHighlightPosition = () => {
    const tabPositions = {
      overview: 0,
      exams: 60,
      allExams: 120,
      batches: 180, // New batch tab position
      inviteAdmin: 240 // Moved down
    };
    return tabPositions[activeTab] || 0;
  };

  return (
    <div className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER */}
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Admin Panel</h2>}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="sidebar-content">
        {/* Sliding Highlight */}
        <div 
          className="nav-highlight"
          style={{
            transform: `translateY(${getHighlightPosition()}px)`,
          }}
        />
        
        <button 
          className={`nav-item ${activeTab === "overview" ? "active" : ""}`} 
          onClick={() => handleTabClick("overview")}
        >
          <i className="fas fa-chart-pie"></i>
          {!collapsed && <span>Dashboard Overview</span>}
        </button>

        <button 
          className={`nav-item ${activeTab === "exams" ? "active" : ""}`} 
          onClick={() => handleTabClick("exams")}
        >
          <i className="fas fa-file-alt"></i>
          {!collapsed && <span>Create Exam</span>}
        </button>

        <button 
          className={`nav-item ${activeTab === "allExams" ? "active" : ""}`} 
          onClick={() => handleTabClick("allExams")}
        >
          <i className="fas fa-desktop"></i>
          {!collapsed && <span>All Exams</span>}
        </button>

        {/* New Batches Tab */}
        <button 
          className={`nav-item ${activeTab === "batches" ? "active" : ""}`} 
          onClick={() => handleTabClick("batches")}
        >
          <i className="fas fa-users"></i>
          {!collapsed && <span>Batches</span>}
        </button>

        <button 
          className={`nav-item ${activeTab === "inviteAdmin" ? "active" : ""}`} 
          onClick={() => handleTabClick("inviteAdmin")}
        >
          <i className="fas fa-user-plus"></i>
          {!collapsed && <span>Invite Admin</span>}
        </button>

        <button onClick={handleLogout} className="nav-item logout-btn">
          <i className="fas fa-power-off"></i>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;