
import React, { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReceptionPage from "./pages/ReceptionPage";
import DoctorPage from "./pages/DoctorPage";
import AdminPage from "./pages/AdminPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import LobbyPage from "./pages/LobbyPage";

import Navbar from "./components/Navbar";

import "./styles.css";

// const API_BASE = "http://localhost:5000/api";
const API_BASE=import.meta.env.VITE_API_URL
export default function App() {
  // =========================
  // USER
  // =========================

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  // =========================
  // AUTH / PUBLIC MODE
  // =========================

  const [auth, setAuth] = useState("login");

  const [page, setPage] = useState(() =>
    user ? "reception" : "public"
  );

  // =========================
  // HOSPITAL
  // =========================

  const [hospital, setHospital] = useState(null);
  const [hospitalLoading, setHospitalLoading] = useState(false);

  // =========================
  // GET LOGGED-IN USER HOSPITAL
  // =========================

  useEffect(() => {
    if (!user?.hospitalId) {
      setHospital(null);
      return;
    }

    const fetchHospital = async () => {
      try {
        setHospitalLoading(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE}/hospitals/me`,
          {
            headers: {
              "Content-Type": "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load hospital"
          );
        }

        setHospital(data.hospital);
      } catch (error) {
        console.error(
          "Hospital loading error:",
          error
        );

        setHospital(null);
      } finally {
        setHospitalLoading(false);
      }
    };

    fetchHospital();
  }, [user]);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    // After login go to appropriate page
    if (loggedInUser.role === "doctor") {
      setPage("doctor");
    } else if (
      loggedInUser.role === "admin"
    ) {
      setPage("admin");
    } else {
      setPage("reception");
    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = (registeredUser) => {
    localStorage.setItem(
      "user",
      JSON.stringify(registeredUser)
    );

    setUser(registeredUser);

    setPage("reception");
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setHospital(null);
    setUser(null);

    // After logout show public booking
    setPage("public");
    setAuth("login");
  };

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!user) {
    // -----------------------------------------
    // PUBLIC BOOKING
    // -----------------------------------------

    if (page === "public") {
      return (
        <>
          <div className="public-topbar">
            <div className="public-logo">
              🏥 PulseQ
            </div>

            <div className="public-actions">
              <button
                onClick={() => {
                  setPage("login");
                  setAuth("login");
                }}
              >
                Login
              </button>

              <button
                onClick={() => {
                  setPage("login");
                  setAuth("register");
                }}
              >
                Register
              </button>
            </div>
          </div>

          <main>
            <PublicBookingPage />
          </main>
        </>
      );
    }

    // -----------------------------------------
    // LOGIN / REGISTER
    // -----------------------------------------

    return (
      <>
        {auth === "login" ? (
          <LoginPage
            onLogin={handleLogin}
            onRegister={() => {
              setAuth("register");
              setPage("login");
            }}
          />
        ) : (
          <RegisterPage
            onLogin={handleRegister}
            onBack={() => {
              setAuth("login");
              setPage("login");
            }}
          />
        )}

        {/* PUBLIC BOOKING LINK */}

        <div className="public-booking-link">
          <span>
            Want to book an appointment?
          </span>

          <button
            onClick={() => {
              setPage("public");
              setAuth("login");
            }}
          >
            Book Appointment as Patient
          </button>
        </div>
      </>
    );
  }

  // =====================================================
  // LOGGED-IN USER
  // =====================================================

  const content = {
    reception: (
      <ReceptionPage user={user} />
    ),

    doctor: (
      <DoctorPage user={user} />
    ),

    lobby: (
      <LobbyPage user={user} />
    ),

    public: (
      <PublicBookingPage />
    ),

    admin: (
      <AdminPage user={user} />
    ),
  };

  // =====================================================
  // MAIN APPLICATION
  // =====================================================

  return (
    <>
      <Navbar
        user={user}
        page={page}
        setPage={setPage}
        onLogout={logout}
      />

      <main>

        {/* =========================
            WELCOME
        ========================= */}

        <div className="welcome">

          <div>
            Welcome,{" "}
            <b>{user.name}</b>

            <span>
              {user.role}
            </span>
          </div>

          <div className="hospital-name">
            🏥{" "}

            {hospitalLoading
              ? "Loading hospital..."
              : hospital?.hospitalName ||
                "Hospital"}
          </div>

        </div>

        {/* =========================
            PAGE
        ========================= */}

        {content[page]}

      </main>
    </>
  );
}