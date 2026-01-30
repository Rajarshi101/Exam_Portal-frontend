import { useState } from "react";
import { createExam, addQuestion, publishExam, inviteMultipleCandidates, uploadExamCandidatesCSV } from "../../api/examApi";
import { inviteUser } from "../../api/adminUserApi";
import "../../styles/CreateExamWizard.css";

function CreateExamWizard() {
  const [createdExamId, setCreatedExamId] = useState(null);

  const [step, setStep] = useState(1);

  // STEP 1
  const [examDetails, setExamDetails] = useState({
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    duration: ""
  });

  // STEP 2
  const [marksPerQuestion, setMarksPerQuestion] = useState("");
  const [questions, setQuestions] = useState([]);

  // STEP 3
  const [inviteMethod, setInviteMethod] = useState("individual");
  const [candidates, setCandidates] = useState([{ name: "", email: "" }]);
  const [bulkCandidates, setBulkCandidates] = useState([]);
  

  /* ---------------- STEP 1 ---------------- */
  const handleDetailsChange = (e) => {
    setExamDetails({ ...examDetails, [e.target.name]: e.target.value });
  };

  const goToStep2 = async () => {
    if (Object.values(examDetails).some((v) => !v)) {
      alert("Fill all exam details.");
      return;
    }
  
    try {
      const adminId = localStorage.getItem("adminId") || 1;
  
      const res = await createExam(adminId, {
        title: examDetails.title,
        description: examDetails.description,
        duration: Number(examDetails.duration),
        startDate: examDetails.startDateTime,
        endDate: examDetails.endDateTime,
      });

      setCreatedExamId(res.data.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to create exam");
    }
  };

  /* ---------------- STEP 2 ---------------- */
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const rows = target.result.split("\n").slice(1);
      const parsed = rows
        .map((row) => row.split(","))
        .filter((r) => r.length >= 6)
        .map((cols, idx) => ({
          id: idx + 1,
          question: cols[0],
          options: [cols[1], cols[2], cols[3], cols[4]],
          correctAnswer: cols[5]?.trim()
        }));
      setQuestions(parsed);
    };
    reader.readAsText(file);
  };

  const goToStep3 = async () => {
    if (!marksPerQuestion || questions.length === 0) {
      alert("Upload questions and assign marks.");
      return;
    }
  
    try {
      for (const q of questions) {
        await addQuestion(createdExamId, {
          text: q.question,
          options: {
            A: q.options[0],
            B: q.options[1],
            C: q.options[2],
            D: q.options[3],
          },
          correctOption: q.correctAnswer,
          marks: Number(marksPerQuestion),
        });
      }

      await publishExam(createdExamId);
  
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to add questions");
    }
  };

  /* ---------------- STEP 3 ---------------- */
  const addCandidateField = () => {
    setCandidates([...candidates, { name: "", email: "" }]);
  };
  
  const updateCandidate = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };
  
  const removeCandidateField = (index) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };
  
  const handleBulkCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const rows = target.result.split("\n").slice(1);
  
      const parsed = rows
        .map((row) => row.split(","))
        .filter((cols) => cols.length >= 2)
        .map((cols) => ({
          name: cols[0].trim(),
          email: cols[1].trim(),
        }))
        .filter((c) => c.name && c.email);
  
      setBulkCandidates(parsed);
    };
    reader.readAsText(file);
  };  

  const finishCreatingExam = async () => {
    try {
      if (inviteMethod === "individual") {
        await inviteMultipleCandidates(createdExamId, candidates);
      } else {
        const formData = new FormData();
        formData.append("file", bulkCSVFile); // store this in state

        await uploadExamCandidatesCSV(createdExamId, formData);
      }

      alert("Exam created and candidates invited successfully ✅");
      setStep(1);
    } catch (err) {
      console.error(err);
      alert("Candidate invitation failed ❌");
    }
  };
   

  return (
    <div className="wizard-container">
      {/* STEPS HEADER */}
      <div className="wizard-steps">
        <span className={step === 1 ? "active" : ""}>1. Exam Details</span>
        <span className={step === 2 ? "active" : ""}>2. Upload Questions</span>
        <span className={step === 3 ? "active" : ""}>3. Invite Students</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="wizard-step">
          <input name="title" placeholder="Exam Title" onChange={handleDetailsChange} />
          <textarea name="description" placeholder="Description" onChange={handleDetailsChange} />
          <input type="datetime-local" name="startDateTime" onChange={handleDetailsChange} />
          <input type="datetime-local" name="endDateTime" onChange={handleDetailsChange} />
          <input type="number" name="duration" placeholder="Duration (minutes)" onChange={handleDetailsChange} />
          <button className="next-btn" onClick={goToStep2}>Next</button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="wizard-step">
            <label>
            Upload Question CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} />
            </label>

            <label>
            Marks Per Question
            <input
                type="number"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(e.target.value)}
            />
            </label>

            {questions.length > 0 && (
            <div className="question-preview">
                <h3>Question Preview</h3>
                <table>
                <thead>
                    <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Correct Answer</th>
                    </tr>
                </thead>
                <tbody>
                    {questions.map((q) => (
                    <tr key={q.id}>
                        <td>{q.id}</td>
                        <td>{q.question}</td>
                        <td>{q.correctAnswer}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}

            <button className="next-btn" onClick={goToStep3}>
            Next
            </button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="wizard-step">

            <h3 className="section-title">Invitation Method</h3>

            {/* Radio buttons in one row */}
            <div className="invite-method-row">
            <label className="radio-option">
                <input
                type="radio"
                name="inviteMethod"
                value="individual"
                checked={inviteMethod === "individual"}
                onChange={() => setInviteMethod("individual")}
                />
                Individual_Invite
            </label>

            <label className="radio-option">
                <input
                type="radio"
                name="inviteMethod"
                value="bulk"
                checked={inviteMethod === "bulk"}
                onChange={() => setInviteMethod("bulk")}
                />
                Bulk_Invite
            </label>
            </div>

            {/* INDIVIDUAL INVITE */}
            {inviteMethod === "individual" && (
            <div className="invite-section">
                <label>Candidate Email IDs</label>

                {candidates.map((candidate, index) => (
                  <div className="email-row" key={index}>
                    <input
                      type="text"
                      placeholder="Candidate Name"
                      value={candidate.name}
                      onChange={(e) =>
                        updateCandidate(index, "name", e.target.value)
                      }
                    />

                    <input
                      type="email"
                      placeholder="Candidate Email ID"
                      value={candidate.email}
                      onChange={(e) =>
                        updateCandidate(index, "email", e.target.value)
                      }
                    />

                    {candidates.length > 1 && (
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => removeCandidateField(index)}
                        title="Remove"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={addCandidateField}
                >
                  + Add Candidate
                </button>
            </div>
            )}

            {/* BULK INVITE */}
            {inviteMethod === "bulk" && (
            <div className="invite-section">
                <label>Upload CSV with Email IDs</label>
                <input type="file" accept=".csv" onChange={handleBulkCSV} />
            </div>
            )}

            <button className="finish-btn" onClick={finishCreatingExam}>
            Finish Creating
            </button>
        </div>
      )}
    </div>
  );
}

export default CreateExamWizard;