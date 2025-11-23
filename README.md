# Microservicio de Notas de Venta

Microservicio para gestión de notas de venta, generación de PDFs y almacenamiento en S3.

## Tecnologías

- Node.js
- TypeScript
- Express
- AWS DynamoDB
- AWS S3
- PDFKit
- Axios (comunicación entre microservicios)

## Prerequisitos

- Node.js 20+
- AWS CLI configurado con credenciales
- DynamoDB con las tablas: NotasVenta, ContenidoNota, MetadatosNotas
- S3 Bucket configurado
- Microservicio de Catálogos corriendo en puerto 3001
- Microservicio de Notificaciones corriendo en puerto 3003

## Instalación
```bash
npm install
```

## Ejecución

### Modo desarrollo
```bash
npm run dev
```

### Modo producción
```bash
npm run build
npm start
```

### Con PM2
```bash
npm run build
pm2 start ecosystem.config.js
```

## Endpoints

### Notas de Venta
- POST /api/notas-venta - Crear nota de venta con PDF
- GET /api/notas-venta/:id - Obtener nota por ID
- GET /api/notas-venta/:id/pdf - Descargar PDF de la nota

### Health Check
- GET /health - Verificar estado del servicio

## Variables de Entorno
```env
PORT=3002
NODE_ENV=development
AWS_REGION=us-east-1
AWS_PROFILE=default
S3_BUCKET_NAME=746241-esi3898k-examen2
NOTAS_VENTA_TABLE=NotasVenta
CONTENIDO_NOTA_TABLE=ContenidoNota
METADATOS_NOTAS_TABLE=MetadatosNotas
CATALOGOS_SERVICE_URL=http://localhost:3001
NOTIFICACIONES_SERVICE_URL=http://localhost:3003
API_BASE_URL=http://localhost:3002
```

## Comunicación con otros Microservicios

Este microservicio se comunica con:
- Microservicio de Catálogos (puerto 3001) - Para validar clientes, domicilios y productos
- Microservicio de Notificaciones (puerto 3003) - Para enviar correos electrónicos

## Puerto

El servicio corre en el puerto 3002 por defecto.

## Flujo de Creación de Nota

1. Recibe solicitud con datos de la nota
2. Valida cliente, domicilios y productos con el microservicio de Catálogos
3. Crea registros en DynamoDB (nota, contenidos, metadatos)
4. Genera PDF con PDFKit
5. Sube PDF a S3
6. Envía notificación al cliente via microservicio de Notificaciones
7. Retorna información de la nota creada