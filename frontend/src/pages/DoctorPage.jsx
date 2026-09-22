import React, { useEffect, useState } from "react";
import { api } from "../api";
import { socket } from "../socket";
import ErrorMessage from "../components/ErrorMessage";

const today = () => new Date().toISOString().slice(0, 10);

export default function DoctorPage({ user }) {

  console.log("user-",user)
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // =========================
  // LOAD DOCTORS
  // =========================
// const loadDoctors = async () => {
//   try {
//     const d = await api.doctors();

//     console.log("DOCTORS:", d.doctors);
//     console.log("USER:", user);

//     setDoctors(d.doctors);



//    let doctors = d.doctors
//    let uc = user

   

//    const index = doctors.findIndex(
//   (d) => d.doctorName?.trim() === user.name?.trim()
// );


// console.log("index-",index)
//    setDoctorId(index)
//    console.log("uc",uc,"doctors",doctors)
//   } catch (e) {
//     setError(e.message);
//   }
// };
const loadDoctors = async () => {
  try {
    const d = await api.doctors();

    console.log("DOCTORS:", d.doctors);
    console.log("USER:", user);

    const doctors = d.doctors;

    setDoctors(doctors);

    const index = doctors.findIndex(
      (doctor) =>
        doctor.doctorName?.trim() === user.name?.trim()
    );

    console.log("index-", index);

    if (index !== -1) {
      const selectedDoctor = doctors[index];

      setDoctorId(selectedDoctor._id);

      console.log(
        "Selected doctor:",
        selectedDoctor
      );
    } else {
      setError("Logged-in doctor not found");
    }

  } catch (e) {
    setError(e.message);
  }
};
  // =========================
  // REFRESH QUEUE
  // =========================

  const refresh = async () => {
    if (!doctorId) return;

    try {
      const d = await api.queue(
        doctorId,
        today()
      );

      setQueue(d.queue);
    } catch (e) {
      setError(e.message);
    }
  };

  // =========================
  // LOAD DOCTORS ON MOUNT
  // =========================

  useEffect(() => {
    loadDoctors();
console.log("inside useEffect",user)
    // setDoctors([...user])
  }, []);

  // =========================
  // SOCKET + QUEUE
  // =========================

  useEffect(() => {
    if (!doctorId) return;

    socket.emit(
      "join-hospital",
      user.hospitalId
    );

    refresh();

    const fn = () => refresh();

    socket.on(
      "queue:update",
      fn
    );

    return () => {
      socket.off(
        "queue:update",
        fn
      );
    };
  }, [doctorId, user.hospitalId]);

  // =========================
  // COMMON ACTION
  // =========================

  const action = async (fn) => {
    setBusy(true);
    setError("");

    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // =========================
  // CURRENT PATIENT
  // =========================

  const current = queue.find((t) =>
    ["called", "in_consultation"].includes(
      t.status
    )
  );

  // =========================
  // SELECTED DOCTOR
  // =========================

  const selected = doctors.find(
    (d) => d._id === doctorId
  );

  // =========================
  // WAITING PATIENTS
  // =========================

  const waitingPatients = queue.filter(
    (t) => t.status === "waiting"
  );

  // =========================
  // UI
  // =========================

  return (
    <section> 

      {/* PAGE TITLE */}

      <div className="page-title">
        <div>
          <h1>Doctor Console</h1>
          <p>
            Manage your live patient queue.
          </p>
        </div>

        <span className="role-pill">
          Doctor
        </span>
      </div>

      {/* MAIN CARD */}

      <div className="card">

        {/* DOCTOR TOOLBAR */}

        <div className="toolbar">

          <div>
            <label>Doctor</label>
            <select
  // disabled={user.role === "doctor"}
   value={doctorId}
  onChange={(e) => setDoctorId(e.target.value)}
>
  {doctors.map((d) => (
    <option key={d._id} value={d._id}>
      {d.doctorName}
    </option>
  ))}
</select>

            {/* <select
              disabled={user.role === "doctor"}
              value={doctorId}
              onChange={(e) =>
                setDoctorId(e.target.value)
              }
            >
              dd{JSON.stringify(doctors)}
              {doctors.map((d) => (
                <option
                  key={d._id}
                  value={d._id}
                >
                  {d.doctorName}
                </option>
              ))}
            </select> */}
          </div>

          <div className="doctor-status">
            Status:{" "}
            <b>
              {selected?.status || "—"}
            </b>
          </div>

        </div>

        {/* ERROR */}

        <ErrorMessage message={error} />

        {/* CURRENT PATIENT */}

        {current ? (
          <div className="current-card">

            <div className="current-token">
              {current.tokenNumber}
            </div>

            <div>
              <span className="eyebrow">
                CURRENT PATIENT
              </span>

              <h2>
                {current.patientName}
              </h2>

              <p>
                {current.reason ||
                  "No reason provided"}{" "}
                ·{" "}
                {current.status.replaceAll(
                  "_",
                  " "
                )}
              </p>
            </div>

            <div className="actions">

              {current.status === "called" && (
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    action(() =>
                      api.start(doctorId)
                    )
                  }
                >
                  Start consultation
                </button>
              )}

              {current.status ===
                "in_consultation" && (
                <>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api.complete(doctorId)
                      )
                    }
                  >
                    Complete
                  </button>

                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api.skip(doctorId)
                      )
                    }
                  >
                    Skip
                  </button>
                </>
              )}

            </div>
          </div>
        ) : (

          /* NO ACTIVE PATIENT */

          <div className="empty-current">

            <h2>
              No active patient
            </h2>

            <button
              className="primary"
              disabled={
                busy || !doctorId
              }
              onClick={() =>
                action(() =>
                  api.callNext(
                    doctorId,
                    today()
                  )
                )
              }
            >
              Call next patient
            </button>

          </div>
        )}

        {/* DOCTOR ACTIONS */}

        <div className="doctor-actions">

          <button
            disabled={busy}
            onClick={() =>
              action(() =>
                api.break(doctorId)
              )
            }
          >
            Take break
          </button>

          <button
            disabled={busy}
            onClick={() =>
              action(() =>
                api.resume(doctorId)
              )
            }
          >
            Resume
          </button>

        </div>

        {/* WAITING QUEUE */}

        <h2>
          Waiting queue
        </h2>

        <div className="token-list">

          {waitingPatients.map((t) => (
            <div
              className="token-row"
              key={t._id}
            >
              <strong>
                #{t.tokenNumber}
              </strong>

              <span>
                {t.patientName}
              </span>

              <span>
                {t.reason || "—"}
              </span>

              <small>
                waiting
              </small>
            </div>
          ))}

          {waitingPatients.length === 0 && (
            <p className="muted">
              No patients waiting.
            </p>
          )}

        </div>

      </div>
    </section>
  );
}