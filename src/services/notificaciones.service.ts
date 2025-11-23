import axios from 'axios';
import { config } from '../config/aws';

export class NotificacionesService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.notificacionesServiceUrl;
    }

    async enviarNotificacion(
        correo: string,
        folio: string,
        notaId: string
    ): Promise<void> {
        try {
            const enlaceDescarga = `${config.apiBaseUrl}/api/notas-venta/${notaId}/pdf`;

            await axios.post(`${this.baseUrl}/api/notificaciones/enviar`, {
                correo,
                folio,
                enlaceDescarga
            });

            console.log(`✅ Notificación enviada para folio ${folio}`);
        } catch (error: any) {
            console.error('Error al enviar notificación:', error.message);
            // No lanzamos error porque la nota ya se creó correctamente
            // Solo logueamos el error
        }
    }
}

export const notificacionesService = new NotificacionesService();