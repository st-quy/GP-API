module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      studentCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      teacherCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      roleIDs: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: ["student"],
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      class: {
        type: DataTypes.STRING,
        allowNull: true, // Nullable
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dob: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      getterMethods: {
        fullName() {
          return `${this.firstName} ${this.lastName}`;
        },
      },
    }
  );

  return User;
};
