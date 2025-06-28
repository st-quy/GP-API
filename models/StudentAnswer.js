module.exports = (sequelize, DataTypes) => {
  const StudentAnswer = sequelize.define("StudentAnswer", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    StudentID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "ID",
      },
    },
    SessionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Sessions",
        key: "ID",
      },
    },
    TopicID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Topics",
        key: "ID",
      },
    },
    QuestionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Questions",
        key: "ID",
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
    Comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return StudentAnswer;
};
