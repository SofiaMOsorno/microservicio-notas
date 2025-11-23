// Modelos locales (DynamoDB)
export interface NotaVenta {
    notaId: string;
    folio: string;
    clienteId: string;
    direccionFacturacionId: string;
    direccionEnvioId: string;
    total: number;
    fechaCreacion: string;
}

export interface ContenidoNota {
    contenidoId: string;
    notaId: string;
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
}

export interface MetadatosNota {
    notaId: string;
    vecesEnviado: number;
    notaDescargada: boolean;
    horaEnvio: string;
}

// Modelos externos (del microservicio de catálogos)
export interface Cliente {
    clienteId: string;
    razonSocial: string;
    nombreComercial: string;
    rfc: string;
    correoElectronico: string;
    telefono: string;
}

export interface Domicilio {
    domicilioId: string;
    clienteId: string;
    domicilio: string;
    colonia: string;
    municipio: string;
    estado: string;
    tipoDireccion: 'FACTURACION' | 'ENVIO';
}

export interface Producto {
    productoId: string;
    nombre: string;
    unidadMedida: string;
    precioBase: number;
}