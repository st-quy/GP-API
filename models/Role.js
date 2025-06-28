module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.ENUM(["admin", "student", "teacher"]),
      allowNull: false,
    },
  });

  return Role;
};
