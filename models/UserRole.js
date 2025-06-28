module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define("UserRole", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    RoleID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Roles",
        key: "ID",
      },
    },
    UserID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "ID",
      },
    },
  });

  return UserRole;
};
