import Joi from 'joi';
import Ticket from '../models/ticket.js';

export async function createTicket(req, res) {
  try {
    const schema = Joi.object({
      subject: Joi.string().min(3).max(200).required(),
      description: Joi.string().min(3).required(),
      priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
      tags: Joi.array().items(Joi.string()).default([]),
    });
    const data = await schema.validateAsync(req.body);

    const ticket = await Ticket.create({
      ...data,
      requester: req.user.id,
    });

    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function listTickets(req, res) {
  const { status, priority, assignee, requester, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (requester) filter.requester = requester;
  if (q) filter.$text = { $search: q };

  // Usuário comum vê apenas os seus
  if (req.user.role === 'user') {
    filter.$or = [{ requester: req.user.id }, { assignee: req.user.id }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Ticket.find(filter)
      .populate('requester', 'name email')
      .populate('assignee', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Ticket.countDocuments(filter),
  ]);

  return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
}

export async function getTicket(req, res) {
  const t = await Ticket.findById(req.params.id)
    .populate('requester', 'name email role')
    .populate('assignee', 'name email role')
    .populate('comments.author', 'name email role');
  if (!t) return res.status(404).json({ message: 'Chamado não encontrado' });
  // Permissão
  if (
    req.user.role === 'user' &&
    String(t.requester._id) !== req.user.id &&
    String(t.assignee?._id || '') !== req.user.id
  ) {
    return res.status(403).json({ message: 'Sem permissão' });
  }
  return res.json(t);
}

export async function updateTicket(req, res) {
  const schema = Joi.object({
    subject: Joi.string().min(3).max(200),
    description: Joi.string().min(3),
    status: Joi.string().valid('open', 'pending', 'on_hold', 'solved', 'closed'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
    assignee: Joi.string().allow(null, ''),
    tags: Joi.array().items(Joi.string()),
  }).min(1);

  try {
    const data = await schema.validateAsync(req.body);
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Chamado não encontrado' });

    // Regras simples: user não muda assignee; pode editar apenas seus chamados e não pode fechar diretamente
    const isOwner = String(t.requester) === req.user.id;
    if (req.user.role === 'user') {
      const allowed = {};
      if (data.subject) allowed.subject = data.subject;
      if (data.description) allowed.description = data.description;
      if (data.tags) allowed.tags = data.tags;
      // usuários podem sugerir mudança de status para pending, mas não closed
      if (data.status && ['pending'].includes(data.status)) allowed.status = data.status;
      const updated = await Ticket.findByIdAndUpdate(t._id, allowed, { new: true });
      return res.json(updated);
    }

    // agent/admin
    const updated = await Ticket.findByIdAndUpdate(t._id, data, { new: true });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function addComment(req, res) {
  const schema = Joi.object({ body: Joi.string().min(1).required(), public: Joi.boolean().default(true) });
  try {
    const { body, public: isPublic } = await schema.validateAsync(req.body);
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Chamado não encontrado' });

    // Permissão: user só comenta se for requester ou assignee
    if (
      req.user.role === 'user' &&
      String(t.requester) !== req.user.id &&
      String(t.assignee || '') !== req.user.id
    ) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    t.comments.push({ author: req.user.id, body, public: isPublic });
    await t.save();

    const populated = await t.populate('comments.author', 'name email role');
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
