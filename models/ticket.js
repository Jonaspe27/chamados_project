import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    public: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, index: 'text' },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'pending', 'on_hold', 'solved', 'closed'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: { type: [String], index: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Índices para busca full-text básica
ticketSchema.index({ subject: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Ticket', ticketSchema);
