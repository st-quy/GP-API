const { Topic, Part, Question, Skill } = require('../models');
const topicService = require('../services/TopicService');
const { Op } = require('sequelize');

const createTopic = async (req, res) => {
  try {
    const result = await topicService.createTopic(req);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getTopicWithRelations = async (req, res) => {
  try {
    const topics = await topicService.getTopicWithRelations(req); // ❗ bỏ res
    return res.status(200).json(topics); // ❗ chỉ gửi ở Controller
  } catch (error) {
    console.error('Error fetching topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTopicByName = async (req, res) => {
  try {
    const topics = await topicService.getTopicByName(req, res);
    return res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching topic by name:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllTopics = async (req, res) => {
  try {
    const topics = await topicService.getAllTopics();
    return res.status(topics.status).json(topics);
  } catch (error) {
    console.error('Error fetching all topics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const removePartFromTopic = async (req, res) => {
  try {
    const topics = await topicService.removePartFromTopic();
    return res.status(topics.status).json(topics);
  } catch (error) {
    console.error('Error fetching all topics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const addPartToTopic = async (req, res) => {
  try {
    const topics = await topicService.addPartToTopic();
    return res.status(topics.status).json(topics);
  } catch (error) {
    console.error('Error fetching all topics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getQuestionsByQuestionSetId = async (req, res) => {
  try {
    const topics = await topicService.getQuestionsByQuestionSetId();
    return res.status(topics.status).json(topics);
  } catch (error) {
    console.error('Error fetching all topics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const result = await topicService.deleteTopic(req);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTopicWithRelations,
  getTopicByName,
  getAllTopics,
  createTopic,
  removePartFromTopic,
  addPartToTopic,
  getQuestionsByQuestionSetId,
  deleteTopic,
};
