import axios from 'axios';
import { config } from '../config/aws';
import { Cliente, Domicilio, Producto } from '../models';

export class CatalogosService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.catalogosServiceUrl;
    }

    async obtenerCliente(clienteId: string): Promise<Cliente | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/clientes/${clienteId}`);
            return response.data.cliente;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error al obtener cliente del microservicio de catálogos:', error.message);
            throw new Error('Error al comunicarse con el servicio de catálogos');
        }
    }

    async obtenerDomicilio(domicilioId: string): Promise<Domicilio | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/domicilios/${domicilioId}`);
            return response.data.domicilio;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error al obtener domicilio del microservicio de catálogos:', error.message);
            throw new Error('Error al comunicarse con el servicio de catálogos');
        }
    }

    async obtenerProducto(productoId: string): Promise<Producto | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/productos/${productoId}`);
            return response.data.producto;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error al obtener producto del microservicio de catálogos:', error.message);
            throw new Error('Error al comunicarse con el servicio de catálogos');
        }
    }
}

export const catalogosService = new CatalogosService();