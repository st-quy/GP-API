// models/TopicPart.js
module.exports = (sequelize, DataTypes) => {
  const TopicPart = sequelize.define('TopicPart', {
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
    PartID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Parts',
        key: 'ID',
      },
    },
  });

  return TopicPart;
};
