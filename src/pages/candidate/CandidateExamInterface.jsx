import { getScreenStream, clearScreenStream } from "../../utils/screenStream";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { submitViolation, submitExamAnswers, submitSnapshot } from "../../api/candidateApi";
import "../../styles/CandidateExamInterface.css";
 
// Import your API instance
import api from "../../api/api";
 
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
 
  // Camera preview states
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraPermission, setCameraPermission] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [cameraInitialized, setCameraInitialized] = useState(false);
 
  // Snapshot tracking
  const snapshotsTakenRef = useRef(0);
  const scheduledSnapshotsRef = useRef([false, false, false]); // Track which snapshots have been taken
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const snapshotsScheduledRef = useRef(false);
 
 
 
  const videoRef = useRef(null);
  const fullscreenGraceRef = useRef(true);
  const checkpointTimerRef = useRef(null);
  const violationLockRef = useRef(false);
  const cameraCheckIntervalRef = useRef(null);
  const violationCooldownRef = useRef(false);
  const snapshotInProgressRef = useRef(false);
  const cameraRetryCountRef = useRef(0);
  const maxCameraRetries = 3;
 
  const MAX_WARNINGS = 2;
 
  // Format answers for backend
  const formatAnswersForBackend = useCallback(() => {
    const formatted = {};
    questions.forEach(question => {
      const questionId = question.id;
      const answer = answers[questionId];
      if (answer) {
        formatted[questionId.toString()] = answer;
      }
    });
    return formatted;
  }, [answers, questions]);
 
  /* ---------- SCREENSHOT CAPTURE (Tab only) ---------- */
  // const captureTabScreenshot = async () => {
  //   try {
  //     // Dynamically import html2canvas only when needed
  //     const html2canvas = (await import('html2canvas')).default;
     
  //     // Capture only the main content area (not the whole page)
  //     const examContent = document.querySelector('.exam-interface') || document.documentElement;
     
  //     const canvas = await html2canvas(examContent, {
  //       scale: 0.8,
  //       logging: false,
  //       useCORS: true,
  //       allowTaint: true,
  //       backgroundColor: '#ffffff',
  //       windowWidth: window.innerWidth,
  //       windowHeight: window.innerHeight
  //     });
     
  //     return new Promise((resolve) => {
  //       canvas.toBlob((blob) => {
  //         const file = new File([blob], `screenshot-${Date.now()}.jpg`, {
  //           type: 'image/jpeg',
  //           lastModified: Date.now()
  //         });
  //         resolve(file);
  //       }, 'image/jpeg', 0.7);
  //     });
     
  //   } catch (error) {
  //     console.error("Error capturing screenshot:", error);
  //     return null;
  //   }
  // };
 
  /* ---------- SNAPSHOT FUNCTION (Only for scheduled times) ---------- */
  // const takeScheduledSnapshot = async (snapshotIndex) => {
  //   // Prevent concurrent snapshots
  //   if (snapshotInProgressRef.current || submitted) {
  //     return;
  //   }
   
  //   // Check if this snapshot was already taken
  //   if (scheduledSnapshotsRef.current[snapshotIndex]) {
  //     console.log(`Snapshot #${snapshotIndex + 1} already taken, skipping`);
  //     return;
  //   }
   
  //   snapshotInProgressRef.current = true;
   
  //   try {
  //     console.log(`Taking scheduled snapshot #${snapshotIndex + 1}...`);
     
  //     const imageFile = await captureTabScreenshot();
     
  //     if (imageFile) {
  //       await submitSnapshot(submissionId, imageFile);
       
  //       // Mark this snapshot as taken
  //       scheduledSnapshotsRef.current[snapshotIndex] = true;
  //       snapshotsTakenRef.current++;
       
  //       console.log(`Scheduled snapshot #${snapshotIndex + 1} submitted successfully`);
  //     }
     
  //   } catch (error) {
  //     console.error(`Error taking scheduled snapshot #${snapshotIndex + 1}:`, error);
  //   } finally {
  //     snapshotInProgressRef.current = false;
  //   }
  // };
 
 
  /* ---------- CAPTURE FULLSCREEN FRAME ---------- */
  const captureFullScreenFrame = async () => {
    if (!screenVideoRef.current) return null;
 
    const video = screenVideoRef.current;

    // 🔥 Wait for next rendered frame (Firefox safe)
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200); // small delay to allow compositor update
        });
      });
    });

    // Ensure dimensions are valid
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready for capture");
      return null;
    }
 
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
 
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
 
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
 
        const file = new File([blob], `screen-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
 
        resolve(file);
      }, "image/jpeg", 0.8);
    });
  };
 
 
 
  /* ---------- SCHEDULE 3 SNAPSHOTS AT EQUAL INTERVALS ---------- */
  // const scheduleThreeSnapshots = useCallback(() => {
  //   const totalDurationSeconds = location.state?.duration * 60 || 3600;
   
  //   // Calculate intervals for 3 snapshots at equal intervals
  //   const snapshotTimes = [
  //     Math.floor(totalDurationSeconds * 0.25), // First snapshot at 25%
  //     Math.floor(totalDurationSeconds * 0.5),  // Second snapshot at 50%
  //     Math.floor(totalDurationSeconds * 0.75)  // Third snapshot at 75%
  //   ];
   
  //   console.log("Scheduling 3 snapshots at:",
  //     snapshotTimes.map(t => `${Math.floor(t/60)}m ${t%60}s into exam`));
   
  //   // Schedule each snapshot
  //   snapshotTimes.forEach((snapshotTime, index) => {
  //     setTimeout(() => {
  //       // takeScheduledSnapshot(index);
  //     }, snapshotTime * 1000);
  //   });
   
  // }, [submissionId]);
 
  const initializeScreenVideo = async () => {
    const stream = getScreenStream();
 
    if (!stream || stream.getVideoTracks()[0].readyState === "ended") {
      alert("Screen share not active. Please restart exam.");
      navigate("/candidate-dashboard");
      return;
    }
 
    screenStreamRef.current = stream;
 
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
 
    await video.play();
 
    // Firefox-safe wait for dimensions
    await new Promise((resolve) => {
      const checkReady = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolve();
        } else {
          requestAnimationFrame(checkReady);
        }
      };
      checkReady();
    });
 
    screenVideoRef.current = video;
  };
 
 
  const scheduleThreeSnapshots = useCallback(async () => {
    const totalDurationSeconds = location.state?.duration * 60 || 3600;
 
    const snapshotTimes = [
      Math.floor(totalDurationSeconds * 0.25),
      Math.floor(totalDurationSeconds * 0.5),
      Math.floor(totalDurationSeconds * 0.75)
    ];
 
    snapshotTimes.forEach((snapshotTime, index) => {
      setTimeout(async () => {
        if (submitted) return;
 
        const imageFile = await captureFullScreenFrame();
 
        if (imageFile) {
          await submitSnapshot(submissionId, imageFile);
          console.log(`Full screen snapshot #${index + 1} submitted`);
        }
      }, snapshotTime * 1000);
    });
 
  }, [submissionId, location.state?.duration, submitted]);
 
 
 
  /* ---------- CAMERA SETUP (FIXED) ---------- */
  const initializeCamera = async () => {
    try {
      // Stop any existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
          track.stop();
        });
      }
 
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
     
      if (videoDevices.length === 0) {
        setCameraError("No camera detected");
        setCameraActive(false);
        return;
      }
 
      // Request camera with specific constraints for better stability
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
          frameRate: { ideal: 15 }
        },
        audio: false
      };
 
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
     
      // Set the stream first
      setCameraStream(stream);
      setCameraActive(true);
      setCameraPermission(true);
      setCameraError("");
      setCameraInitialized(true);
      cameraRetryCountRef.current = 0;
     
      // Then attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
       
        // Play with a small delay
        setTimeout(async () => {
          try {
            if (videoRef.current) {
              await videoRef.current.play();
              console.log("Camera preview started");
            }
          } catch (playError) {
            console.error("Error playing video:", playError);
          }
        }, 100);
      }
     
      console.log("Camera initialized successfully");
     
    } catch (error) {
      console.error("Camera initialization error:", error);
      setCameraActive(false);
     
      if (error.name === 'NotAllowedError') {
        setCameraError("Camera permission denied");
        triggerViolation("Camera permission denied");
      } else if (error.name === 'NotFoundError') {
        setCameraError("No camera found");
      } else if (error.name === 'NotReadableError') {
        setCameraError("Camera is already in use");
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
     
      // Retry logic
      if (cameraRetryCountRef.current < maxCameraRetries) {
        cameraRetryCountRef.current++;
        console.log(`Retrying camera (${cameraRetryCountRef.current}/${maxCameraRetries})...`);
        setTimeout(initializeCamera, 2000);
      }
    }
  };
 
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
      setCameraActive(false);
     
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);
 
  const toggleCameraPreview = () => {
    setShowCameraPreview(prev => !prev);
  };
 
  const reinitializeCamera = async () => {
    setCameraError("");
    cameraRetryCountRef.current = 0;
    stopCamera();
    setTimeout(initializeCamera, 500);
  };
 
  /* ---------- CAMERA HEALTH CHECK ---------- */
  const checkCameraHealth = useCallback(() => {
    if (!cameraStream || !cameraActive) {
      if (!submitted && !fullscreenRequired && cameraRetryCountRef.current < maxCameraRetries) {
        reinitializeCamera();
      }
      return;
    }
   
    try {
      const tracks = cameraStream.getVideoTracks();
      if (tracks.length === 0) {
        console.log("No video tracks, reinitializing...");
        reinitializeCamera();
        return;
      }
     
      const track = tracks[0];
      if (track.readyState === 'ended') {
        console.log("Camera track ended, reinitializing...");
        reinitializeCamera();
      }
     
      // Check if video is actually playing
      if (videoRef.current && videoRef.current.readyState < 2) {
        console.log("Video not playing properly, attempting to play...");
        videoRef.current.play().catch(err => {
          console.error("Error replaying video:", err);
        });
      }
     
    } catch (error) {
      console.error("Camera health check error:", error);
    }
  }, [cameraStream, cameraActive, submitted, fullscreenRequired]);
 
  /* ---------- FULLSCREEN DETECTION ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      fullscreenGraceRef.current = false;
    }, 800);
 
    return () => clearTimeout(timer);
  }, []);
 
  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = document.fullscreenElement;
      const isNowFullscreen = !!fs;
      setIsFullscreen(isNowFullscreen);
 
      if (fullscreenGraceRef.current) return;
 
      if (!isNowFullscreen && !submitted && !fullscreenRequired) {
        console.log("Fullscreen exit detected");
        setFullscreenRequired(true);
        triggerViolation("Exited fullscreen mode");
      } else if (isNowFullscreen && fullscreenRequired) {
        setFullscreenRequired(false);
      }
    };
 
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [submitted, fullscreenRequired]);
 
  /* ---------- TAB VISIBILITY DETECTION ---------- */
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
 
  /* ---------- CAMERA SETUP AND MONITORING ---------- */
  useEffect(() => {
    initializeCamera();
 
    return () => {
      stopCamera();
    };
  }, []);
 
  // Camera health check interval
  useEffect(() => {
    cameraCheckIntervalRef.current = setInterval(() => {
      checkCameraHealth();
    }, 30000); // Check every 30 seconds instead of 5
 
    return () => {
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
      }
    };
  }, [checkCameraHealth]);
 
  // Re-attach video when stream changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error("Error playing video in effect:", err);
      });
    }
  }, [cameraStream]);
 
  /* ---------- PREVENT CONTEXT MENU AND SHORTCUTS ---------- */
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.type === "contextmenu") {
        e.preventDefault();
        triggerViolation("Right-click attempted");
      }
     
      if (e.type === "keydown") {
        // Prevent picture-in-picture (Chrome)
        if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          triggerViolation("Picture-in-picture attempted");
        }
       
        // Prevent F11 and Escape
        if (e.key === "F11" || (e.key === "Escape" && isFullscreen)) {
          e.preventDefault();
          triggerViolation(`Attempted to use ${e.key} key`);
        }
       
        // Prevent browser shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch(e.key.toLowerCase()) {
            case 'w':
            case 't':
            case 'n':
            case 'tab':
            case 'p': // Picture-in-picture
              e.preventDefault();
              triggerViolation(`Attempted shortcut`);
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
 
  /* ---------- VIOLATION HANDLER ---------- */
  const triggerViolation = async (reason) => {
    if (violationCooldownRef.current || submitted || violationLockRef.current || fullscreenRequired) {
      return;
    }
 
    violationCooldownRef.current = true;
    setTimeout(() => {
      violationCooldownRef.current = false;
    }, 3000);
 
    violationLockRef.current = true;
 
    try {
 
      /* 📸 TAKE VIOLATION SCREENSHOT */
      if (!snapshotInProgressRef.current) {
        snapshotInProgressRef.current = true;
 
        const imageFile = await captureFullScreenFrame();
 
        if (imageFile) {
          await submitSnapshot(submissionId, imageFile);
          console.log("Violation screenshot submitted");
        }
 
        snapshotInProgressRef.current = false;
      }
 
      const formattedAnswers = formatAnswersForBackend();
     
      // Submit violation to backend
      await submitViolation(submissionId, formattedAnswers);
     
      setWarnings(prev => {
        const newCount = prev + 1;
       
        if (newCount > MAX_WARNINGS) {
          handleViolationLimitExceeded();
        }
       
        return newCount;
      });
 
    } catch (error) {
      console.error("Error in triggerViolation:", error);
    } finally {
      violationLockRef.current = false;
    }
  };
 
  /* ---------- VIOLATION LIMIT EXCEEDED ---------- */
  const handleViolationLimitExceeded = () => {
    if (submitted) return;
   
    setSubmitted(true);
   
    // Clear all intervals
    if (checkpointTimerRef.current) {
      clearInterval(checkpointTimerRef.current);
    }
    if (cameraCheckIntervalRef.current) {
      clearInterval(cameraCheckIntervalRef.current);
    }
   
    stopCamera();
 
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    clearScreenStream();
 
    snapshotsScheduledRef.current = false;
   
    navigate("/candidate-dashboard", {
      replace: true,
      state: {
        examCompleted: true,
        message: "Exam completed - You exceeded the violation limit",
        autoSubmitted: true
      }
    });
  };
 
  /* ---------- RETURN TO FULLSCREEN ---------- */
  const handleReturnToFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      setFullscreenRequired(false);
      setIsFullscreen(true);
    } catch (e) {
      alert("Fullscreen permission is required to continue the exam.");
    }
  };
 
  /* ---------- CHECKPOINT SAVE ---------- */
  useEffect(() => {
    const saveCheckpoint = async () => {
      try {
        const formattedAnswers = formatAnswersForBackend();
        await api.post(`/api/exams/session/submissions/${submissionId}/checkpoint`, {
          timeLeft: timeLeft,
          answers: formattedAnswers
        });
      } catch (err) {
        console.error("Error saving checkpoint:", err);
      }
    };
   
    checkpointTimerRef.current = setInterval(saveCheckpoint, 30000);
   
    return () => {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
    };
  }, [submissionId, timeLeft, formatAnswersForBackend]);
 
  /* ---------- TIMER ---------- */
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
     
      // Clear intervals
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
      }
     
      stopCamera();
 
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      clearScreenStream();
     
      const formattedAnswers = formatAnswersForBackend();
      await submitExamAnswers(submissionId, formattedAnswers);
 
      snapshotsScheduledRef.current = false;
     
      navigate("/candidate-dashboard", {
        replace: true,
        state: {
          examCompleted: true,
          message: "Time expired - Exam submitted",
          autoSubmitted: true
        }
      });
     
    } catch (err) {
      console.error("Error on time expiration:", err);
      setError("Failed to submit on time expiration.");
      setSubmitted(false);
    }
  };
 
  /* ---------- INITIALIZE EXAM AND SCHEDULE SNAPSHOTS ---------- */
  useEffect(() => {
    if (questions.length > 0 && !submitted) {
 
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
 
      (async () => {
 
        const stream = getScreenStream();
 
        if (!stream || stream.getVideoTracks()[0].readyState === "ended") {
          alert("Screen sharing not active. Please restart exam.");
          navigate("/candidate-dashboard");
          return;
        }
 
        console.log(stream.getVideoTracks()[0].getSettings());
 
        screenStreamRef.current = stream;
 
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
 
        await video.play();
 
        // 🔥 IMPORTANT: Firefox-safe wait for dimensions
        await new Promise((resolve) => {
          const checkReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              resolve();
            } else {
              requestAnimationFrame(checkReady);
            }
          };
          checkReady();
        });
 
        screenVideoRef.current = video;
 
        // Now start scheduled snapshots
        // scheduleThreeSnapshots();
        if (!snapshotsScheduledRef.current) {
          snapshotsScheduledRef.current = true;
          scheduleThreeSnapshots();
        }
 
 
      })();
 
      if (!isFs) {
        setTimeout(() => {
          if (
            !document.fullscreenElement &&
            !submitted &&
            !fullscreenGraceRef.current
          ) {
            triggerViolation("Not in fullscreen mode on exam start");
          }
        }, 2000);
      }
 
      setLoading(false);
    }
 
    return () => {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
      }
 
      // 🔴 Stop screen sharing when exam ends
      // if (screenStreamRef.current) {
      //   screenStreamRef.current.getTracks().forEach((track) => track.stop());
      // }
 
      stopCamera();
    };
 
  }, [questions.length, submitted, scheduleThreeSnapshots]);
 
 
  /* ---------- ANSWER HANDLING ---------- */
  const handleOptionSelect = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };
 
  /* ---------- MANUAL SUBMIT ---------- */
  const handleSubmit = async () => {
    if (submitted) return;
   
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
     
      // Clear intervals
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
      }
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
      }
     
      stopCamera();
 
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      clearScreenStream();
     
      const formattedAnswers = formatAnswersForBackend();
      await submitExamAnswers(submissionId, formattedAnswers);
     
      alert("Exam submitted successfully!");
 
      snapshotsScheduledRef.current = false;
 
      navigate("/candidate-dashboard", {
        replace: true,
        state: {
          examCompleted: true,
          message: "Exam submitted successfully",
          manualSubmit: true
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
 
  /* ---------- RENDER ---------- */
  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Initializing Exam...</h2>
        <p>Please wait while we set up the exam environment.</p>
        <p>Fullscreen mode will be activated automatically.</p>
        <p>Camera access is required for exam proctoring.</p>
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
 
      {/* Sidebar */}
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
 
      {/* Control Panel */}
      <div className="control-panel">
        <div className="timer-container">
          <h3>Time Remaining</h3>
          <div className="timer-display">{formatTime()}</div>
          <p className="timer-note">Timer cannot be paused</p>
        </div>
       
        {/* Camera Preview - FIXED */}
        <div className="camera-preview-container">
          <div className="camera-preview-header">
            <h3>Proctoring Camera</h3>
            <div className="camera-controls">
              <button
                className="camera-toggle-btn"
                onClick={toggleCameraPreview}
                title={showCameraPreview ? "Hide camera" : "Show camera"}
              >
                {showCameraPreview ? "Hide" : "Show"}
              </button>
              <button
                className="camera-refresh-btn"
                onClick={reinitializeCamera}
                title="Reconnect camera"
              >
                ↻
              </button>
            </div>
          </div>
         
          {showCameraPreview && (
            <div className="camera-preview">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    onLoadedData={() => console.log("Video loaded")}
                  />
                  <div className="camera-status active">
                    <span className="status-dot"></span>
                    Camera Active
                  </div>
                </>
              ) : (
                <div className="camera-error">
                  <div className="camera-error-icon">📷</div>
                  <p>{cameraError || "Camera not available"}</p>
                  <button
                    className="retry-camera-btn"
                    onClick={reinitializeCamera}
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>
          )}
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
            {warnings >= MAX_WARNINGS
              ? "⚠️ MAXIMUM WARNINGS - Next violation auto-submits!"
              : warnings > 0
              ? `⚠️ ${MAX_WARNINGS - warnings} warning(s) remaining`
              : "No violations yet"}
          </p>
        </div>
       
        <div className="status-indicators">
          <div className={`status-indicator ${isFullscreen ? "good" : "bad"}`}>
            {isFullscreen ? "✅ Fullscreen" : "❌ Not Fullscreen"}
          </div>
          <div className={`status-indicator ${isTabVisible ? "good" : "bad"}`}>
            {isTabVisible ? "✅ Tab Visible" : "❌ Tab Hidden"}
          </div>
          <div className={`status-indicator ${cameraActive ? "good" : "bad"}`}>
            {cameraActive ? "✅ Camera Active" : "❌ Camera Inactive"}
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default CandidateExamInterface;