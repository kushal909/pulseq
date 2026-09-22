import React, { useEffect, useState } from "react";

import { api } from "../api";
import { socket } from "../socket";

import ErrorMessage from "../components/ErrorMessage";

export default function ReceptionPage({ user }) {
  // =====================================================
  // STATE
  // =====================================================

  const [doctors, setDoctors] = useState([]);
  const [today, setToday] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [appointmentId, setAppointmentId] = useState("");

  const [form, setForm] = useState({
    doctorId: "",
    patientName: "",
    phoneNumber: "",
    reason: "",
    source: "walk_in",
  });

  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DOCTORS + TOKENS + ONLINE APPOINTMENTS
  // =====================================================

  const load = async () => {
    try {
      setError("");

      // -----------------------------------------
      // Load doctors
      // -----------------------------------------

      const doctorsResponse = await api.doctors();

      console.log("DOCTORS RESPONSE:", doctorsResponse);

      const doctorsData =
        doctorsResponse?.doctors ||
        doctorsResponse ||
        [];

      setDoctors(doctorsData);

      // -----------------------------------------
      // Load today's tokens
      // -----------------------------------------

      const todayResponse = await api.today();

      console.log("TODAY RESPONSE:", todayResponse);

      const todayData =
        todayResponse?.tokens ||
        todayResponse ||
        [];

      setToday(todayData);

      // -----------------------------------------
      // Load today's online appointments
      // -----------------------------------------

      setLoadingAppointments(true);

      const appointmentResponse =
        await api.appointmentsToday();

      console.log(
        "APPOINTMENTS RESPONSE:",
        appointmentResponse
      );

      const appointmentData =
        appointmentResponse?.appointments ||
        appointmentResponse ||
        [];

      setAppointments(appointmentData);

    } catch (err) {
      console.error("LOAD ERROR:", err);

      setError(err.message || "Failed to load data");

    } finally {
      setLoadingAppointments(false);
    }
  };

  // =====================================================
  // INITIAL LOAD + SOCKET
  // =====================================================

  useEffect(() => {
    if (!user?.hospitalId) {
      setError("Hospital ID is missing");
      return;
    }

    load();

    // Join hospital socket room
    socket.emit(
      "join-hospital",
      user.hospitalId
    );

    // Reload whenever queue changes
    const handleQueueUpdate = (data) => {
      console.log(
        "QUEUE SOCKET UPDATE:",
        data
      );

      load();
    };

    socket.on(
      "queue:update",
      handleQueueUpdate
    );

    return () => {
      socket.off(
        "queue:update",
        handleQueueUpdate
      );
    };
  }, [user?.hospitalId]);

  // =====================================================
  // HANDLE SOURCE CHANGE
  // =====================================================

  const handleSourceChange = (e) => {
    const source = e.target.value;

    setError("");
    setMessage("");

    setAppointmentId("");

    setForm({
      doctorId: "",
      patientName: "",
      phoneNumber: "",
      reason: "",
      source,
    });
  };

  // =====================================================
  // HANDLE ONLINE APPOINTMENT SELECTION
  // =====================================================

  const handleAppointmentChange = (e) => {
    const selectedId = e.target.value;

    setError("");
    setMessage("");

    setAppointmentId(selectedId);

    if (!selectedId) {
      setForm({
        doctorId: "",
        patientName: "",
        phoneNumber: "",
        reason: "",
        source: "online",
      });

      return;
    }

    const appointment = appointments.find(
      (item) => item._id === selectedId
    );

    if (!appointment) {
      setError("Appointment not found");
      return;
    }

    console.log(
      "SELECTED APPOINTMENT:",
      appointment
    );

    // -------------------------------------------------
    // Get doctor ID
    // -------------------------------------------------

    const selectedDoctorId =
      appointment.doctorId?._id ||
      appointment.doctorId ||
      "";

    // -------------------------------------------------
    // Fill patient information automatically
    // -------------------------------------------------

    setForm({
      doctorId: selectedDoctorId,

      patientName:
        appointment.patientName || "",

      phoneNumber:
        appointment.phoneNumber || "",

      reason:
        appointment.reason || "",

      source: "online",
    });
  };

  // =====================================================
  // WALK-IN TOKEN
  // =====================================================

  const createWalkInToken = async () => {
    const payload = {
      doctorId: form.doctorId,
      patientName: form.patientName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      reason: form.reason.trim(),
      source: "walk_in",
    };

    console.log(
      "WALK-IN TOKEN PAYLOAD:",
      payload
    );

    return await api.createToken(payload);
  };

  // =====================================================
  // ONLINE APPOINTMENT CHECK-IN
  // =====================================================

  const checkInOnlineAppointment = async () => {
    if (!appointmentId) {
      throw new Error(
        "Please select an online appointment"
      );
    }

    console.log(
      "CHECKING IN APPOINTMENT:",
      appointmentId
    );

    return await api.checkInAppointment(
      appointmentId
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      let response;

      // =================================================
      // ONLINE
      // =================================================

      if (form.source === "online") {
        response =
          await checkInOnlineAppointment();
      }

      // =================================================
      // WALK-IN
      // =================================================

      else {
        if (!form.doctorId) {
          throw new Error(
            "Please select a doctor"
          );
        }

        if (!form.patientName.trim()) {
          throw new Error(
            "Patient name is required"
          );
        }

        response =
          await createWalkInToken();
      }

      console.log(
        "TOKEN RESPONSE:",
        response
      );

      // =================================================
      // SUCCESS
      // =================================================

      const token =
        response?.token;

      if (token) {
        setMessage(
          `Token #${token.tokenNumber} created for ${token.patientName}`
        );
      } else {
        setMessage(
          "Token created successfully"
        );
      }

      // =================================================
      // RESET FORM
      // =================================================

      setAppointmentId("");

      setForm({
        doctorId: "",
        patientName: "",
        phoneNumber: "",
        reason: "",
        source: "walk_in",
      });

      // =================================================
      // REFRESH DATA
      // =================================================

      await load();

    } catch (err) {
      console.error(
        "TOKEN CREATION ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to create token"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================

  const formatStatus = (status) => {
    if (!status) return "";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section>

      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <div className="page-title">

        <div>
          <h1>
            Reception Desk
          </h1>

          <p>
            Create and monitor today's
            patient tokens.
          </p>
        </div>

        <span className="role-pill">
          Receptionist
        </span>

      </div>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="grid two">

        {/* =================================================
            ISSUE TOKEN
        ================================================= */}

        <form
          className="card form-card"
          onSubmit={submit}
        >

          <h2>
            Issue Token
          </h2>

          {/* =============================================
              SOURCE
          ============================================= */}

          <label>
            Source
          </label>

          <select
            value={form.source}
            onChange={handleSourceChange}
          >

            <option value="walk_in">
              Walk-in
            </option>

            <option value="online">
              Online
            </option>

          </select>

          {/* =================================================
              ONLINE APPOINTMENT
          ================================================= */}

          {form.source === "online" && (
            <>
              <label>
                Online Appointment
              </label>

              {loadingAppointments ? (
                <p className="muted">
                  Loading appointments...
                </p>
              ) : appointments.length === 0 ? (
                <p className="muted">
                  No online appointments
                  available for today.
                </p>
              ) : (
                <select
                  required
                  value={appointmentId}
                  onChange={
                    handleAppointmentChange
                  }
                >

                  <option value="">
                    Select appointment
                  </option>

                  {appointments.map(
                    (appointment) => {

                      const doctorName =
                        appointment
                          .doctorId
                          ?.doctorName ||
                        "Doctor";

                      return (
                        <option
                          key={
                            appointment._id
                          }
                          value={
                            appointment._id
                          }
                        >
                          {appointment.patientName}
                          {" — "}
                          {doctorName}
                          {" — "}
                          {appointment.startTime ||
                            appointment.fromTime ||
                            ""}
                        </option>
                      );
                    }
                  )}

                </select>
              )}

              {/* =========================================
                  SELECTED APPOINTMENT DETAILS
              ========================================= */}

              {appointmentId && (
                <div
                  className="alert success"
                  style={{
                    marginTop: "12px",
                  }}
                >

                  <strong>
                    Appointment selected
                  </strong>

                  <br />

                  Patient:{" "}
                  {form.patientName}

                  <br />

                  Phone:{" "}
                  {form.phoneNumber}

                  <br />

                  Reason:{" "}
                  {form.reason}

                </div>
              )}
            </>
          )}

          {/* =================================================
              DOCTOR
          ================================================= */}

          <label>
            Doctor
          </label>

          <select
            required
            value={form.doctorId}
            disabled={
              form.source === "online"
            }
            onChange={(e) =>
              setForm({
                ...form,
                doctorId:
                  e.target.value,
              })
            }
          >

            <option value="">
              Select doctor
            </option>

            {doctors.map((doctor) => (
              <option
                key={doctor._id}
                value={doctor._id}
              >
                {doctor.doctorName}
                {" — "}
                {doctor.specialization ||
                  "General"}
              </option>
            ))}

          </select>

          {/* =================================================
              WALK-IN FIELDS
          ================================================= */}

          {form.source === "walk_in" && (
            <>
              {/* PATIENT NAME */}

              <label>
                Patient name
              </label>

              <input
                required
                value={
                  form.patientName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    patientName:
                      e.target.value,
                  })
                }
                placeholder="Enter patient name"
              />

              {/* PHONE */}

              <label>
                Phone
              </label>

              <input
                value={
                  form.phoneNumber
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    phoneNumber:
                      e.target.value,
                  })
                }
                placeholder="Enter phone number"
              />

              {/* REASON */}

              <label>
                Reason
              </label>

              <input
                value={form.reason}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reason:
                      e.target.value,
                  })
                }
                placeholder="Reason for visit"
              />
            </>
          )}

          {/* =================================================
              ONLINE INFORMATION
          ================================================= */}

          {form.source === "online" &&
            appointmentId && (
              <>

                <label>
                  Patient Name
                </label>

                <input
                  value={
                    form.patientName
                  }
                  disabled
                />

                <label>
                  Phone
                </label>

                <input
                  value={
                    form.phoneNumber
                  }
                  disabled
                />

                <label>
                  Reason
                </label>

                <input
                  value={form.reason}
                  disabled
                />

              </>
            )}

          {/* =================================================
              ERROR
          ================================================= */}

          <ErrorMessage
            message={error}
          />

          {/* =================================================
              SUCCESS
          ================================================= */}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            className="primary"
            type="submit"
            disabled={
              loading ||
              (
                form.source === "online" &&
                !appointmentId
              )
            }
          >

            {loading
              ? "Processing..."
              : form.source === "online"
              ? "Check In & Generate Token"
              : "Generate Token"}

          </button>

        </form>

        {/* =================================================
            TODAY'S TOKENS
        ================================================= */}

        <div className="card">

          <h2>
            Today's Tokens
          </h2>

          <div className="token-list">

            {today.length === 0 ? (

              <p className="muted">
                No tokens yet.
              </p>

            ) : (

              today.map((token) => (

                <div
                  className="token-row"
                  key={token._id}
                >

                  <strong>
                    #{token.tokenNumber}
                  </strong>

                  <span>
                    {token.patientName}
                  </span>

                  <span>
                    {formatStatus(
                      token.status
                    )}
                  </span>

                  <small>
                    {token.source ===
                    "online"
                      ? "Online"
                      : "Walk-in"}
                  </small>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </section>
  );
}