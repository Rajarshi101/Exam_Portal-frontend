import api from "./api";

export const createExam = (adminId, examData) =>
  api.post(`/admin/exams/create?adminId=${adminId}`, examData);

export const addQuestion = (examId, question) =>
  api.post(`/admin/exams/${examId}/questions`, question);

export const publishExam = (examId) =>
  api.post(`/admin/exams/${examId}/publish`);

export const inviteMultipleCandidates = (examId, payload) =>
  api.post(`/admin/exams/${examId}/candidate-multiple-invite`, payload);

export const uploadExamCandidatesCSV = (examId, formData) =>
  api.post(`/admin/exams/${examId}/direct-upload-exam-candidate`, formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );