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
    ShuffleQuestions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ShuffleAnswers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'ID',
      },
    },
    UpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'ID',
      },
    },
    ReasonReject: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });

  return Topic;
};
