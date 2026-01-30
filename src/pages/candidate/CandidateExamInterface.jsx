import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CandidateExamInterface.css";

const QUESTIONS = [
  {
    id: 1,
    question: "Which language is used for backend development?",
    options: ["HTML", "CSS", "Java", "Bootstrap"]
  },
  {
    id: 2,
    question: "Which database is relational?",
    options: ["MongoDB", "PostgreSQL", "Redis", "Neo4j"]
  },
  {
    id: 3,
    question: "React is a ____?",
    options: ["Database", "Framework", "Library", "Language"]
  }
];

function CandidateExamInterface() {
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 2;

  /* ---------- Fullscreen ---------- */
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  useEffect(() => {
    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerWarning("You exited fullscreen mode!");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  /* ---------- Tab Switch Detection ---------- */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning("Tab switching is not allowed!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  /* ---- Warning System ---- */
  const triggerWarning = (message) => {
    alert(message);

    setWarnings((prev) => {
      const updated = prev + 1;

      if (updated > MAX_WARNINGS) {
        autoSubmitExam();
      }

      return updated;
    });
  };

  const autoSubmitExam = () => {
    alert("You have violated exam rules. Exam auto-submitted.");

    // TODO: Call backend API later to submit answers
    navigate("/candidate-dashboard");
  };


  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes (seconds)
  const [submitted, setSubmitted] = useState(false);



  // TIMER LOGIC
  useEffect(() => {
    if (submitted) return;

    if (timeLeft === 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleOptionSelect = (option) => {
    setAnswers({
      ...answers,
      [currentIndex]: option
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    alert("Exam auto-submitted!");
    console.log("Submitted Answers:", answers);
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (submitted) {
    return (
      <div className="exam-submitted">
        <h1>Exam Submitted Successfully</h1>
        <p>Your responses have been recorded.</p>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentIndex];

  return (
    <div className="exam-interface">
      {/* Sidebar */}
      <aside className="question-sidebar">
        {QUESTIONS.map((q, index) => (
          <div
            key={q.id}
            className={`question-number ${
              index === currentIndex ? "active" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            Q{index + 1}
          </div>
        ))}
      </aside>

      {/* Main Question Area */}
      <main className="question-area">
        <h2>
          Q{currentIndex + 1}. {currentQuestion.question}
        </h2>

        <div className="options">
          {currentQuestion.options.map((option, idx) => (
            <label key={idx} className="option">
              <input
                type="radio"
                name={`question-${currentIndex}`}
                checked={answers[currentIndex] === option}
                onChange={() => handleOptionSelect(option)}
              />
              {option}
            </label>
          ))}
        </div>

        <div className="navigation-buttons">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            Previous
          </button>

          <button
            disabled={currentIndex === QUESTIONS.length - 1}
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            Next
          </button>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit Exam
          </button>
        </div>
      </main>

      {/* Timer + Warning */}
      <div className="timer">
        <p>Time Left</p>
        <h3>{formatTime()}</h3>
        <br />
        <br />
        <span className="warning-count">
          Warnings: {warnings} / {MAX_WARNINGS}
        </span>
      </div>
    </div>
  );
}

export default CandidateExamInterface;