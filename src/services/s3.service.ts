import { PutObjectCommand, GetObjectCommand, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, config } from '../config/aws';

export class S3Service {
    async subirPDF(rfc: string, folio: string, pdfBuffer: Buffer): Promise<string> {
        const key = `${rfc}/${folio}.pdf`;
        const now = new Date().toISOString();

        await s3Client.send(new PutObjectCommand({
            Bucket: config.s3BucketName,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            Metadata: {
                'hora-envio': now,
                'nota-descargada': 'false',
                'veces-enviado': '1'
            }
        }));

        console.log(`PDF subido a S3: ${key}`);
        return key;
    }

    async descargarPDF(rfc: string, folio: string): Promise<Buffer> {
        const key = `${rfc}/${folio}.pdf`;

        const response = await s3Client.send(new GetObjectCommand({
            Bucket: config.s3BucketName,
            Key: key
        }));

        const stream = response.Body as any;
        const chunks: Buffer[] = [];

        return new Promise((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    async actualizarMetadatoDescargada(rfc: string, folio: string): Promise<void> {
        const key = `${rfc}/${folio}.pdf`;

        const headResponse = await s3Client.send(new HeadObjectCommand({
            Bucket: config.s3BucketName,
            Key: key
        }));

        const metadataActual = headResponse.Metadata || {};

        await s3Client.send(new CopyObjectCommand({
            Bucket: config.s3BucketName,
            CopySource: `${config.s3BucketName}/${key}`,
            Key: key,
            Metadata: {
                ...metadataActual,
                'nota-descargada': 'true'
            },
            MetadataDirective: 'REPLACE'
        }));

        console.log(`Metadata actualizada en S3: ${key}`);
    }

    async incrementarVecesEnviado(rfc: string, folio: string): Promise<void> {
        const key = `${rfc}/${folio}.pdf`;

        const headResponse = await s3Client.send(new HeadObjectCommand({
            Bucket: config.s3BucketName,
            Key: key
        }));

        const metadataActual = headResponse.Metadata || {};
        const vecesEnviado = parseInt(metadataActual['veces-enviado'] || '1') + 1;
        const now = new Date().toISOString();

        await s3Client.send(new CopyObjectCommand({
            Bucket: config.s3BucketName,
            CopySource: `${config.s3BucketName}/${key}`,
            Key: key,
            Metadata: {
                ...metadataActual,
                'veces-enviado': vecesEnviado.toString(),
                'hora-envio': now
            },
            MetadataDirective: 'REPLACE'
        }));

        console.log(`Veces enviado actualizado en S3: ${key}`);
    }
}

export const s3Service = new S3Service();