// import './App.css'
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInvite from "./components/admin/InviteAdmin";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CandidateExamOverview from "./components/candidate/CandidateExamOverview";
import SystemCheck from "./pages/candidate/SystemCheck";
import CandidateExamInterface from "./pages/candidate/CandidateExamInterface";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/invite" element={<AdminInvite />} />
      <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
      <Route path="/exam/:id" element={<CandidateExamOverview />} />
      <Route path="/system-check/:id" element={<SystemCheck />} />
      <Route path="/exam-interface/:id" element={<CandidateExamInterface />} />
    </Routes>
  );
}

export default App;

