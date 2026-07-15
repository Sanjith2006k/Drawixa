const Board = require('../models/Board');

const generatePartyCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createBoard = async (req, res) => {
  try {
    let partyCode = generatePartyCode();
    while (await Board.findOne({ partyCode })) {
      partyCode = generatePartyCode();
    }

    const board = await Board.create({
      title: req.body.title || 'Untitled Board',
      owner: req.user._id,
      partyCode,
      members: [],
      canvasData: {}
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).sort({ updatedAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isOwner = board.owner.toString() === req.user._id.toString();
    const isMember = board.members.map(m => m.toString()).includes(req.user._id.toString());

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied. Join via party code first.' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinBoard = async (req, res) => {
  try {
    const { partyCode } = req.body;
    const board = await Board.findOne({ partyCode: partyCode.toUpperCase() });
    if (!board) return res.status(404).json({ message: 'Invalid party code' });

    if (board.owner.toString() !== req.user._id.toString() && !board.members.map(m => m.toString()).includes(req.user._id.toString())) {
      board.members.push(req.user._id);
      await board.save();
    }

    res.json({ boardId: board._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.saveBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (req.body.canvasData !== undefined) {
      board.canvasData = req.body.canvasData;
    }
    if (req.body.title) {
      board.title = req.body.title;
    }
    await board.save();

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this board' });
    }

    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
