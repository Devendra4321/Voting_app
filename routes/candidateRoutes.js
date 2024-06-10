const express = require("express");
const router = express.Router();

const Candidate = require("../models/candidate.js");
const { jwtAuthMiddleware } = require("../jwt.js");
const User = require("../models/user.js");

//check the role

const checkAdminRole = async (userId) => {
  try {
    const user = await User.findById(userId);

    return user.role === "admin";
  } catch (error) {
    return false;
  }
};

//post route to add candidate

router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }

    const data = req.body;

    const newCandidate = new Candidate(data);

    const response = await newCandidate.save();
    console.log("New candidate saved!");

    res.status(200).json({ response: response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//update route for candidate

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }

    const candidateID = req.params.candidateID;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found!" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//delete route for candidate

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }

    const candidateID = req.params.candidateID;

    const response = await Candidate.findByIdAndDelete(candidateID);

    if (!response) {
      return res.status(403).json({ error: "Candidate not found!" });
    }

    console.log("candidate deleted!");
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
