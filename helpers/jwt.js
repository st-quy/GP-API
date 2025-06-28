const jwt = require("jsonwebtoken");
const { User } = require("../models");
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_SECRET = process.env.EMAIL_SECRET;

async function generateJwtAccess(user) {
  const payload = {
    userId: user.ID,
    role: user.roleIDs,
    lastName: user.lastName,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    class: user.class,
    studentCode: user.studentCode,
    teacherCode: user.teacherCode,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
const generateToken = (payload, expiresIn) => {
  const token = jwt.sign(payload, EMAIL_SECRET, { expiresIn });

  return token;
};

async function generateJwtRefresh(user) {
  const payload = {
    userId: user.user_id,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}
function decodeToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
function decodeEmailToken(token) {
  try {
    return jwt.verify(token, EMAIL_SECRET);
  } catch (error) {
    return null;
  }
}

async function refreshToken(refreshToken) {
  const decoded = jwt.verify(refreshToken, JWT_SECRET);

  if (!decoded) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findByPk(decoded.userId); // Tìm user từ DB
  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = await generateJwtAccess(user);

  return {
    accessToken: newAccessToken,
  };
}

module.exports = {
  generateJwtAccess,
  generateJwtRefresh,
  decodeToken,
  validateToken,
  refreshToken,
  generateToken,
  decodeEmailToken,
};
