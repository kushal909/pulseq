const emitQueueUpdate = (req, event, payload) => {
  const io = req.app.get("io");

  if (!io) {
    console.log("❌ Socket.IO instance not found");
    return;
  }

  const hospitalId =
    req.user?.hospitalId ||
    payload?.hospitalId;

  if (!hospitalId) {
    console.log("❌ hospitalId missing");
    return;
  }

  const room = `clinic:${hospitalId}`;

  console.log("📡 EMITTING QUEUE UPDATE");
  console.log("ROOM:", room);
  console.log("EVENT:", event);

  io.to(room).emit(
    "queue:update",
    {
      type: event,
      payload,
    }
  );
};

module.exports = emitQueueUpdate;