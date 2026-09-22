import React, {
  useEffect,
  useState,
} from "react";

import { api } from "../api";
import ErrorMessage from "../components/ErrorMessage";


export default function PublicBookingPage() {

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loadingDoctors, setLoadingDoctors] =
    useState(false);

  const [form, setForm] = useState({
    hospitalId: "",
    doctorId: "",
    patientName: "",
    phoneNumber: "",
    reason: "",
    scheduledAt: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  // =====================================================
  // LOAD HOSPITALS
  // =====================================================

  useEffect(() => {

    const loadHospitals = async () => {

      try {

        const data =
          await api.publicHospitals();

        setHospitals(
          data.hospitals || []
        );

      } catch (error) {

        setError(error.message);

      }
    };

    loadHospitals();

  }, []);


  // =====================================================
  // LOAD DOCTORS WHEN HOSPITAL CHANGES
  // =====================================================

  useEffect(() => {

    const loadDoctors = async () => {

      // No hospital selected
      if (!form.hospitalId) {

        setDoctors([]);

        return;
      }


      try {

        setLoadingDoctors(true);
        setError("");

        console.log(
          "Loading doctors for hospital:",
          form.hospitalId
        );

        const data =
          await api.publicDoctors(
            form.hospitalId
          );

        console.log(
          "DOCTORS RESPONSE:",
          data
        );

        setDoctors(
          data.doctors || []
        );

      } catch (error) {

        console.error(
          "GET DOCTORS ERROR:",
          error
        );

        setDoctors([]);
        setError(error.message);

      } finally {

        setLoadingDoctors(false);

      }
    };

    loadDoctors();

  }, [form.hospitalId]);


  // =====================================================
  // HANDLE HOSPITAL CHANGE
  // =====================================================

  const handleHospitalChange = (e) => {

    const hospitalId =
      e.target.value;

    // Important:
    // Reset doctor when hospital changes

    setForm((prev) => ({
      ...prev,

      hospitalId,

      doctorId: "",
    }));

    // Immediately clear previous hospital's doctors

    setDoctors([]);

    setError("");
    setMessage("");
  };


  // =====================================================
  // HANDLE FORM CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const submit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");


    try {

      const data =
        await api.book(form);

      setMessage(
        `Appointment booked successfully. Reference: ${data.appointment._id}`
      );


      // Keep hospital and doctor selected,
      // clear patient-specific fields.

      setForm((prev) => ({
        ...prev,

        patientName: "",
        phoneNumber: "",
        reason: "",
        scheduledAt: "",
      }));

    } catch (error) {

      setError(
        error.message
      );

    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <section>

      <div className="page-title">

        <div>

          <h1>
            Public Appointment Booking
          </h1>

          <p>
            Book an appointment without
            signing in.
          </p>

        </div>

      </div>


      <form
        className="card form-card narrow"
        onSubmit={submit}
      >

        {/* ==========================================
            HOSPITAL
        ========================================== */}

        <label>
          Hospital
        </label>

        <select
          required
          name="hospitalId"
          value={form.hospitalId}
          onChange={
            handleHospitalChange
          }
        >

          <option value="">
            Select hospital
          </option>

          {hospitals.map(
            (hospital) => (

              <option
                key={hospital._id}
                value={hospital._id}
              >
                {hospital.hospitalName}
              </option>

            )
          )}

        </select>


        {/* ==========================================
            DOCTOR
        ========================================== */}

        <label>
          Doctor
        </label>

        <select
          required
          name="doctorId"
          value={form.doctorId}
          onChange={handleChange}
          disabled={
            !form.hospitalId ||
            loadingDoctors
          }
        >

          <option value="">

            {!form.hospitalId
              ? "Select hospital first"
              : loadingDoctors
              ? "Loading doctors..."
              : doctors.length === 0
              ? "No doctors available"
              : "Select doctor"}

          </option>


          {doctors.map(
            (doctor) => (

              <option
                key={doctor._id}
                value={doctor._id}
              >
                {doctor.doctorName}
                {" — "}
                {doctor.specialization}
              </option>

            )
          )}

        </select>


        {/* ==========================================
            PATIENT
        ========================================== */}

        <label>
          Patient name
        </label>

        <input
          required
          name="patientName"
          value={form.patientName}
          onChange={handleChange}
          placeholder="Enter patient name"
        />


        {/* ==========================================
            PHONE
        ========================================== */}

        <label>
          Phone
        </label>

        <input
          required
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number"
        />


        {/* ==========================================
            REASON
        ========================================== */}

        <label>
          Reason
        </label>

        <input
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Reason for visit"
        />


        {/* ==========================================
            APPOINTMENT TIME
        ========================================== */}

        <label>
          Appointment time
        </label>

        <input
          required
          type="datetime-local"
          name="scheduledAt"
          value={form.scheduledAt}
          onChange={handleChange}
        />


        {/* ==========================================
            MESSAGES
        ========================================== */}

        <ErrorMessage
          message={error}
        />


        {message && (

          <div className="alert success">
            {message}
          </div>

        )}


        {/* ==========================================
            SUBMIT
        ========================================== */}

        <button
          className="primary"
          disabled={
            !form.hospitalId ||
            !form.doctorId
          }
        >
          Book appointment
        </button>

      </form>

    </section>
  );
}