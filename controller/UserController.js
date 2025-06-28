const userService = require("../services/UserService");

const registerUser = async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);
    
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await userService.loginUser(email, password);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(400).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(404).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.userId, req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(400).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(
      req.params.userId,
      oldPassword,
      newPassword
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, host } = req.body;
    const result = await userService.sendResetPasswordEmail(email, host);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(400).json({ message: error.message });
  }
};

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const response = await userService.resetPassword(token, newPassword);
    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

const logoutUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.logoutUser(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(400).json({ message: error.message });
  }
};

const getAllUsersByRoleTeacher = async (req, res) => {
  try {
    const result = await userService.getAllUsersByRoleTeacher(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error fetching users with role teacher:", error);
    return res.status(400).json({ message: error.message });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.deleteUser(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  getAllUsersByRoleTeacher,
  deleteUserAccount,
};
