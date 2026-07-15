const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Board'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  partyCode: {
    type: String,
    unique: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  canvasData: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);
