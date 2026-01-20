import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health check
app.get("/", (req, res) => {
  res.send("OTP Server is running");
});

// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone required" });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({ success: true, status: verification.status });
  } catch (err) {
    console.error("Twilio Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    if (check.status === "approved") {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(` OTP Server running on http://0.0.0.0:${PORT}`);
});
