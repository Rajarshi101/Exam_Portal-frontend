 
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { submitViolation, submitExamAnswers } from "../../api/candidateApi";
import "../../styles/CandidateExamInterface.css";
 
// Import your API instance
import api from "../../api/api"; // Make sure this path is correct
 
function CandidateExamInterface() {
  const { id, submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
 
  // Get questions from navigation state
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(location.state?.duration * 60 || 60 * 60);
  const [warnings, setWarnings] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(!location.state?.questions);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
 
  const fullscreenGraceRef = useRef(true);
  const checkpointTimerRef = useRef(null);
  const violationLockRef = useRef(false);
  const cameraIntervalRef = useRef(null);
  const violationCooldownRef = useRef(false); // To prevent rapid violations
 
  const MAX_WARNINGS = 2;
 
  // Format answers for backend (mapping question IDs to selected options)
  const formatAnswersForBackend = useCallback(() => {
    const formatted = {};
    questions.forEach(question => {
      const questionId = question.id; // Original question ID from database
      const answer = answers[questionId];
      if (answer) {
        formatted[questionId.toString()] = answer;
      }
    });
    return formatted;
  }, [answers, questions]);
 
  /* ---------- Fullscreen Enforcement ---------- */
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
     
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        await elem.msRequestFullscreen();
      }
     
      setIsFullscreen(true);
      console.log("Entered fullscreen");
    } catch (err) {
      console.error("Fullscreen error:", err);
      triggerViolation("Failed to enter fullscreen mode");
    }
  };
 
  /* ---------- Camera Visibility Check ---------- */
  const checkCameraVisibility = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
     
      if (videoDevices.length === 0) {
        // No camera available
        return;
      }
     
      // Check if we have permission and camera is accessible
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = stream.getVideoTracks()[0];
     
      if (!track.enabled || track.readyState === 'ended') {
        triggerViolation("Camera turned off or disconnected");
      }
     
      // Stop the stream to free up camera
      track.stop();
    } catch (error) {
      // If we can't access camera due to permission or other issues
      if (error.name === 'NotAllowedError') {
        triggerViolation("Camera permission revoked");
      } else if (error.name === 'NotFoundError') {
        // Camera not found - might be disconnected
        triggerViolation("Camera not found or disconnected");
      }
    }
  };
 
  /* ---------- Fullscreen Change Detection ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      fullscreenGraceRef.current = false;
      console.log("Fullscreen grace period ended");
    }, 800);
 
    return () => clearTimeout(timer);
  }, []);
 
  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = document.fullscreenElement;
      const isNowFullscreen = !!fs;
      setIsFullscreen(isNowFullscreen);
 
      // Ignore fullscreen exit during initial stabilization
      if (fullscreenGraceRef.current) {
        console.log("Fullscreen change during grace period, ignoring");
        return;
      }
 
      // If user exits fullscreen
      if (!isNowFullscreen && !submitted && !fullscreenRequired) {
        console.log("Fullscreen exit detected, triggering violation");
        setFullscreenRequired(true);
        triggerViolation("Exited fullscreen mode");
      } else if (isNowFullscreen && fullscreenRequired) {
        // User returned to fullscreen
        setFullscreenRequired(false);
        console.log("User returned to fullscreen");
      }
    };
 
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [submitted, fullscreenRequired]);
 
  /* ---------- Tab Visibility Detection ---------- */
  useEffect(() => {
    const onVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
 
      if (!isVisible && !submitted && !fullscreenRequired) {
        console.log("Tab switch detected");
        triggerViolation("Tab switch detected");
      }
    };
 
    const onBlur = () => {
      if (!submitted && !fullscreenRequired) {
        console.log("Window blur detected");
        triggerViolation("Window focus lost");
      }
    };
 
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
 
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [submitted, fullscreenRequired]);
 
  /* ---------- Camera Monitoring ---------- */
  useEffect(() => {
    // Check camera periodically (every 5 seconds)
    cameraIntervalRef.current = setInterval(() => {
      if (!submitted && !fullscreenRequired) {
        checkCameraVisibility();
      }
    }, 5000);
 
    return () => {
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
      }
    };
  }, [submitted, fullscreenRequired]);
 
  /* ---------- Prevent Context Menu and Keyboard Shortcuts ---------- */
  useEffect(() => {
    const preventDefault = (e) => {
      // Prevent right-click context menu
      if (e.type === "contextmenu") {
        e.preventDefault();
        triggerViolation("Right-click attempted");
      }
     
      // Prevent common exit shortcuts (F11, Esc)
      if (e.type === "keydown") {
        if (e.key === "F11" || (e.key === "Escape" && isFullscreen)) {
          e.preventDefault();
          triggerViolation(`Attempted to use ${e.key} key`);
        }
       
        // Prevent common browser shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch(e.key.toLowerCase()) {
            case 'w': // Ctrl+W (close tab)
            case 't': // Ctrl+T (new tab)
            case 'n': // Ctrl+N (new window)
            case 'tab': // Ctrl+Tab (switch tab)
              e.preventDefault();
              triggerViolation(`Attempted shortcut ${e.ctrlKey ? 'Ctrl+' : 'Cmd+'}${e.key}`);
              break;
          }
        }
      }
    };
   
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("keydown", preventDefault);
   
    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("keydown", preventDefault);
    };
  }, [isFullscreen, submitted]);
 
  /* ---------- Report Violation to Backend ---------- */
  const triggerViolation = async (reason) => {
    // Prevent multiple rapid violations
    if (violationCooldownRef.current) {
      console.log("Violation cooldown active, skipping");
      return;
    }
 
    if (submitted || violationLockRef.current || fullscreenRequired) {
      console.log("Cannot trigger violation - lock/block active");
      return;
    }
 
    // Set cooldown to prevent rapid violations
    violationCooldownRef.current = true;
    setTimeout(() => {
      violationCooldownRef.current = false;
    }, 2000); // 2 second cooldown
 
    violationLockRef.current = true;
 
    try {
      // Get current answers formatted for backend
      const formattedAnswers = formatAnswersForBackend();
     
      console.log("Triggering violation:", reason);
      console.log("Current answers:", formattedAnswers);
      console.log("Current warnings:", warnings);
 
      // First update the frontend warning count
      const newWarningCount = warnings + 1;
      console.log("New warning count will be:", newWarningCount);
     
      // Call violation API with current answers
      try {
        await submitViolation(submissionId, formattedAnswers);
        console.log("Violation reported to backend successfully");
      } catch (apiError) {
        console.error("Error reporting violation to API:", apiError);
        // Continue even if API fails - update frontend state
      }
     
      // Update warnings state
      setWarnings(newWarningCount);
 
      // Show warning alert
      alert(
        `⚠️ RULE VIOLATION\n\n${reason}\n\n` +
        `Warnings: ${newWarningCount}/${MAX_WARNINGS}\n\n` +
        `${newWarningCount >= MAX_WARNINGS ?
          'Next violation will auto-submit your exam!' :
          `${MAX_WARNINGS - newWarningCount} warnings remaining`}`
      );
 
      // If this is the 3rd violation (warnings will be 3 after increment),
      // backend will auto-submit, so we redirect to dashboard
      if (newWarningCount > MAX_WARNINGS) {
        console.log("Violation limit exceeded, redirecting to dashboard");
        handleViolationLimitExceeded();
        violationLockRef.current = false;
        return;
      }
 
      // Force back to fullscreen if needed
      if (!document.fullscreenElement && !fullscreenRequired) {
        try {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
            setIsFullscreen(true);
          } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
            setIsFullscreen(true);
          }
        } catch (e) {
          console.warn("Failed to re-enter fullscreen:", e);
        }
      }
 
    } catch (error) {
      console.error("Error in triggerViolation:", error);
      // Even if there's an error, update the warning count
      setWarnings(prev => prev + 1);
    } finally {
      violationLockRef.current = false;
    }
  };
 
  /* ---------- Handle Violation Limit Exceeded ---------- */
  const handleViolationLimitExceeded = () => {
    if (submitted) return;
   
    setSubmitted(true);
    console.log("Violation limit exceeded, redirecting to dashboard");
   
    // Navigate to dashboard with appropriate message
    navigate("/candidate-dashboard", {
      replace: true,
      state: {
        examCompleted: true,
        message: "Exam completed - You exceeded the violation limit",
        autoSubmitted: true,
        reason: "Maximum violations reached",
        warnings: warnings
      }
    });
  };
 
  /* ---------- Return to Fullscreen ---------- */
  const handleReturnToFullscreen = async () => {
    try {
      const elem = document.documentElement;
 
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
 
      setFullscreenRequired(false);
      violationLockRef.current = false;
      setIsFullscreen(true);
    } catch (e) {
      alert("Fullscreen permission is required to continue the exam.");
    }
  };
 
  /* ---------- Periodic Checkpoint (Save time) ---------- */
  useEffect(() => {
    const saveCheckpoint = async () => {
      try {
        // Send current time left to backend every 30 seconds
        const formattedAnswers = formatAnswersForBackend();
        // Use the imported api instance
        await api.post(`/api/exams/session/submissions/${submissionId}/checkpoint`, {
          timeLeft: timeLeft,
          answers: formattedAnswers
        });
        console.log("Checkpoint saved:", timeLeft);
      } catch (err) {
        console.error("Error saving checkpoint:", err);
      }
    };
   
    // Save checkpoint every 30 seconds
    checkpointTimerRef.current = setInterval(saveCheckpoint, 30000);
   
    return () => {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
    };
  }, [submissionId, timeLeft, formatAnswersForBackend]);
 
  /* ---------- Timer with Auto-Submit ---------- */
  useEffect(() => {
    if (submitted || timeLeft <= 0 || questions.length === 0) return;
   
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
   
    return () => clearInterval(timer);
  }, [timeLeft, submitted, questions.length]);
 
  const handleTimeExpired = async () => {
    if (submitted) return;
   
    try {
      setSubmitted(true);
     
      // Format answers for backend
      const formattedAnswers = formatAnswersForBackend();
     
      console.log("Time expired, submitting:", formattedAnswers);
     
      // Call submit endpoint
      await submitExamAnswers(submissionId, formattedAnswers);
     
      navigate("/candidate-dashboard", {
        replace: true,
        state: {
          examCompleted: true,
          message: "Time expired - Exam submitted",
          autoSubmitted: true,
          reason: "Time expired"
        }
      });
     
    } catch (err) {
      console.error("Error on time expiration:", err);
      setError("Failed to submit on time expiration.");
      setSubmitted(false);
    }
  };
 
  /* ---------- Initialize Exam ---------- */
  useEffect(() => {
    const initializeExam = async () => {
      if (questions.length > 0 && !submitted) {
        // Check and set fullscreen
        const isFs = !!document.fullscreenElement;
        setIsFullscreen(isFs);
       
        console.log("Initializing exam, fullscreen:", isFs);
       
        // If not in fullscreen, trigger violation after grace period
        if (!isFs) {
          setTimeout(() => {
            if (!document.fullscreenElement && !submitted && !fullscreenGraceRef.current) {
              console.log("Not in fullscreen after grace period, triggering violation");
              triggerViolation("Not in fullscreen mode on exam start");
            }
          }, 2000);
        }
       
        setLoading(false);
      }
    };
 
    initializeExam();
 
    return () => {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
      }
    };
  }, [questions.length, submitted]);
 
  /* ---------- Answer Handling ---------- */
  const handleOptionSelect = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };
 
  /* ---------- Manual Submit ---------- */
  const handleSubmit = async () => {
    if (submitted) return;
   
    // Check if user has exceeded violation limit
    if (warnings > MAX_WARNINGS) {
      alert("You cannot submit manually as you have exceeded the violation limit.");
      handleViolationLimitExceeded();
      return;
    }
   
    const confirmSubmit = window.confirm(
      "Are you sure you want to submit the exam?\n\n" +
      "Once submitted, you cannot return to the exam."
    );
   
    if (!confirmSubmit) return;
   
    try {
      setSubmitted(true);
     
      // Format answers for backend
      const formattedAnswers = formatAnswersForBackend();
     
      console.log("Manually submitting answers:", formattedAnswers);
     
      // Submit to backend using the regular submit endpoint
      await submitExamAnswers(submissionId, formattedAnswers);
     
      alert("Exam submitted successfully!");
      navigate("/candidate-dashboard", {
        replace: true,
        state: {
          examCompleted: true,
          message: "Exam submitted successfully",
          manualSubmit: true,
          warnings: warnings
        }
      });
     
    } catch (err) {
      console.error("Error submitting exam:", err);
      setError("Failed to submit exam. Please try again.");
      setSubmitted(false);
    }
  };
 
  const formatTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
   
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
 
  /* ---------- Navigation ---------- */
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
 
  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
 
  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Initializing Exam...</h2>
        <p>Please wait while we set up the exam environment.</p>
        <p>Fullscreen mode will be activated automatically.</p>
        {!isFullscreen && (
          <button onClick={enterFullscreen} className="enter-fullscreen-btn">
            Enter Fullscreen Now
          </button>
        )}
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="error-screen">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/candidate-dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }
 
  if (submitted) {
    return (
      <div className="exam-submitted">
        <h1>Exam Submitted</h1>
        <p>Your exam has been submitted. Redirecting to dashboard...</p>
        <button onClick={() => navigate("/candidate-dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }
 
  if (questions.length === 0) {
    return (
      <div className="no-questions">
        <h2>No Questions Available</h2>
        <p>There are no questions for this exam.</p>
        <button onClick={() => navigate("/candidate-dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }
 
  const currentQuestion = questions[currentIndex];
 
  return (
    <div className="exam-interface">
      {fullscreenRequired && (
        <div className="fullscreen-blocker">
          <div className="fullscreen-modal">
            <h2>⚠️ Fullscreen Required</h2>
            <p>
              You exited fullscreen during the exam.
              To continue, you must return to fullscreen mode.
            </p>
            <p className="warning-text">
              Violation Warnings: {warnings}/{MAX_WARNINGS}
            </p>
            <button onClick={handleReturnToFullscreen}>
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}
     
      {/* Fullscreen Warning */}
      {!isFullscreen && !fullscreenRequired && (
        <div className="fullscreen-warning">
          ⚠️ WARNING: You are not in fullscreen mode! Return to fullscreen immediately.
        </div>
      )}
     
      {/* Tab Visibility Warning */}
      {!isTabVisible && !fullscreenRequired && (
        <div className="visibility-warning">
          ⚠️ WARNING: Tab is not visible! Return to exam tab immediately.
        </div>
      )}
 
      {/* Sidebar - Question Navigation */}
      <aside className="question-sidebar">
        <h3>Questions</h3>
        <div className="question-numbers">
          {questions.map((q, index) => (
            <div
              key={q.id || index}
              className={`question-number ${
                index === currentIndex ? "active" : ""
              } ${answers[q.id] ? "answered" : ""}`}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </div>
          ))}
        </div>
       
        <div className="sidebar-stats">
          <div className="stat">
            <span className="stat-label">Answered:</span>
            <span className="stat-value">
              {Object.keys(answers).length}/{questions.length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Remaining:</span>
            <span className="stat-value">
              {questions.length - Object.keys(answers).length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Violations:</span>
            <span className={`stat-value ${warnings >= MAX_WARNINGS ? "critical" : "warning"}`}>
              {warnings} / {MAX_WARNINGS}
            </span>
          </div>
        </div>
      </aside>
 
      {/* Main Question Area */}
      <main className="question-area">
        <div className="question-header">
          <h2>
            Question {currentIndex + 1} of {questions.length}
          </h2>
          <div className="question-meta">
            <span className="question-id">ID: {currentQuestion.id}</span>
            {currentQuestion.marks && (
              <span className="question-marks">Marks: {currentQuestion.marks}</span>
            )}
          </div>
        </div>
       
        <div className="question-text">
          <p>{currentQuestion.text || currentQuestion.question}</p>
        </div>
 
        <div className="options">
          {currentQuestion.options && Object.entries(currentQuestion.options).map(([key, value]) => (
            <label key={key} className={`option ${
              answers[currentQuestion.id] === key ? "selected" : ""
            }`}>
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={key}
                checked={answers[currentQuestion.id] === key}
                onChange={() => handleOptionSelect(currentQuestion.id, key)}
              />
              <span className="option-label">{key}:</span>
              <span className="option-text">{value}</span>
            </label>
          ))}
        </div>
 
        <div className="navigation-buttons">
          <button
            className="nav-btn prev-btn"
            disabled={currentIndex === 0}
            onClick={goToPrevious}
          >
            ← Previous
          </button>
 
          <button
            className="nav-btn next-btn"
            disabled={currentIndex === questions.length - 1}
            onClick={goToNext}
          >
            Next →
          </button>
 
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={warnings > MAX_WARNINGS}
          >
            {warnings > MAX_WARNINGS ? 'Violation Limit Exceeded' : 'Submit Exam'}
          </button>
        </div>
      </main>
 
      {/* Timer + Warning Panel */}
      <div className="control-panel">
        <div className="timer-container">
          <h3>Time Remaining</h3>
          <div className="timer-display">{formatTime()}</div>
          <p className="timer-note">Timer cannot be paused</p>
        </div>
       
        <div className="warning-container">
          <h3>Violation Warnings</h3>
          <div className="warning-display">
            <span className={`warning-count ${warnings >= MAX_WARNINGS ? "critical" : ""}`}>
              {warnings} / {MAX_WARNINGS}
            </span>
            <div className="warning-bar">
              <div
                className="warning-fill"
                style={{ width: `${Math.min(100, (warnings / MAX_WARNINGS) * 100)}%` }}
              />
            </div>
          </div>
          <p className="warning-note">
            {warnings > MAX_WARNINGS
              ? "❌ MAXIMUM VIOLATIONS EXCEEDED - Exam auto-submitted"
              : warnings >= MAX_WARNINGS
              ? "⚠️ MAXIMUM WARNINGS - Next violation auto-submits!"
              : warnings > 0
              ? `⚠️ ${MAX_WARNINGS - warnings} warning(s) remaining`
              : "No violations yet"}
          </p>
         
          <div className="status-indicators">
            <div className={`status-indicator ${isFullscreen ? "good" : "bad"}`}>
              {isFullscreen ? "✅ Fullscreen" : "❌ Not Fullscreen"}
            </div>
            <div className={`status-indicator ${isTabVisible ? "good" : "bad"}`}>
              {isTabVisible ? "✅ Tab Visible" : "❌ Tab Hidden"}
            </div>
            <div className="status-indicator">
              {navigator.mediaDevices ? "✅ Camera Monitoring" : "❌ Camera Not Available"}
            </div>
          </div>
        </div>
       
        <div className="exam-info">
          <h3>Exam Info</h3>
          <p><strong>Exam ID:</strong> {id}</p>
          <p><strong>Submission ID:</strong> {submissionId?.substring(0, 8)}...</p>
          <p><strong>Total Questions:</strong> {questions.length}</p>
          <p><strong>Answered:</strong> {Object.keys(answers).length}</p>
        </div>
      </div>
    </div>
  );
}
 
export default CandidateExamInterface;