import "../styles/Layout.css";

function Footer() {
  return (
    <footer className="app-footer">
      <p>© {new Date().getFullYear()} Exam Portal System | All rights reserved.</p>
    </footer>
  );
}

export default Footer;