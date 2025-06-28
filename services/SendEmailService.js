const nodemailer = require("nodemailer");
const { User } = require("../models");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(
  userId,
  sessionName,
  testDetails,
  nextSteps,
  contactInfo
) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return { status: 404, message: "User not found" };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Test Submission Confirmation – ${sessionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #333;">Hello ${user.firstName} ${
        user.lastName
      },</h2>
          <p>We are pleased to confirm the successful submission of your test for the session: <strong>${sessionName}</strong>.</p>
          <h3>Test Details:</h3>
          <p>${testDetails}</p>
          ${nextSteps ? `<h3>Next Steps:</h3><p>${nextSteps}</p>` : ""}
          <div style="background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeeba; border-radius: 4px; margin: 15px 0;">
            <strong>Important Notice:</strong>
            <p>Your audio content will be automatically deleted after 7 days. Please ensure to backup your content for answer verification purposes.</p>
          </div>
          <h3>Contact Information:</h3>
          <p>${contactInfo}</p>
          <p>Thank you for your participation!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { status: 200, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

const sendMailWithAttachment = async ({
  to,
  studentName,
  sessionName,
  htmlContent,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: `🎓 Score Report – ${sessionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4A90E2;">Hello ${studentName},</h2>
          <p>We are pleased to share your report for the session: <strong>${sessionName}</strong>.</p>

          <p>Please find your detailed report attached in PDF format. This includes your performance in each section and personalized comments from our instructors.</p>
          <div>${htmlContent}</div>
          <p style="margin-top: 30px;">Best regards,<br/>The Academic Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Email sending failed");
  }
};

module.exports = {
  sendEmail,
  sendMailWithAttachment,
};
