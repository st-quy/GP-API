// models/QuestionSetQuestion.js
module.exports = (sequelize, DataTypes) => {
  const QuestionSetQuestion = sequelize.define('QuestionSetQuestion', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    QuestionSetID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'QuestionSets',
        key: 'ID',
      },
    },
    QuestionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Questions',
        key: 'ID',
      },
    },
    Sequence: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return QuestionSetQuestion;
};
