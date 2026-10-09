import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check that the server is running
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
}); // Health check to confirm the server is up

export default router;
