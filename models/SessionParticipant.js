/**@type {import('./index').Modeling} */
const { CEFR_LEVELS } = require("../constants/levels");
module.exports = (sequelize, DataTypes) => {
  const SessionParticipant = sequelize.define("SessionParticipant", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    GrammarVocab: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    GrammarVocabLevel: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    Reading: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    ReadingLevel: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    Listening: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    ListeningLevel: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    Speaking: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    SpeakingLevel: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    Writing: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    WritingLevel: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    Total: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    Level: {
      type: DataTypes.ENUM(...CEFR_LEVELS),
      allowNull: true,
    },
    IsPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    SessionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Sessions",
        key: "ID",
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    UserID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Users",
        key: "ID",
      },
    },
  });

  return SessionParticipant;
};
