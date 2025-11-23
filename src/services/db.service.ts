import { PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../config/aws';
import { NotaVenta, ContenidoNota, MetadatosNota } from '../models/index';

export class DBService {
    // Notas de venta
    async crearNotaVenta(nota: NotaVenta): Promise<NotaVenta> {
        await docClient.send(new PutCommand({
            TableName: config.notasVentaTable,
            Item: nota
        }));
        return nota;
    }

    async obtenerNotaVenta(notaId: string): Promise<NotaVenta | null> {
        const result = await docClient.send(new GetCommand({
            TableName: config.notasVentaTable,
            Key: { notaId }
        }));
        return result.Item as NotaVenta || null;
    }

    async obtenerTodasNotas(): Promise<NotaVenta[]> {
        const result = await docClient.send(new ScanCommand({
            TableName: config.notasVentaTable
        }));
        return (result.Items as NotaVenta[]) || [];
    }

    // Contenido de notas
    async crearContenidoNota(contenido: ContenidoNota): Promise<ContenidoNota> {
        await docClient.send(new PutCommand({
            TableName: config.contenidoNotaTable,
            Item: contenido
        }));
        return contenido;
    }

    async obtenerContenidosPorNota(notaId: string): Promise<ContenidoNota[]> {
        const result = await docClient.send(new ScanCommand({
            TableName: config.contenidoNotaTable,
            FilterExpression: 'notaId = :notaId',
            ExpressionAttributeValues: { ':notaId': notaId }
        }));
        return (result.Items as ContenidoNota[]) || [];
    }

    // Metadatos
    async crearMetadatos(metadatos: MetadatosNota): Promise<MetadatosNota> {
        await docClient.send(new PutCommand({
            TableName: config.metadatosNotasTable,
            Item: metadatos
        }));
        return metadatos;
    }

    async obtenerMetadatos(notaId: string): Promise<MetadatosNota | null> {
        const result = await docClient.send(new GetCommand({
            TableName: config.metadatosNotasTable,
            Key: { notaId }
        }));
        return result.Item as MetadatosNota || null;
    }

    async incrementarEnvios(notaId: string): Promise<void> {
        await docClient.send(new UpdateCommand({
            TableName: config.metadatosNotasTable,
            Key: { notaId },
            UpdateExpression: 'SET vecesEnviado = vecesEnviado + :inc, horaEnvio = :hora',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':hora': new Date().toISOString()
            }
        }));
    }

    async marcarComoDescargada(notaId: string): Promise<void> {
        await docClient.send(new UpdateCommand({
            TableName: config.metadatosNotasTable,
            Key: { notaId },
            UpdateExpression: 'SET notaDescargada = :val',
            ExpressionAttributeValues: { ':val': true }
        }));
    }
}

export const dbService = new DBService();