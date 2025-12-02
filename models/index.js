// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false,
  //   },
  // },
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * @callback Modeling
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {import('sequelize').ModelDefined}
 */

// Models
db.Session = require('./Session')(sequelize, DataTypes);
db.User = require('./User')(sequelize, DataTypes);
db.SessionRequest = require('./SessionRequest')(sequelize, DataTypes);
db.SessionParticipant = require('./SessionParticipant')(sequelize, DataTypes);
db.Role = require('./Role')(sequelize, DataTypes);
db.UserRole = require('./UserRole')(sequelize, DataTypes);
db.Topic = require('./Topic')(sequelize, DataTypes);
db.Part = require('./Part')(sequelize, DataTypes);
db.Question = require('./Question')(sequelize, DataTypes);
db.StudentAnswer = require('./StudentAnswer')(sequelize, DataTypes);
db.StudentAnswerDraft = require('./StudentAnswerDraft')(sequelize, DataTypes);
db.Skill = require('./Skill')(sequelize, DataTypes);
db.Class = require('./Class')(sequelize, DataTypes);
db.Section = require('./Section')(sequelize, DataTypes);
db.TopicSection = require('./TopicSection')(sequelize, DataTypes);
db.SectionPart = require('./SectionPart')(sequelize, DataTypes);

// Relationships
// User <-> Role
db.User.belongsToMany(db.Role, { through: db.UserRole, foreignKey: 'UserID' });
db.Role.belongsToMany(db.User, { through: db.UserRole, foreignKey: 'RoleID' });

// Topic <-> Section (M:N) qua TopicSection
db.Topic.belongsToMany(db.Section, {
  through: db.TopicSection,
  foreignKey: 'TopicID',
  otherKey: 'SectionID',
  as: 'Sections',
});

db.Section.belongsToMany(db.Topic, {
  through: db.TopicSection,
  foreignKey: 'SectionID',
  otherKey: 'TopicID',
  as: 'Topics',
});

// Section <-> Part (M:N) qua SectionPart
db.Section.belongsToMany(db.Part, {
  through: db.SectionPart,
  foreignKey: 'SectionID',
  otherKey: 'PartID',
  as: 'Parts',
});

db.Part.belongsToMany(db.Section, {
  through: db.SectionPart,
  foreignKey: 'PartID',
  otherKey: 'SectionID',
  as: 'Sections',
});

// Part <-> Question (1:N)
db.Part.hasMany(db.Question, { foreignKey: 'PartID' });
db.Question.belongsTo(db.Part, { foreignKey: 'PartID' });

// Skill <-> Part (1:N)  👈 NEW
db.Part.belongsTo(db.Skill, { foreignKey: 'SkillID', as: 'Skill' });
db.Skill.hasMany(db.Part, { foreignKey: 'SkillID', as: 'Parts' });

// Skill <-> Section (1:N)  👈 NEW
db.Section.belongsTo(db.Skill, { foreignKey: 'SkillID', as: 'Skill' });
db.Skill.hasMany(db.Section, { foreignKey: 'SkillID', as: 'Sections' });

db.Question.belongsTo(db.User, { as: 'creator', foreignKey: 'CreatedBy' });
db.Question.belongsTo(db.User, { as: 'updater', foreignKey: 'UpdatedBy' });

db.User.hasMany(db.Question, {
  foreignKey: 'CreatedBy',
  as: 'createdQuestions',
});
db.User.hasMany(db.Question, {
  foreignKey: 'UpdatedBy',
  as: 'updatedQuestions',
});

db.Topic.belongsTo(db.User, { as: 'creator', foreignKey: 'CreatedBy' });
db.Topic.belongsTo(db.User, { as: 'updater', foreignKey: 'UpdatedBy' });

db.User.hasMany(db.Topic, {
  foreignKey: 'CreatedBy',
  as: 'createdTopics',
});
db.User.hasMany(db.Topic, {
  foreignKey: 'UpdatedBy',
  as: 'updatedTopics',
});
// StudentAnswer relations
db.StudentAnswer.belongsTo(db.User, { foreignKey: 'StudentID' });
db.StudentAnswer.belongsTo(db.Topic, { foreignKey: 'TopicID' });
db.StudentAnswer.belongsTo(db.Question, { foreignKey: 'QuestionID' });
db.StudentAnswer.belongsTo(db.Session, { foreignKey: 'SessionID' });

// StudentAnswerDraft relations (thêm Session)
db.StudentAnswerDraft.belongsTo(db.User, { foreignKey: 'StudentID' });
db.StudentAnswerDraft.belongsTo(db.Topic, { foreignKey: 'TopicID' });
db.StudentAnswerDraft.belongsTo(db.Question, { foreignKey: 'QuestionID' });
db.StudentAnswerDraft.belongsTo(db.Session, { foreignKey: 'SessionID' });

// Class <-> User, Session
db.User.hasMany(db.Class, { foreignKey: 'UserID' });
db.Class.belongsTo(db.User, { foreignKey: 'UserID' });

db.Class.hasMany(db.Session, { foreignKey: 'ClassID' });
db.Session.belongsTo(db.Class, { foreignKey: 'ClassID', as: 'Classes' });

// Topic <-> Session (examSet)
db.Topic.hasMany(db.Session, { foreignKey: 'examSet' });
db.Session.belongsTo(db.Topic, { foreignKey: 'examSet' });

// Session <-> SessionParticipant
db.Session.hasMany(db.SessionParticipant, {
  foreignKey: 'SessionID',
  as: 'SessionParticipants',
});
db.SessionParticipant.belongsTo(db.Session, { foreignKey: 'SessionID' });
db.SessionParticipant.belongsTo(db.User, { foreignKey: 'UserID' });

// SessionRequest
db.SessionRequest.belongsTo(db.Session, { foreignKey: 'SessionID' });
db.SessionRequest.belongsTo(db.User, { foreignKey: 'UserID' });

module.exports = db;
