import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health check
app.get("/", (req, res) => {
  res.send("OTP Server is running");
});

// Phone formatter (India safe)
const formatPhone = (phone) => {
  phone = phone.trim();

  if (phone.startsWith("+")) {
    return phone;
  }

  return `+91${phone}`;
};

// =======================
// SEND OTP
// =======================
app.post("/send-otp", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone required",
      });
    }

    phone = formatPhone(phone);
    console.log("SEND OTP PHONE =", phone);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({
      success: true,
      status: verification.status,
    });
  } catch (err) {
    console.error("Twilio SEND Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================
// VERIFY OTP
// =======================
app.post("/verify-otp", async (req, res) => {
  try {
    let { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP required",
      });
    }

    phone = formatPhone(phone);

    console.log("VERIFY OTP PHONE =", phone);
    console.log("VERIFY OTP CODE =", code);

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code: String(code),
      });

    console.log("VERIFY STATUS =", check.status);

    if (check.status === "approved") {
      return res.json({ success: true });
    }

    return res.status(400).js
