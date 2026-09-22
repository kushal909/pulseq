// const BASE = "http://localhost:5000/api";
const BASE=import.meta.env.VITE_API_URL
const request = async (path, opt = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE + path, {
    ...opt,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opt.headers || {}),
    },
  });
  console.log("res",res)
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw Error(data.message || "Request failed");
  }

  return data;
};

export const api = {
  // =========================
  // AUTH
  // =========================

  login: (b) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  register: (b) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // =========================
  // DOCTORS
  // =========================

  doctors: () => request("/queue/doctors"),

  createDoctor: (b) =>
    request("/queue/doctors", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // =========================
  // TOKENS
  // =========================

  createToken: (b) =>
    request("/queue/tokens", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // 👇 ADD THIS
  today: () => request("/queue/today"),

  // =========================
// ONLINE APPOINTMENTS
// =========================

appointmentsToday: () =>
  request("/queue/appointments/today"),

checkInAppointment: (appointmentId) =>
  request("/queue/appointments/check-in", {
    method: "POST",
    body: JSON.stringify({
      appointmentId,
    }),
  }),

  // =========================
  // QUEUE
  // =========================

  queue: (doctorId, date) =>
    request(
      `/queue/queue?doctorId=${doctorId}&businessDate=${date}`
    ),

  callNext: (doctorId, date) =>
    request("/queue/call-next", {
      method: "POST",
      body: JSON.stringify({
        doctorId,
        businessDate: date,
      }),
    }),

  start: (id) =>
    request("/queue/start", {
      method: "POST",
      body: JSON.stringify({
        doctorId: id,
      }),
    }),

  complete: (id) =>
    request("/queue/complete", {
      method: "POST",
      body: JSON.stringify({
        doctorId: id,
      }),
    }),

  skip: (id) =>
    request("/queue/skip", {
      method: "POST",
      body: JSON.stringify({
        doctorId: id,
      }),
    }),

  break: (id) =>
    request("/queue/break", {
      method: "POST",
      body: JSON.stringify({
        doctorId: id,
      }),
    }),

  resume: (id) =>
    request("/queue/resume", {
      method: "POST",
      body: JSON.stringify({
        doctorId: id,
      }),
    }),

  // =========================
  // PUBLIC
  // =========================

  publicHospitals: () =>
    request("/public/hospitals"),

  publicDoctors: (id) =>
    request(`/public/doctors/${id}`),

  book: (b) =>
    request("/public/appointments", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  publicQueue: (id) =>
    request(`/public/queue/${id}`),
};