import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import "../styles/Layout.css";

function Header() {
  const [user, setUser] = useState({
    name: "",
    role: ""
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      if (token) {
        const decoded = jwtDecode(token);

        setUser({
          name: decoded.username || "User",
          role: decoded.role || "Unknown"
        });
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Token decode failed", err);
      setIsLoggedIn(false);
    }
  }, []);
  return (
    <header className="app-header">
      <div className="header-left">
        <h2 className="app-title">Exam Portal</h2>
      </div>
      <div className="header-right" style={{ display: isLoggedIn ? "flex": "none" }}>
        <div className="user-info">
          <p className="user-name">
            Hi, {user.name}
          </p>

          <p className="user-role">
            Role: {user.role}
          </p>
        </div>

        <div className="profile-icon">
          <i className="fas fa-circle-user"></i>
        </div>
      </div>

      {/* <div className="header-right">
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/candidate-dashboard" className="nav-link">Candidate</Link>
        <Link to="/admin-dashboard" className="nav-link">Admin</Link>
      </div> */}
    </header>
  );
}

export default Header;