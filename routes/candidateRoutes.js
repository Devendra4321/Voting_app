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
      return res.json({ statuscode: 403, message: "User has no admin role" });
    }

    const data = req.body;

    const newCandidate = new Candidate(data);

    const response = await newCandidate.save();
    console.log("New candidate saved!");

    res.json({
      statuscode: 200,
      response: response,
      message: "Candidate Added!",
    });
  } catch (error) {
    console.log(error);
    res.json({ statuscode: 500, error: "Internal server error" });
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

//voting route

router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  //no admin can vote
  //user can vote onces

  const candidateID = req.params.candidateID;
  const userId = req.user.id;

  try {
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ statuscode: 404, message: "User not found!" });
    }

    if (user.isVoted) {
      return res.json({ statuscode: 400, message: "You have already voted!" });
    }

    if (user.role === "admin") {
      return res.json({
        statuscode: 403,
        message: "Admin is not allowed to voting!",
      });
    }

    //update candidate document to record the vote
    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();

    //update the user document
    user.isVoted = true;
    await user.save();

    res.json({ statuscode: 200, message: "Vote recorded successfully!" });
  } catch (error) {
    console.log(error);
    res.json({ statuscode: 500, error: "Internal server error" });
  }
});

// vote count

router.get("/vote/count", async (req, res) => {
  try {
    //find all candidate and sort the vote count in to decending order
    const candidate = await Candidate.find().sort({ voteCount: "desc" });

    //map the candidate and returns only name and votecount
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });

    return res.status(200).json(voteRecord);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get all candidates

router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find();

    return res.status(200).json({ statuscode: 200, candidates: candidates });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
