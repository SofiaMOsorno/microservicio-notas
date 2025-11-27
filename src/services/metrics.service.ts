import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatchClient = new CloudWatchClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

export class MetricsService {
    private namespace = 'Microservicios/Catalogos';
    private environment = process.env.NODE_ENV || 'local';

    async registrarMetricaHTTP(metodo: string, ruta: string, statusCode: number) {
        const rangoStatus = this.obtenerRangoStatus(statusCode);

        await cloudwatchClient.send(new PutMetricDataCommand({
            Namespace: this.namespace,
            MetricData: [
                {
                    MetricName: 'HTTPRequests',
                    Value: 1,
                    Unit: 'Count',
                    Dimensions: [
                        { Name: 'Method', Value: metodo },
                        { Name: 'StatusRange', Value: rangoStatus },
                        { Name: 'Environment', Value: this.environment }
                    ],
                    Timestamp: new Date()
                }
            ]
        }));
    }

    async registrarTiempoEjecucion(ruta: string, duracionMs: number) {
        console.log(`Enviando ResponseTime: ${duracionMs}ms para ruta: ${ruta}`);
        
        try {
            await cloudwatchClient.send(new PutMetricDataCommand({
                Namespace: this.namespace,
                MetricData: [
                    {
                        MetricName: 'ResponseTime',
                        Value: duracionMs,
                        Unit: 'Milliseconds',
                        Dimensions: [
                            { Name: 'Route', Value: ruta },
                            { Name: 'Environment', Value: this.environment }
                        ],
                        Timestamp: new Date()
                    }
                ]
            }));
            
            console.log(`ResponseTime enviada exitosamente a CloudWatch`);
        } catch (error) {
            console.error(`Error al enviar ResponseTime:`, error);
            throw error;
        }
    }

    private obtenerRangoStatus(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) return '2xx';
        if (statusCode >= 400 && statusCode < 500) return '4xx';
        if (statusCode >= 500) return '5xx';
        return 'other';
    }
}

export const metricsService = new MetricsService();