module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define("Classes", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    className: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    UserID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "ID",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  return Class;
};
