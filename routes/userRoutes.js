const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const { generateToken, jwtAuthMiddleware } = require("../jwt.js");

//post route to add user

router.post("/signup", async (req, res) => {
  try {
    const data = req.body;

    // Check if there is already an admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (data.role === "admin" && adminUser) {
      return res.json({ statusCode: 401, error: "Admin user already exists" });
    }

    const newUser = new User(data);

    const response = await newUser.save();
    console.log("new user saved!");

    const payLoad = {
      id: response.id,
    };

    console.log(JSON.stringify(payLoad));

    const token = generateToken(payLoad);
    console.log("token is : ", token);

    res.json({ statusCode: 200, response: response, token: token });
  } catch (error) {
    console.log(error);
    res.json({ statusCode: 500, error: "Internal server error" });
  }
});

//login route

router.post("/login", async (req, res) => {
  try {
    let { aadharCardNumber, password } = req.body;

    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    if (!user || !(await user.comparePassword(password))) {
      return res.json({
        stausCode: 401,
        error: "Invalid aadharnumber and password",
      });
    }

    const payLoad = {
      id: user.id,
    };

    const token = generateToken(payLoad);

    res.status(200).json({ stausCode: 200, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ stausCode: 500, error: "Internal server error" });
  }
});

//Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    console.log("user data: ", userData);

    const userId = userData.id;
    const user = await User.findById(userId);

    res.status(200).json({ statusCode: 200, userData: user });
  } catch (error) {
    console.log(error);
    res.json({ stausCode: 500, error: "Internal server error" });
  }
});

//reset password route
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; //extract id from token

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!(await user.comparePassword(currentPassword))) {
      return res
        .status(401)
        .json({ statusCode: 401, error: "Invalid password" });
    }

    user.password = newPassword;
    await user.save();

    console.log("Password updated!");

    res.status(200).json({ statusCode: 200, message: "Password updated!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ statusCode: 500, error: "Internal server error" });
  }
});

//get all users
router.get("/", jwtAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find();

    res.json({ statusCode: 200, user: users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/checkAdmin", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res
        .status(400)
        .json({ statusCode: 400, error: "User ID is missing" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ statusCode: 404, error: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(200)
        .json({ statusCode: 200, message: "User has admin authority" });
    } else {
      return res.json({
        statusCode: 403,
        error: "User does not have admin authority",
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ statusCode: 500, error: "Internal server error" });
  }
});

router.get("/uniqueAadharNumber", async (req, res) => {
  try {
    const aadharCardNumber = req.query.aadharCardNumber;

    if (!aadharCardNumber) {
      return res.status(400).json({
        statusCode: 400,
        message: "Aadhar card number is required!.",
      });
    }

    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    if (user) {
      return res.status(200).json({
        statusCode: 200,
        message: "Aadhar card number is not unique!",
      });
    } else {
      // Aadhar card number is unique
      return res.json({
        statusCode: 403,
        message: "Aadhar card number is unique!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      error: "Internal server error",
    });
  }
});

module.exports = router;
