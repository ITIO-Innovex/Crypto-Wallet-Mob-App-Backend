require('dotenv').config();
const nodemailer = require('nodemailer');

const sendOtp = async (email, otp) => {
  // Create transporter using SMTP details from .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_MAIL_HOST,
    port: Number(process.env.SMTP_MAIL_PORT),
    secure: process.env.SMTP_MAIL_ENCRYPTION === 'ssl', // true for 465
    auth: {
      user: process.env.SMTP_MAIL_USER,
      pass: process.env.SMTP_MAIL_PASSWORD,
    },
  });

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Password Reset OTP</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 8px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color:#000000;padding:20px;text-align:center;">
                <h1 style="color:#ffffff;font-size:24px;margin:0;">CoinCraze Password Reset</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 20px;text-align:center;">
                <h2 style="color:#000000;font-size:20px;margin-bottom:20px;">Your Password Reset OTP</h2>
                <p style="color:#333333;font-size:16px;line-height:1.5;margin-bottom:20px;">
                  Please use the following OTP to reset your CoinCraze account password. This code is valid for the next 10 minutes.
                </p>
                <div style="background-color:#e0e0e0;display:inline-block;padding:15px 30px;border-radius:6px;font-size:24px;font-weight:bold;color:#000000;letter-spacing:2px;">
                  ${otp}
                </div>
                <p style="color:#333333;font-size:14px;line-height:1.5;margin-top:20px;">
                  If you didn’t request a password reset, please ignore this email or contact our support team.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f5f5f5;padding:20px;text-align:center;">
                <p style="color:#333333;font-size:12px;margin:0;">
                  &copy; 2025 CoinCraze. All rights reserved.
                </p>
                <p style="color:#333333;font-size:12px;margin-top:10px;">
                  <a href="#" style="color:#000000;text-decoration:none;">Contact Us</a> | 
                  <a href="#" style="color:#000000;text-decoration:none;">Privacy Policy</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"CoinCraze" <${process.env.SMTP_MAIL_USER}>`,
    to: email,
    subject: 'Your CoinCraze Password Reset OTP',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP ${otp} sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    return false;
  }
};

module.exports = sendOtp;
