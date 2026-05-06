const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // 1) check token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2) no token
    if (!token) {
      return res.status(401).json({ msg: "No token, access denied" });
    }

    // 3) verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) get user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    // 5) attach user to request
    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({
      msg: "Not authorized",
      error: err.message,
    });
  }
};

module.exports = protect;
