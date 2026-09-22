import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api";
import { socket } from "../socket";

import "./lobby.css";

// =====================================================
// WAITING TIME
// =====================================================

const getWaitingTime = (
  createdAt,
  currentTime
) => {
  if (!createdAt) return "—";

  const created = new Date(createdAt);

  const diffMs =
    currentTime.getTime() -
    created.getTime();

  const diffMinutes = Math.max(
    0,
    Math.floor(
      diffMs / (1000 * 60)
    )
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(
    diffMinutes / 60
  );

  const minutes =
    diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

// =====================================================
// LOBBY PAGE
// =====================================================

export default function LobbyPage({
  user,
}) {
  // ===================================================
  // STATE
  // ===================================================

  const [tokens, setTokens] = useState([]);

  const [hospital, setHospital] =
    useState(null);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  // ===================================================
  // GET HOSPITAL ID
  // ===================================================

  const hospitalId =
    user?.hospitalId ||
    JSON.parse(
      localStorage.getItem("user") ||
        "null"
    )?.hospitalId;

  // ===================================================
  // LOAD HOSPITAL
  // ===================================================

  const loadHospital = async () => {
    if (!hospitalId) {
      console.error(
        "❌ Hospital ID not available"
      );

      return;
    }

    try {
      const data =
        await api.publicHospitals();

      const found =
        (data.hospitals || []).find(
          (h) =>
            String(h._id) ===
            String(hospitalId)
        );

      setHospital(found || null);

      console.log(
        "🏥 LOBBY HOSPITAL:",
        found
      );
    } catch (error) {
      console.error(
        "❌ Failed to load hospital:",
        error
      );
    }
  };

  // ===================================================
  // LOAD QUEUE
  // ===================================================

  const loadQueue = async () => {
    if (!hospitalId) {
      console.error(
        "❌ Cannot load queue: hospitalId missing"
      );

      return;
    }

    try {
      const data =
        await api.publicQueue(
          hospitalId
        );

      console.log(
        "📋 LOBBY QUEUE:",
        data
      );

      setTokens(
        data.tokens || []
      );
    } catch (error) {
      console.error(
        "❌ Failed to load queue:",
        error
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!hospitalId) {
      console.log(
        "❌ Lobby: hospitalId missing"
      );

      return;
    }

    loadHospital();
    loadQueue();
  }, [hospitalId]);

  // ===================================================
  // SOCKET.IO
  // ===================================================

  useEffect(() => {
    if (!hospitalId) {
      console.log(
        "❌ Socket: hospitalId missing"
      );

      return;
    }

    console.log(
      "================================="
    );

    console.log(
      "🔌 LOBBY SOCKET SETUP"
    );

    console.log(
      "🏥 HOSPITAL ID:",
      hospitalId
    );

    console.log(
      "================================="
    );

    // ================================================
    // CONNECT
    // ================================================

    const handleConnect = () => {
      console.log(
        "================================="
      );

      console.log(
        "✅ LOBBY SOCKET CONNECTED"
      );

      console.log(
        "🔌 SOCKET ID:",
        socket.id
      );

      console.log(
        "🏥 JOINING ROOM:",
        `clinic:${hospitalId}`
      );

      console.log(
        "================================="
      );

      // IMPORTANT:
      // Backend expects "joinClinic"
      socket.emit(
        "joinClinic",
        hospitalId
      );
    };

    // ================================================
    // QUEUE UPDATE
    // ================================================

    const handleQueueUpdate = (
      data
    ) => {
      console.log(
        "================================="
      );

      console.log(
        "🔔 LOBBY QUEUE UPDATE RECEIVED"
      );

      console.log(
        "DATA:",
        data
      );

      console.log(
        "================================="
      );

      // Get latest queue from backend
      loadQueue();
    };

    // ================================================
    // DISCONNECT
    // ================================================

    const handleDisconnect = (
      reason
    ) => {
      console.log(
        "❌ LOBBY SOCKET DISCONNECTED:",
        reason
      );
    };

    // ================================================
    // CONNECTION ERROR
    // ================================================

    const handleConnectError = (
      error
    ) => {
      console.error(
        "❌ LOBBY SOCKET CONNECTION ERROR:",
        error
      );
    };

    // ================================================
    // REGISTER EVENTS
    // ================================================

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "queue:update",
      handleQueueUpdate
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    // ================================================
    // CONNECT SOCKET
    // ================================================

    if (!socket.connected) {
      console.log(
        "🔌 CONNECTING LOBBY SOCKET..."
      );

      socket.connect();
    } else {
      // Already connected
      handleConnect();
    }

    // ================================================
    // CLEANUP
    // ================================================

    return () => {
      console.log(
        "🧹 CLEANING LOBBY SOCKET"
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "queue:update",
        handleQueueUpdate
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );
    };
  }, [hospitalId]);

  // ===================================================
  // UPDATE WAITING TIME
  // ===================================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ===================================================
  // GROUP TOKENS BY DOCTOR
  // ===================================================

  const doctors = useMemo(() => {
    const map = new Map();

    tokens.forEach((token) => {
      const doctorId =
        token.doctorId?._id ||
        token.doctorId;

      if (!doctorId) {
        return;
      }

      const doctorKey =
        String(doctorId);

      if (!map.has(doctorKey)) {
        map.set(
          doctorKey,
          {
            doctorId: doctorKey,

            doctorName:
              token.doctorId
                ?.doctorName ||
              "Doctor",

            specialization:
              token.doctorId
                ?.specialization ||
              "",

            tokens: [],
          }
        );
      }

      map
        .get(doctorKey)
        .tokens
        .push(token);
    });

    return Array.from(
      map.values()
    );
  }, [tokens]);

  // ===================================================
  // UI
  // ===================================================

  return (
    <section className="lobby-tv">

      {/* =========================================
          HEADER
      ========================================= */}

      <header className="lobby-header">

        <div>
          <div className="lobby-brand">
            <span className="lobby-dot" />
            PulseQ
          </div>

          <h1>
            {hospital?.hospitalName ||
              "Hospital Queue"}
          </h1>
        </div>

        <div className="live-status">
          <span className="live-dot" />
          LIVE
        </div>

      </header>

      {/* =========================================
          TABLE HEADER
      ========================================= */}

      <div className="queue-header">

        <div>
          DOCTOR
        </div>

        <div>
          CLIENTS
        </div>

        <div>
          NOW SERVING
        </div>

      </div>

      {/* =========================================
          DOCTORS
      ========================================= */}

      <div className="doctor-rows">

        {doctors.map(
          (doctor) => {

            // =====================================
            // ACTIVE / SERVING
            // =====================================

            const active =
              doctor.tokens
                .filter(
                  (token) =>
                    [
                      "called",
                      "in_consultation",
                    ].includes(
                      token.status
                    )
                )
                .sort(
                  (a, b) =>
                    new Date(
                      b.updatedAt ||
                        b.createdAt
                    ) -
                    new Date(
                      a.updatedAt ||
                        a.createdAt
                    )
                );

            // =====================================
            // WAITING
            // =====================================

            const waiting =
              doctor.tokens
                .filter(
                  (token) =>
                    token.status ===
                    "waiting"
                )
                .sort(
                  (a, b) =>
                    a.tokenNumber -
                    b.tokenNumber
                );

            // =====================================
            // CURRENT PATIENT
            // =====================================

            const serving =
              active[0];

            return (
              <div
                className="doctor-row"
                key={doctor.doctorId}
              >

                {/* ==================================
                    DOCTOR
                ================================== */}

                <div className="doctor-cell">

                  <div className="doctor-name">
                    {doctor.doctorName}
                  </div>

                  {doctor.specialization && (
                    <div className="doctor-specialization">
                      {
                        doctor.specialization
                      }
                    </div>
                  )}

                </div>

                {/* ==================================
                    CLIENTS
                ================================== */}

                <div className="clients-cell">

                  {waiting.length === 0 ? (
                    <span className="no-clients">
                      No clients waiting
                    </span>
                  ) : (
                    <div className="client-list">

                      {waiting.map(
                        (token) => (
                          <div
                            className="client"
                            key={
                              token._id
                            }
                          >

                            <span className="client-token">
                              #
                              {
                                token.tokenNumber
                              }
                            </span>

                            <span className="client-name">
                              {
                                token.patientName
                              }
                            </span>

                            <span className="client-time">
                              {getWaitingTime(
                                token.createdAt,
                                currentTime
                              )}
                            </span>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

                {/* ==================================
                    NOW SERVING
                ================================== */}

                <div className="serving-cell">

                  {serving ? (
                    <div className="serving">

                      <div className="serving-token">
                        #
                        {
                          serving.tokenNumber
                        }
                      </div>

                      <div>

                        <div className="serving-name">
                          {
                            serving.patientName
                          }
                        </div>

                        <div className="serving-status">

                          {serving.status ===
                          "called"
                            ? "Called"
                            : "In consultation"}

                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="not-serving">
                      —
                    </div>
                  )}

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* =========================================
          NO DOCTORS
      ========================================= */}

      {doctors.length === 0 && (
        <div className="empty-lobby">
          No active patients currently.
        </div>
      )}

    </section>
  );
}