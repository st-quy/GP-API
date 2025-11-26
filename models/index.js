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
db.TopicPart = require('./TopicPart')(sequelize, DataTypes);
db.QuestionSet = require('./QuestionSet')(sequelize, DataTypes);
db.QuestionSetQuestion = require('./QuestionSetQuestion')(sequelize, DataTypes);

// Relationships
// User <-> Role
db.User.belongsToMany(db.Role, { through: db.UserRole, foreignKey: 'UserID' });
db.Role.belongsToMany(db.User, { through: db.UserRole, foreignKey: 'RoleID' });

// Topic <-> Part (M:N) qua TopicPart
db.Topic.belongsToMany(db.Part, {
  through: db.TopicPart,
  foreignKey: 'TopicID',
  otherKey: 'PartID',
  as: 'Parts',
});

db.Part.belongsToMany(db.Topic, {
  through: db.TopicPart,
  foreignKey: 'PartID',
  otherKey: 'TopicID',
  as: 'Topics',
});

// Part <-> Question (1:N)
db.Part.hasMany(db.Question, { foreignKey: 'PartID' });
db.Question.belongsTo(db.Part, { foreignKey: 'PartID' });

// Skill <-> Part (1:N)  👈 NEW
db.Part.belongsTo(db.Skill, { foreignKey: 'SkillID', as: 'Skill' });
db.Skill.hasMany(db.Part, { foreignKey: 'SkillID', as: 'Parts' });

// QuestionSet <-> Question (M:N) - giữ nguyên nếu bạn còn dùng
db.QuestionSet.belongsToMany(db.Question, {
  through: db.QuestionSetQuestion,
  foreignKey: 'QuestionSetID',
  otherKey: 'QuestionID',
  as: 'Questions',
});

db.Question.belongsToMany(db.QuestionSet, {
  through: db.QuestionSetQuestion,
  foreignKey: 'QuestionID',
  otherKey: 'QuestionSetID',
  as: 'QuestionSets',
});

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
