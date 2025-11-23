import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import * as dotenv from 'dotenv';

dotenv.config();

const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE 
        ? fromIni({ profile: process.env.AWS_PROFILE })
        : fromIni({ profile: 'default' })
};

const dynamoClient = new DynamoDBClient(awsConfig);
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client(awsConfig);

export const config = {
    s3BucketName: process.env.S3_BUCKET_NAME || '746241-esi3898k-examen1',
    notasVentaTable: process.env.NOTAS_VENTA_TABLE || 'NotasVenta',
    contenidoNotaTable: process.env.CONTENIDO_NOTA_TABLE || 'ContenidoNota',
    metadatosNotasTable: process.env.METADATOS_NOTAS_TABLE || 'MetadatosNotas',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3002',
    catalogosServiceUrl: process.env.CATALOGOS_SERVICE_URL || 'http://localhost:3001',
    notificacionesServiceUrl: process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3003'
};