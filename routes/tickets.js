import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createTicket, listTickets, getTicket, updateTicket, addComment } from '../controllers/ticketsController.js';

const router = Router();

router.use(authRequired);

router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);
router.post('/:id/comments', addComment);

export default router;
