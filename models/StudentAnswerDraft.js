// models/StudentAnswerDraft.js
module.exports = (sequelize, DataTypes) => {
  const StudentAnswerDraft = sequelize.define('StudentAnswerDraft', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    StudentID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID',
      },
    },
    SessionID: {
      // 👈 NEW
      type: DataTypes.UUID,
      allowNull: true, // an toàn cho data cũ; sau có thể siết NOT NULL
      references: {
        model: 'Sessions',
        key: 'ID',
      },
    },
    TopicID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Topics',
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
    AnswerText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    AnswerAudio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return StudentAnswerDraft;
};
