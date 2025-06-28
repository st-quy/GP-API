const bcrypt = require("bcrypt");
const { User } = require("../models");
const jwtUtils = require("../helpers/jwt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

// Logic for user registration
async function registerUser(data) {
  try {
    const { email, password, teacherCode, phone } = data;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        message: `Invalid email format: ${email}`,
      };
    }

    if (phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return {
          status: 400,
          message: `Invalid phone format: ${phone}`,
        };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      ...data,
      phone: phone ? String(phone) : null,
      teacherCode: teacherCode ? String(teacherCode) : null,
      password: hashedPassword,
    });
    await newUser.save();

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return {
      status: 200,
      message: "Register Successfully",
      data: userWithoutPassword,
    };
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const messages = error.errors.map((err) => {
        switch (err.path) {
          case "email":
            return "Email already exists";
          case "phone":
            return "Phone already exists";
          case "studentCode":
            return "Student Code already exists";
          case "teacherCode":
            return "Teacher Code already exists";
          default:
            return `${err.path} already exists`;
        }
      });
      return {
        status: 400,
        message: "Validation Error",
        errors: messages,
      };
    }

    // ❗ Catch all other unexpected errors
    return {
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    };
  }
}

// Logic for user login
async function loginUser(email, password) {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate new access token and refresh token
    const accessToken = await jwtUtils.generateJwtAccess(user);
    const refreshToken = await jwtUtils.generateJwtRefresh(user);

    return {
      status: 200,
      message: "Login Successfully",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

async function getUserById(userId) {
  try {
    const user = await User.findOne({ where: { ID: userId } });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
}

async function updateUser(userId, data) {
  try {
    const user = await User.findOne({ where: { ID: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    if (data.phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(data.phone)) {
        throw new Error(`Invalid phone format: ${data.phone}`);
      }

      const existingPhone = await User.findOne({
        where: { phone: data.phone },
      });

      if (existingPhone && existingPhone.ID !== userId) {
        throw new Error("Phone number already exists");
      }
    }

    await user.update(data);
    return {
      status: 200,
      message: "User updated successfully",
      data: user,
    };
  } catch (error) {
    console.log(error);
    throw new Error(`Error updating user: ${error.message}`);
  }
}

async function changePassword(userId, oldPassword, newPassword) {
  try {
    const user = await User.findOne({ where: { ID: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid old password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    return {
      status: 200,
      message: "Password changed successfully",
    };
  } catch (error) {
    throw new Error(`Error changing password: ${error.message}`);
  }
}



async function sendResetPasswordEmail(email, host) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User with this email does not exist");
    }

    const resetToken = await jwt.sign({ userId: user.ID }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${host}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🔑 Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #333;">🔑 Reset Your Password</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 15px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p style="color: #777; font-size: 12px;">This link will expire in 15 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { status: 200, message: "Password reset link sent to your email" };
  } catch (error) {
    throw new Error(`Error sending reset email: ${error.message}`);
  }
}

async function resetPassword(token, newPassword) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) throw new Error("Invalid or expired token");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { status: 200, message: "Password has been updated successfully" };
  } catch (error) {
    throw new Error(`Reset password failed: ${error.message}`);
  }
}

async function logoutUser(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User không tồn tại");
    }

    user.refresh_token = null;
    user.refresh_token_expires = null;
    await user.save();

    return { status: 200, message: "Logout thành công" };
  } catch (error) {
    throw new Error(`Logout thất bại: ${error.message}`);
  }
}

async function getAllUsersByRoleTeacher(req) {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerms = search
      .trim()
      .split(" ")
      .filter((term) => term);

    const whereClause = {
      roleIDs: {
        [Op.contains]: ["teacher"],
      },
    };

    if (searchTerms.length > 0) {
      whereClause[Op.and] = searchTerms.map((term) => ({
        [Op.or]: [
          { lastName: { [Op.iLike]: `%${term}%` } },
          { firstName: { [Op.iLike]: `%${term}%` } },
          { teacherCode: { [Op.iLike]: `%${term}%` } },
        ],
      }));
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    const { rows: teachers, count: total } = await User.findAndCountAll({
      where: whereClause,
      offset,
      limit: parseInt(limit),
      order: [["updatedAt", "DESC"]],
    });

    return {
      status: 200,
      message: "Teachers fetched successfully",
      data: {
        teachers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    };
  } catch (error) {
    throw new Error(`Error fetching teachers: ${error.message}`);
  }
}

async function deleteUser(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found with ID: " + userId);
    }
    const result = await user.destroy();

    return {
      status: 200,
      message: "User deleted successfully",
    };
  } catch (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  changePassword,
  sendResetPasswordEmail,
  resetPassword,
  logoutUser,
  getAllUsersByRoleTeacher,
  deleteUser,
};
