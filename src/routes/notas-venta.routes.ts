import { Router } from 'express';
import { notasVentaController } from '../controllers/notas-venta.controller';

const router = Router();

router.post('/', (req, res) => notasVentaController.crear(req, res));
router.get('/:id', (req, res) => notasVentaController.obtenerPorId(req, res));
router.get('/:id/pdf', (req, res) => notasVentaController.descargar(req, res));

export default router;