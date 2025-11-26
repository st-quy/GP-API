// models/Question.js
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    Type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    AudioKeys: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ImageKeys: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    PartID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Parts',
        key: 'ID',
      },
    },
    Sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    SubContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    GroupContent: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    AnswerContent: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    GroupID: {
      type: DataTypes.UUID,
      allowNull: true,
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
  });

  return Question;
};
