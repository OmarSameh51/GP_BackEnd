const { cleanupOrphanGuests } = require("../services/publicService");

let intervalHandle = null;

const startGuestCleanupJob = (intervalMs = 30 * 60 * 1000) => {
  if (intervalHandle) return;

  cleanupOrphanGuests().catch((err) =>
    console.error("Guest cleanup job failed on start:", err.message),
  );

  intervalHandle = setInterval(() => {
    cleanupOrphanGuests()
      .then((result) => {
        if (result.deletedCount > 0) {
          console.log(
            `Guest cleanup: removed ${result.deletedCount} orphan guest node(s)`,
          );
        }
      })
      .catch((err) =>
        console.error("Guest cleanup job failed:", err.message),
      );
  }, intervalMs);
};

const stopGuestCleanupJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = {
  startGuestCleanupJob,
  stopGuestCleanupJob,
};
