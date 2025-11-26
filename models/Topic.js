const { TOPIC_STATUS } = require('../helpers/constants');

module.exports = (sequelize, DataTypes) => {
  const Topic = sequelize.define('Topic', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Status: {
      type: DataTypes.ENUM(['draft', 'submited', 'approved', 'rejected']),
      allowNull: true,
      defaultValue: TOPIC_STATUS.DRAFT,
    },
  });

  return Topic;
};
