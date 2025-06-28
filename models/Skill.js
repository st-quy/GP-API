module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define("Skill", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Skill;
};
