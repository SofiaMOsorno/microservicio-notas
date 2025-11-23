import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/db.service';
import { pdfService } from '../services/pdf.service';
import { s3Service } from '../services/s3.service';
import { catalogosService } from '../services/catalogos.service';
import { notificacionesService } from '../services/notificaciones.service';
import { NotaVenta, ContenidoNota, MetadatosNota } from '../models/index';

interface ItemContenido {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
}

export class NotasVentaController {
    async crear(req: Request, res: Response) {
        try {
            const {
                clienteId,
                direccionFacturacionId,
                direccionEnvioId,
                contenidos
            } = req.body;

            if (!clienteId || !direccionFacturacionId || !direccionEnvioId || !contenidos) {
                return res.status(400).json({ 
                    error: 'Faltan campos obligatorios',
                    campos_requeridos: ['clienteId', 'direccionFacturacionId', 'direccionEnvioId', 'contenidos']
                });
            }

            if (!Array.isArray(contenidos) || contenidos.length === 0) {
                return res.status(400).json({ 
                    error: 'Contenidos inválidos',
                    detalle: 'El campo contenidos debe ser un array con al menos un producto'
                });
            }

            // Validar cliente con el microservicio de catálogos
            const cliente = await catalogosService.obtenerCliente(clienteId);
            if (!cliente) {
                return res.status(404).json({ 
                    error: 'Cliente no encontrado',
                    detalle: `No existe un cliente con ID ${clienteId}`
                });
            }

            // Validar direcciones con el microservicio de catálogos
            const dirFacturacion = await catalogosService.obtenerDomicilio(direccionFacturacionId);
            const dirEnvio = await catalogosService.obtenerDomicilio(direccionEnvioId);

            if (!dirFacturacion) {
                return res.status(404).json({ 
                    error: 'Dirección de facturación no encontrada',
                    detalle: `No existe un domicilio con ID ${direccionFacturacionId}`
                });
            }

            if (!dirEnvio) {
                return res.status(404).json({ 
                    error: 'Dirección de envío no encontrada',
                    detalle: `No existe un domicilio con ID ${direccionEnvioId}`
                });
            }

            if (dirFacturacion.clienteId !== clienteId) {
                return res.status(409).json({ 
                    error: 'Dirección de facturación no pertenece al cliente',
                    detalle: 'La dirección de facturación pertenece a otro cliente'
                });
            }

            if (dirEnvio.clienteId !== clienteId) {
                return res.status(409).json({ 
                    error: 'Dirección de envío no pertenece al cliente',
                    detalle: 'La dirección de envío pertenece a otro cliente'
                });
            }

            if (dirFacturacion.tipoDireccion !== 'FACTURACION') {
                return res.status(409).json({ 
                    error: 'Tipo de dirección incorrecto',
                    detalle: 'La dirección de facturación debe ser de tipo FACTURACION'
                });
            }

            if (dirEnvio.tipoDireccion !== 'ENVIO') {
                return res.status(409).json({ 
                    error: 'Tipo de dirección incorrecto',
                    detalle: 'La dirección de envío debe ser de tipo ENVIO'
                });
            }

            let total = 0;
            const contenidosConProductos: Array<ContenidoNota & { producto: any }> = [];
            const notaId = uuidv4();

            // Validar cada producto con el microservicio de catálogos
            for (const item of contenidos as ItemContenido[]) {
                if (!item.productoId || !item.cantidad || item.precioUnitario === undefined) {
                    return res.status(400).json({ 
                        error: 'Item de contenido inválido',
                        detalle: 'Cada item debe tener productoId, cantidad y precioUnitario'
                    });
                }

                if (item.cantidad <= 0) {
                    return res.status(400).json({ 
                        error: 'Cantidad inválida',
                        detalle: 'La cantidad debe ser mayor a 0'
                    });
                }

                if (item.precioUnitario < 0) {
                    return res.status(400).json({ 
                        error: 'Precio unitario inválido',
                        detalle: 'El precio unitario no puede ser negativo'
                    });
                }

                const producto = await catalogosService.obtenerProducto(item.productoId);
                if (!producto) {
                    return res.status(404).json({ 
                        error: 'Producto no encontrado',
                        detalle: `No existe un producto con ID ${item.productoId}`
                    });
                }

                const importe = item.cantidad * item.precioUnitario;
                total += importe;

                contenidosConProductos.push({
                    contenidoId: uuidv4(),
                    notaId,
                    productoId: item.productoId,
                    producto,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    importe
                });
            }

            const folio = `NV-${Date.now()}`;

            // Crear nota de venta
            const nota: NotaVenta = {
                notaId,
                folio,
                clienteId,
                direccionFacturacionId,
                direccionEnvioId,
                total,
                fechaCreacion: new Date().toISOString()
            };

            await dbService.crearNotaVenta(nota);

            // Crear contenidos de la nota
            for (const contenido of contenidosConProductos) {
                await dbService.crearContenidoNota({
                    contenidoId: contenido.contenidoId,
                    notaId: contenido.notaId,
                    productoId: contenido.productoId,
                    cantidad: contenido.cantidad,
                    precioUnitario: contenido.precioUnitario,
                    importe: contenido.importe
                });
            }

            // Crear metadatos
            const metadatos: MetadatosNota = {
                notaId,
                vecesEnviado: 1,
                notaDescargada: false,
                horaEnvio: new Date().toISOString()
            };
            await dbService.crearMetadatos(metadatos);

            // Generar PDF
            const pdfBuffer = await pdfService.generarPDF({
                cliente,
                folio,
                contenidos: contenidosConProductos,
                total
            });

            // Subir PDF a S3
            await s3Service.subirPDF(cliente.rfc, folio, pdfBuffer);

            // Enviar notificación (async, no bloqueante)
            notificacionesService.enviarNotificacion(cliente.correoElectronico, folio, notaId)
                .catch(err => console.error('Error al enviar notificación:', err));

            res.status(201).json({ 
                message: 'Nota de venta creada exitosamente',
                nota: {
                    notaId,
                    folio,
                    total
                }
            });
        } catch (error) {
            console.error('Error al crear nota de venta:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al crear nota de venta',
                detalle: 'Por favor intente nuevamente más tarde'
            });
        }
    }

    async obtenerPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const nota = await dbService.obtenerNotaVenta(id);

            if (!nota) {
                return res.status(404).json({ 
                    error: 'Nota de venta no encontrada',
                    detalle: `No existe una nota con ID ${id}`
                });
            }

            const contenidos = await dbService.obtenerContenidosPorNota(id);
            const metadatos = await dbService.obtenerMetadatos(id);

            res.json({ 
                message: 'Nota obtenida exitosamente',
                nota, 
                contenidos, 
                metadatos 
            });
        } catch (error) {
            console.error('Error al obtener nota de venta:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener nota de venta',
                detalle: 'Por favor intente nuevamente más tarde'
            });
        }
    }

    async descargar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const nota = await dbService.obtenerNotaVenta(id);

            if (!nota) {
                return res.status(404).json({ 
                    error: 'Nota de venta no encontrada',
                    detalle: `No existe una nota con ID ${id}`
                });
            }

            const cliente = await catalogosService.obtenerCliente(nota.clienteId);
            if (!cliente) {
                return res.status(404).json({ 
                    error: 'Cliente no encontrado',
                    detalle: 'El cliente asociado a la nota no existe'
                });
            }

            const pdfBuffer = await s3Service.descargarPDF(cliente.rfc, nota.folio);

            await s3Service.actualizarMetadatoDescargada(cliente.rfc, nota.folio);
            await dbService.marcarComoDescargada(id);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nota.folio}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error al descargar nota:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al descargar nota',
                detalle: 'Por favor intente nuevamente más tarde'
            });
        }
    }
}

export const notasVentaController = new NotasVentaController();