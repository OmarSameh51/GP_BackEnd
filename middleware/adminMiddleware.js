const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({
      msg: "Access denied. Admin only",
    });
  }

  next();
};

module.exports = adminOnly;
