// models/Part.js
module.exports = (sequelize, DataTypes) => {
  const Part = sequelize.define('Part', {
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
      allowNull: true,
    },
    SkillID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Skills',
        key: 'ID',
      },
    },
  });

  return Part;
};
