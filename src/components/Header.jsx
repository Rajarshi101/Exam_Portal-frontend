import { Link } from "react-router-dom";
import "../styles/Layout.css";

function Header() {
  return (
    <header className="app-header">
      <div className="header-left">
        <h2 className="app-title">Exam Portal</h2>
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