const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const app = express();
const db = require("./db.js");
const cors = require("cors");
const axios = require("axios");
// const nodemailer = require("nodemailer");

require("dotenv").config();
const bodyParser = require("body-parser");

// Configure CORS to allow requests from your Angular app
app.use(
  cors({
    origin: "http://localhost:4200", // Allow only your Angular app
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// app.use(cors({ origin: "http://localhost:4200" }));

app.use(bodyParser.json());
const port = process.env.PORT || 8000;

//Import the router files
const userRoutes = require("./routes/userRoutes.js");
const candidateRoutes = require("./routes/candidateRoutes.js");

//use the routers
app.use("/user", userRoutes);
app.use("/candidate", candidateRoutes);

// app.post("/sendEmail", (req, res) => {
//   let { mailReciver } = req.body;

//   if (!mailReciver) {
//     res.status(400).json({ message: "Please enter reciver mail" });
//   }
//   const otp = Math.floor(1000 + Math.random() * 9000);
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     secure: true,
//     port: 465,
//     auth: {
//       user: "devendrabhole3369@gmail.com",
//       pass: "wicharmjnaewbyvl",
//     },
//     tls: { rejectUnauthorized: true },
//   });

//   const reciver = {
//     from: "devendrabhole3369@gmail.com",
//     to: mailReciver,
//     subject: "OTP verification",
//     text: `Your One Time Password is ${otp}`,
//   };

//   transporter.sendMail(reciver, (error, info) => {
//     if (error) {
//       return res
//         .status(500)
//         .json({ message: "Failed to send OTP", error: error });
//     }
//     res.status(200).json({ message: "OTP sent successfully", data: otp });
//   });
// });

async function fetchData() {
  try {
    const response = await axios.get(
      "http://localhost:3000/candidate/vote/count"
    );
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }
}

//socket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:4200" },
});

io.on("connection", (socket) => {
  console.log("connected");

  const intervalId = setInterval(async () => {
    const data = await fetchData();
    if (data) {
      socket.emit("voteCount", { data });
    }
  }, 2000);

  socket.on("connectToServer", () => {
    console.log(`send by ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearInterval(intervalId);
  });
});

server.listen(port, () => {
  console.log(`server listening on ${port}`);
});

// app.listen(port, () => {
//   console.log(`server listening on ${port}`);
// });
