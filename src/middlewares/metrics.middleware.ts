import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', async () => {
        const duracion = Date.now() - start;
        const ruta = req.route?.path || req.path;

        console.log(`[METRICS] Ruta: ${ruta}, Duración: ${duracion}ms, Status: ${res.statusCode}`);

        try {
            // Enviar métrica HTTP
            await metricsService.registrarMetricaHTTP(req.method, ruta, res.statusCode);
            console.log(`[METRICS] HTTPRequests enviada`);
            
            // Enviar métrica de tiempo
            await metricsService.registrarTiempoEjecucion(ruta, duracion);
            console.log(`[METRICS] ResponseTime enviada: ${duracion}ms`);
            
        } catch (error) {
            console.error('[METRICS] Error al enviar métricas a CloudWatch:', error);
        }
    });

    next();
};