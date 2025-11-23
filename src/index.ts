import express from 'express';
import * as dotenv from 'dotenv';
import notasVentaRoutes from './routes/notas-venta.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.use('/api/notas-venta', notasVentaRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP',
        service: 'microservicio-notas',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Microservicio de Notas de Venta - API REST',
        version: '1.0.0',
        endpoints: {
            notas: '/api/notas-venta',
            health: '/health'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Microservicio de Notas de Venta corriendo en http://localhost:${PORT}`);
    console.log(`Documentación: http://localhost:${PORT}/`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
});