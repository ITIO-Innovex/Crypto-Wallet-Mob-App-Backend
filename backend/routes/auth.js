const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendOtp = require('../utils/sendotp');
const User = require('../models/user');

// In-memory store for OTPs (for production use Redis or DB)
const otpStore = new Map();

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ========== SIGN UP ==========
router.post('/signup', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const user = new User({ email, phoneNumber, password }); // password hashed in pre('save')
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ message: 'User created successfully', token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== FORGOT PASSWORD (Send OTP) ==========
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email not found' });

    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // valid for 10 minutes

    const sent = await sendOtp(email, otp);
    if (!sent) return res.status(500).json({ error: 'Failed to send OTP' });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== VERIFY OTP ==========
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ error: 'OTP not found. Please request again.' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired. Please request again.' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  res.status(200).json({ message: 'OTP verified' });
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ error: 'OTP session expired. Try again.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    user.password = newPassword; // ✅ plain password
    await user.save(); // ✅ let .pre('save') hash it

    otpStore.delete(email); // Clear OTP after successful reset

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;
