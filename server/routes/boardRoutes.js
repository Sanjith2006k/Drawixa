const express = require('express');
const router = express.Router();
const { createBoard, getBoards, getBoardById, saveBoard, joinBoard, deleteBoard } = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/join', protect, joinBoard);
router.route('/').get(protect, getBoards).post(protect, createBoard);
router.route('/:id').get(protect, getBoardById).put(protect, saveBoard).delete(protect, deleteBoard);

module.exports = router;
