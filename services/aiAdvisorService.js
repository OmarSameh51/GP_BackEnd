const axios = require("axios");

const baseURL = process.env.AI_SERVICE_URL;
const internalKey = process.env.AI_INTERNAL_KEY;
const timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 60000;

const client = axios.create({
  baseURL,
  timeout: timeoutMs,
  headers: internalKey ? { "X-Internal-Key": internalKey } : {},
});

const getStudentAdvice = async (studentId, { semester } = {}) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const body = { studentId };
  if (semester === 1 || semester === 2) body.semester = semester;
  const { data } = await client.post("/v1/advise/student", body);
  return data;
};

const getGuestAdvice = async (payload) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const { data } = await client.post("/v1/advise/guest", payload);
  return data;
};

const getStudentRoadmap = async (studentId, { semester } = {}) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const body = { studentId };
  if (semester === 1 || semester === 2) body.semester = semester;
  const { data } = await client.post("/v1/roadmap/student", body);
  return data;
};

const getGuestRoadmap = async (payload) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const { data } = await client.post("/v1/roadmap/guest", payload);
  return data;
};

const summarizeText = async (text) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const { data } = await client.post("/v1/summarize", { text });
  return data;
};

const getGpaForecast = async (studentId) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const { data } = await client.post("/v1/forecast/gpa", { studentId });
  return data;
};

const predictGrade = async ({ coursework, midterm, courseworkMax, midtermMax }) => {
  if (!baseURL) throw new Error("AI_SERVICE_URL is not configured");
  const { data } = await client.post("/v1/predict/grade", {
    coursework,
    midterm,
    courseworkMax,
    midtermMax,
  });
  return data;
};

module.exports = {
  getStudentAdvice,
  getGuestAdvice,
  getStudentRoadmap,
  getGuestRoadmap,
  summarizeText,
  getGpaForecast,
  predictGrade,
};
