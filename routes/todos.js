const express = require('express');
const Todo = require('../models/Todo');

const router = express.Router();

// 새 할 일 생성
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: '제목은 문자열로 필수 입력입니다.'
      });
    }

    const todo = new Todo({
      title: title.trim(),
      description,
      priority: priority || 'medium',
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: Array.isArray(tags) ? tags : []
    });

    const savedTodo = await todo.save();
    return res.status(201).json({
      success: true,
      data: savedTodo,
      message: '할 일이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '할 일을 생성하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 모든 할 일 조회
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '할 일을 조회하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 특정 할 일 조회
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: '할 일을 찾을 수 없습니다.'
      });
    }

    return res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '할 일을 조회하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

module.exports = router;
 
// 할 일 부분 업데이트 (부분 수정)
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags, completed } = req.body;

    const update = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, error: '제목은 비어있을 수 없습니다.' });
      }
      update.title = title.trim();
    }
    if (description !== undefined) update.description = description;
    if (priority !== undefined) update.priority = priority;
    if (category !== undefined) update.category = category;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];
    if (completed !== undefined) update.completed = Boolean(completed);

    const updated = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: '할 일을 찾을 수 없습니다.' });
    }

    return res.json({ success: true, data: updated, message: '할 일이 수정되었습니다.' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '할 일을 수정하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 할 일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: '할 일을 찾을 수 없습니다.' });
    }

    return res.json({ success: true, message: '할 일이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '할 일을 삭제하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});
