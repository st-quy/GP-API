const SendEmailService = require("../services/SendEmailService");

const sendEmailSubmit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionName, testDetails, nextSteps, contactInfo } = req.body;

    const result = await SendEmailService.sendEmail(
      userId,
      sessionName,
      testDetails,
      nextSteps,
      contactInfo
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendEmailSubmit,
};
