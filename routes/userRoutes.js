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
      return res.status(400).json({ error: "Admin user already exists" });
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

    res.status(200).json({ response: response, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//login route

router.post("/login", async (req, res) => {
  try {
    let { aadharCardNumber, password } = req.body;

    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ error: "Invalid aadharnumber and password" });
    }

    const payLoad = {
      id: response.id,
    };

    const token = generateToken(payLoad);

    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    console.log("user data: ", userData);

    const userId = userData.id;
    const user = await User.findById(userId);

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//reset password route
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user; //extract id from token

    const { currentPassword, newPassword } = req.body;

    const user = User.findById(userId);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid password" });
    }

    user.password = newPassword;
    await user.save();

    console.log("Password updated!");

    res.status(200).json({ message: "Password updated!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
