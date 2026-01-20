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

/**
 * SAFE phone formatter
 * - Adds +91 only once
 * - Works for send & verify
 */
const formatPhone = (phone) => {
  phone = phone.trim();

  if (phone.startsWith("+91")) {
    return phone;
  }

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

    // 🔍 DEBUG LOG
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

    // 🔍 DEBUG LOGS
    console.log("VERIFY OTP PHONE =", phone);
    console.log("VERIFY OTP CODE =", code);

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    console.log("VERIFY STATUS =", check.status);

    if (check.status === "approved") {
      return res.json({ success: true });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  } catch (err) {
    console.error("Twilio VERIFY Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================
// START SERVER (Render)
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OTP Server running on port ${PORT}`);
});
