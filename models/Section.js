// models/Section.js
module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    Description: {
      type: DataTypes.TEXT,
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

  return Section;
};
