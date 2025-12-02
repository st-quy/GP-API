// models/SectionPart.js
module.exports = (sequelize, DataTypes) => {
  const SectionPart = sequelize.define('SectionPart', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    SectionID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sections',
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

  return SectionPart;
};
