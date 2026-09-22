const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Hospital = require("../models/Hospital");

// Generate JWT
const sign = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// Safe user response
const safe = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    hospitalId: user.hospitalId,
  };
};

// ==========================================
// REGISTER
// ==========================================

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "receptionist",
      hospitalId,
      hospitalName,
      address,
    } = req.body;


    // console.log("hospitalId",req.body)

    // 1. Validate common fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // 2. Validate role
    if (!["admin", "receptionist"].includes(role)) {
      return res.status(400).json({
        message:
          "Only admin or receptionist registration is allowed",
      });
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    let finalHospitalId = hospitalId;

    // ==========================================
    // ADMIN REGISTRATION
    // ==========================================

    if (role === "admin") {
      if (!hospitalName) {
        return res.status(400).json({
          message: "Hospital name is required for admin registration",
        });
      }

      // Create hospital
      const hospital = await Hospital.create({
        hospitalName,
        address,
      });

      // Use newly created hospital ID
      finalHospitalId = hospital._id;
    }

    // ==========================================
    // RECEPTIONIST REGISTRATION
    // ==========================================

    if (role === "receptionist") {
      if (!hospitalId) {
        return res.status(400).json({
          message: "Hospital ID is required for receptionist registration",
        });
      }

      // Check hospital exists and is active
      const hospitalExists = await Hospital.exists({
        _id: hospitalId,
        isActive: true,
      });
      
      if (!hospitalExists) {
        return res.status(400).json({
          message:
            "Valid hospitalId is required for receptionist registration",
        });
      }
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const passwordHash = await bcrypt.hash(password, 10);

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      hospitalId: finalHospitalId,
    });

    // ==========================================
    // GENERATE TOKEN
    // ==========================================

    const token = sign(user._id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: safe(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // 1. Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Generate token
    const token = sign(user._id);

    // 5. Return response
    return res.json({
      message: "Login successful",
      token,
      user: safe(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};