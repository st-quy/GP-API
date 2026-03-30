const bcrypt = require('bcrypt');
const { User, Role, UserRole } = require('../models');
const jwtUtils = require('../helpers/jwt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Logic for user registration
async function registerUser(data) {
  try {
    const { email, password, teacherCode, phone, role } = data;

    // --- Validate email format ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        message: `Invalid email format: ${email}`,
      };
    }

    // --- Validate phone ---
    if (phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return {
          status: 400,
          message: `Invalid phone format: ${phone}`,
        };
      }
    }

    // --- Validate role (only student & teacher allowed) ---
    const allowedRoles = ['student', 'teacher'];
    const roleName = role && allowedRoles.includes(role) ? role : 'student';

    // --- Prepare password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create User ---
    const newUser = await User.create({
      ...data,
      phone: phone ? String(phone) : null,
      teacherCode: teacherCode ? String(teacherCode) : null,
      password: hashedPassword,
    });

    // --- Assign Role ---
    const roleRecord = await Role.findOne({ where: { Name: roleName } });

    if (!roleRecord) {
      return {
        status: 500,
        message: `Role '${roleName}' not found in database`,
      };
    }

    await UserRole.create({
      UserID: newUser.ID,
      RoleID: roleRecord.ID,
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return {
      status: 200,
      message: 'Register Successfully',
      data: {
        ...userWithoutPassword,
        role: roleName,
      },
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((err) => {
        switch (err.path) {
          case 'email':
            return 'Email already exists';
          case 'phone':
            return 'Phone already exists';
          case 'studentCode':
            return 'Student Code already exists';
          case 'teacherCode':
            return 'Teacher Code already exists';
          default:
            return `${err.path} already exists`;
        }
      });
      return {
        status: 400,
        message: 'Validation Error',
        errors: messages,
      };
    }

    return {
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    };
  }
}

// Logic for user login
async function loginUser(email, password) {
  try {
    // 1. Tìm user + roles
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          attributes: ['Name'],
          through: { attributes: [] }, // ẩn bảng trung gian UserRole
        },
      ],
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Lấy danh sách role
    const roles = (user.Roles || []).map((role) => role.Name);

    // 4. Payload cho JWT (tùy bạn muốn truyền gì)
    const jwtPayload = {
      user,
      roles,
    };

    // 5. Generate token
    const accessToken = await jwtUtils.generateJwtAccess(jwtPayload);
    const refreshToken = await jwtUtils.generateJwtRefresh(jwtPayload);

    // 6. Trả response (có thể trả kèm user + roles)
    return {
      status: 200,
      message: 'Login Successfully',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.ID,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
        },
      },
    };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

async function getUserById(userId) {
  try {
    const user = await User.findOne({
      where: { ID: userId },
      include: [
        {
          model: Role,
          attributes: ['Name'],
          through: { attributes: [] }, // ẩn bảng trung gian UserRole
        },
      ],
    });

    if (!user) {
      return {
        status: 404,
        message: 'User not found',
        data: null,
      };
    }

    // Convert sang plain object
    const plainUser = user.toJSON();

    // Lấy danh sách role
    const roles = (plainUser.Roles || []).map((role) => role.Name);

    // Xoá field nhạy cảm
    delete plainUser.password;
    delete plainUser.Roles; // vì ta map ra roles riêng

    return {
      status: 200,
      message: 'Get user successfully',
      data: {
        ...plainUser,
        roles, // ['student', 'teacher', ...]
      },
    };
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
}

async function updateUser(userId, data) {
  try {
    const user = await User.findOne({ where: { ID: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const normalizedData = { ...data };

    if (typeof normalizedData.firstName === 'string') {
      normalizedData.firstName = normalizedData.firstName.trim();
      if (!normalizedData.firstName) {
        throw new Error('First name is required');
      }
      if (normalizedData.firstName.length > 50) {
        throw new Error('First name must not exceed 50 characters');
      }
      if (!/^[a-zA-Z\s]+$/.test(normalizedData.firstName)) {
        throw new Error('First name cannot contain special characters or numbers');
      }
    }

    if (typeof normalizedData.lastName === 'string') {
      normalizedData.lastName = normalizedData.lastName.trim();
      if (!normalizedData.lastName) {
        throw new Error('Last name is required');
      }
      if (normalizedData.lastName.length > 50) {
        throw new Error('Last name must not exceed 50 characters');
      }
      if (!/^[a-zA-Z\s]+$/.test(normalizedData.lastName)) {
        throw new Error('Last name cannot contain special characters or numbers');
      }
    }

    if (typeof normalizedData.email === 'string') {
      normalizedData.email = normalizedData.email.trim();
      if (!normalizedData.email) {
        throw new Error('Email is required');
      }
      if (normalizedData.email.length > 100) {
        throw new Error('Email must not exceed 100 characters');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedData.email)) {
        throw new Error(`Invalid email format: ${normalizedData.email}`);
      }

      const existingEmail = await User.findOne({
        where: {
          email: normalizedData.email,
          ID: { [Op.ne]: userId },
        },
      });

      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    if (typeof normalizedData.teacherCode === 'string') {
      normalizedData.teacherCode = normalizedData.teacherCode.trim();
      if (!normalizedData.teacherCode) {
        throw new Error('Teacher Code is required');
      }
      if (normalizedData.teacherCode.length > 20) {
        throw new Error('Teacher Code must not exceed 20 characters');
      }

      const existingTeacherCode = await User.findOne({
        where: {
          teacherCode: normalizedData.teacherCode,
          ID: { [Op.ne]: userId },
        },
      });

      if (existingTeacherCode) {
        throw new Error('Teacher Code already exists');
      }
    }

    if (typeof normalizedData.phone === 'string') {
      normalizedData.phone = normalizedData.phone.trim();
      if (!normalizedData.phone) {
        normalizedData.phone = null;
      }
    }

    if (normalizedData.phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(normalizedData.phone)) {
        throw new Error(`Invalid phone format: ${normalizedData.phone}`);
      }

      const existingPhone = await User.findOne({
        where: {
          phone: normalizedData.phone,
          ID: { [Op.ne]: userId },
        },
      });

      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
    }

    await user.update(normalizedData);
    return {
      status: 200,
      message: 'User updated successfully',
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
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    return {
      status: 200,
      message: 'Password changed successfully',
    };
  } catch (error) {
    throw new Error(`Error changing password: ${error.message}`);
  }
}

async function sendResetPasswordEmail(email, host) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // const resetToken = await jwt.sign({ userId: user.ID }, process.env.JWT_SECRET, {
    //   expiresIn: "15m",
    // });

    // const resetLink = `${host}/reset-password?token=${resetToken}`;

    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: user.email,
    //   subject: "🔑 Reset Your Password",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
    //       <h2 style="color: #333;">🔑 Reset Your Password</h2>
    //       <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
    //       <p>Click the link below to reset your password:</p>
    //       <a href="${resetLink}" style="display: inline-block; padding: 10px 15px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">
    //         Reset Password
    //       </a>
    //       <p style="color: #777; font-size: 12px;">This link will expire in 15 minutes.</p>
    //     </div>
    //   `,
    // };
    const defaultPassword = process.env.DEFAULT_PASSWORD;

    user.password = await bcrypt.hash(defaultPassword, 10);
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🔐 Your Password Has Been Reset',
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333;">🔐 Password Reset Successful</h2>
      <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
      <p>You have requested to reset your password. Here is your new password:</p>
      <p style="font-size: 16px; font-weight: bold; color: #000;">${defaultPassword}</p>
      <p style="color: #777; font-size: 12px;">For your security, please change this password after logging in.</p>
      <p style="color: #aaa; font-size: 12px;">If you did not request this change, please ignore this email or contact support immediately.</p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return { status: 200, message: 'Password reset link sent to your email' };
  } catch (error) {
    throw new Error(`Error sending reset email: ${error.message}`);
  }
}

async function resetPassword(token, newPassword) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) throw new Error('Invalid or expired token');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { status: 200, message: 'Password has been updated successfully' };
  } catch (error) {
    throw new Error(`Reset password failed: ${error.message}`);
  }
}

async function logoutUser(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User không tồn tại');
    }

    user.refresh_token = null;
    user.refresh_token_expires = null;
    await user.save();

    return { status: 200, message: 'Logout thành công' };
  } catch (error) {
    throw new Error(`Logout thất bại: ${error.message}`);
  }
}

async function getAllUsersByRoleTeacher(req) {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerms = search.trim().split(' ').filter(Boolean);

    const whereClause = {};

    if (searchTerms.length > 0) {
      whereClause[Op.and] = searchTerms.map((term) => ({
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${term}%` } },
          { lastName: { [Op.iLike]: `%${term}%` } },
          { teacherCode: { [Op.iLike]: `%${term}%` } },
        ],
      }));
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    const { rows: teachers, count: total } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          where: { Name: 'teacher' }, // 👈 Filter role here
          through: { attributes: [] }, // Ẩn UserRole
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['updatedAt', 'DESC']],
      distinct: true, // 👈 để count chính xác khi JOIN
    });

    return {
      status: 200,
      message: 'Teachers fetched successfully',
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
      throw new Error('User not found with ID: ' + userId);
    }
    const result = await user.destroy();

    return {
      status: 200,
      message: 'User deleted successfully',
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
