// api/candidateApi.js
import api from "./api";

export const getStudentExams = () =>
  api.get("/api/student/exams");

export const startExamSession = (examId, imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return api.post(`/api/exams/session/${examId}/start`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const submitViolation = async (submissionId, payload = {}) => {
  try {
    const response = await api.post(
      `/api/exams/session/submissions/${submissionId}/violation`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error submitting violation:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const submitExamAnswers = async (submissionId, answers) => {
  try {
    const response = await api.post(
      `/api/exams/session/submissions/${submissionId}/submit`,
      answers
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error submitting exam:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Save progress periodically
export const saveProgress = async (submissionId, answers) => {
  try {
    const formattedAnswers = {};
    Object.entries(answers).forEach(([key, value]) => {
      formattedAnswers[String(key)] = String(value);
    });

    const response = await api.post(
      `/api/exams/session/submissions/${submissionId}/save`,
      {
        answers: formattedAnswers,
        timestamp: new Date().toISOString(),
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error saving progress:",
      error.response?.data || error.message
    );
    throw error;
  }
};
