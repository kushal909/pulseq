module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(
      "SOCKET CONNECTED:",
      socket.id
    );

    socket.on(
      "joinClinic",
      (hospitalId) => {
        if (!hospitalId) {
          console.log(
            "hospitalId is missing"
          );
          return;
        }

        const room =
          `clinic:${hospitalId}`;

        socket.join(room);

        console.log(
          `Socket ${socket.id} joined ${room}`
        );
      }
    );

    socket.on(
      "joinReceptionist",
      (receptionistId) => {
        if (!receptionistId) {
          console.log(
            "receptionistId is missing"
          );
          return;
        }

        const room =
          `receptionist:${receptionistId}`;

        socket.join(room);

        console.log(
          `Socket ${socket.id} joined ${room}`
        );
      }
    );

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "SOCKET DISCONNECTED:",
          socket.id,
          reason
        );
      }
    );
  });
};