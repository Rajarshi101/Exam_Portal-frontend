import { useNavigate } from "react-router-dom";
import "../../styles/CandidateExamCard.css";

function CandidateExamCard({ exam }) {
  const navigate = useNavigate();

  return (
    <div
      className="exam-card"
      onClick={() => navigate(`/exam/${exam.id}`)}
    >
      <h3>{exam.title}</h3>

      {exam.status === "Pending" && (
        <>
          <p>Start Time: {exam.startTime}</p>
          <p>Link Expires In: {exam.expiresIn}</p>
          <span className="badge pending">Pending</span>
        </>
      )}

      {exam.status === "Completed" && (
        <>
          <p>Completed At: {exam.completedAt}</p>
          <span className="badge completed">Completed</span>
        </>
      )}
    </div>
  );
}

export default CandidateExamCard;