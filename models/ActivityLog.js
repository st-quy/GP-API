module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLogs', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    UserID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'ID',
      },
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.ENUM('class', 'session', 'topic', 'question', 'part', 'section'),
      allowNull: false,
    },
    entityID: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    entityName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  return ActivityLog;
};
