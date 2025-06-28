module.exports = (sequelize, DataTypes) => {
  const Topic = sequelize.define("Topic", {
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

  return Topic;
};
