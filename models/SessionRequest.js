const { SESSION_REQUEST_STATUS } = require("../helpers/constants");

/**@type {import('./index').Modeling} */
module.exports = (sequelize, DataTypes) => {
  const SessionRequest = sequelize.define("SessionRequest", {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM(["pending", "approved", "rejected"]),
      allowNull: false,
      defaultValue: SESSION_REQUEST_STATUS.PENDING,
    },
    requestDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    SessionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Sessions",
        key: "ID",
      },
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

  return SessionRequest;
};
