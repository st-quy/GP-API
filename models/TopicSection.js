// models/TopicPart.js
module.exports = (sequelize, DataTypes) => {
  const TopicSection = sequelize.define('TopicSection', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    TopicID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Topics',
        key: 'ID',
      },
    },
    SectionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sections',
        key: 'ID',
      },
    },
    ScoreConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });

  return TopicSection;
};
