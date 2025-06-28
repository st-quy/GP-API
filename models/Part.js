module.exports = (sequelize, DataTypes) => {
  const Part = sequelize.define("Part", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    SubContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TopicID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Topics",
        key: "ID",
      },
    },
  });

  return Part;
};
