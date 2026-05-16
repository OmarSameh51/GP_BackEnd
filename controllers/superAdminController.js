const User = require("../models/User");
const bcrypt = require("bcrypt");

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, phoneNumber } =
      req.body;

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create admin
    const admin = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "admin",
    });

    await admin.save();

    res.status(201).json({
      msg: "Admin created successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] },
    }).select("-password");

    res.json({
      count: admins.length,
      admins,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const deleteAdmin = async (req, res) => {
  try {
    const { username } = req.params;

    // prevent self deletion
    if (req.user.username === username) {
      return res.status(400).json({
        msg: "You cannot delete yourself",
      });
    }

    // find admin
    const admin = await User.findOne({
      username,
    });

    if (!admin) {
      return res.status(404).json({
        msg: "Admin not found",
      });
    }

    // prevent deleting super admin
    if (admin.role === "super_admin") {
      return res.status(403).json({
        msg: "Cannot delete super admin",
      });
    }

    // ensure only admin role gets deleted
    if (admin.role !== "admin") {
      return res.status(404).json({
        msg: "Admin not found",
      });
    }

    await User.deleteOne({
      username,
    });

    res.json({
      msg: "Admin deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const editAdmin = async (req, res) => {
  try {
    const { username } = req.params;
    const { username: newUsername, phoneNumber } = req.body;

    // prevent self edit
    if (req.user.username === username) {
      return res.status(400).json({
        msg: "You cannot edit yourself",
      });
    }

    // find admin
    const admin = await User.findOne({
      username,
    });

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({
        msg: "Admin not found",
      });
    }

    // prevent editing super admin
    if (admin.role === "super_admin") {
      return res.status(403).json({
        msg: "Cannot edit super admin",
      });
    }

    // check username uniqueness
    if (newUsername && newUsername !== admin.username) {
      const usernameExists = await User.findOne({
        username: newUsername,
      });

      if (usernameExists) {
        return res.status(400).json({
          msg: "Username already exists",
        });
      }

      admin.username = newUsername;
    }

    // update phone
    if (phoneNumber) {
      admin.phoneNumber = phoneNumber;
    }

    await admin.save();

    res.json({
      msg: "Admin updated successfully",
      admin: {
        username: admin.username,
        phoneNumber: admin.phoneNumber,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
module.exports = {
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  editAdmin,
};
