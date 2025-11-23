import PDFDocument from 'pdfkit';
import { Cliente, Producto, ContenidoNota } from '../models/index';

interface DatosNota {
    cliente: Cliente;
    folio: string;
    contenidos: Array<ContenidoNota & { producto: Producto }>;
    total: number;
}

export class PDFService {
    generarPDF(datos: DatosNota): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Encabezado
            doc.fontSize(20).text('NOTA DE VENTA', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Folio: ${datos.folio}`, { align: 'right' });
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, { align: 'right' });
            doc.moveDown();

            // Información del Cliente
            doc.fontSize(14).text('Información del Cliente', { underline: true });
            doc.fontSize(10);
            doc.text(`Razón Social: ${datos.cliente.razonSocial}`);
            doc.text(`Nombre Comercial: ${datos.cliente.nombreComercial}`);
            doc.text(`RFC: ${datos.cliente.rfc}`);
            doc.text(`Correo Electrónico: ${datos.cliente.correoElectronico}`);
            doc.text(`Teléfono: ${datos.cliente.telefono}`);
            doc.moveDown();

            // Contenido de la Nota
            doc.fontSize(14).text('Contenido de la Nota', { underline: true });
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 150;
            const col3 = 350;
            const col4 = 450;

            // Headers de la tabla
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Cantidad', col1, tableTop);
            doc.text('Producto', col2, tableTop);
            doc.text('Precio Unit.', col3, tableTop);
            doc.text('Importe', col4, tableTop);

            doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Contenido de la tabla
            doc.font('Helvetica');
            let yPos = tableTop + 25;

            datos.contenidos.forEach((item) => {
                doc.text(item.cantidad.toString(), col1, yPos);
                doc.text(item.producto.nombre, col2, yPos, { width: 180 });
                doc.text(`$${item.precioUnitario.toFixed(2)}`, col3, yPos);
                doc.text(`$${item.importe.toFixed(2)}`, col4, yPos);
                yPos += 20;
            });

            // Línea de total
            doc.moveTo(col1, yPos).lineTo(550, yPos).stroke();
            yPos += 10;

            // Total
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`Total: $${datos.total.toFixed(2)}`, col4, yPos);

            // Footer
            doc.fontSize(8).font('Helvetica').text(
                'Gracias por su preferencia',
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        });
    }
}

export const pdfService = new PDFService();