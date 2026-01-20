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

// Helper: normalize phone number
const formatPhone = (phone) => {
  if (!phone.startsWith("+")) {
    return `+91${phone}`; // India default
  }
  return phone;
};

// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone required" });
    }

    phone = formatPhone(phone);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    res.json({ success: true, status: verification.status });
  } catch (err) {
    console.error("Twilio Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    let { phone, code } = req.body;

    phone = formatPhone(phone);

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (check.status === "approved") {
      return res.json({ success: true });
    }

    res.status(400).json({ success: false, message: "Invalid OTP" });
  } catch (err) {
    console.error("Verify Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`OTP Server run
