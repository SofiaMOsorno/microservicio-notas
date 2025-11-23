import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', async () => {
        const duracion = Date.now() - start;
        const ruta = req.route?.path || req.path;

        try {
            await metricsService.registrarMetricaHTTP(req.method, ruta, res.statusCode);
            await metricsService.registrarTiempoEjecucion(ruta, duracion);
        } catch (error) {
            console.error('Error al enviar métricas a CloudWatch:', error);
        }
    });

    next();
};