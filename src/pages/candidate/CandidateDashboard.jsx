import { useState } from "react";
import CandidateSidebar from "../../components/candidate/CandidateSidebar";
import CandidateExamCard from "../../components/candidate/CandidateExamCard";
import "../../styles/CandidateDashboard.css";

const dummyUpcoming = [
  {
    id: 1,
    title: "Java Fundamentals Test",
    startTime: "2026-02-10 10:00 AM",
    expiresIn: "01:30:00",
    status: "Pending"
  }
];

const dummyCompleted = [
  {
    id: 2,
    title: "DBMS Final Exam",
    completedAt: "2026-01-15 12:45 PM",
    status: "Completed"
  }
];

function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <div className="candidate-dashboard">
      <CandidateSidebar setActiveTab={setActiveTab} />

      <div className="candidate-content">
        <h1>
          {activeTab === "upcoming"
            ? "Upcoming Exams"
            : "Completed Exams"}
        </h1>

        <div className="exam-list">
          {activeTab === "upcoming" &&
            dummyUpcoming.map((exam) => (
              <CandidateExamCard key={exam.id} exam={exam} />
            ))}

          {activeTab === "completed" &&
            dummyCompleted.map((exam) => (
              <CandidateExamCard key={exam.id} exam={exam} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;