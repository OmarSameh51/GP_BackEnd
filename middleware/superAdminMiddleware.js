const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      msg: "Access denied. Super admin only",
    });
  }

  next();
};

module.exports = superAdminOnly;
