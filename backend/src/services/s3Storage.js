import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Configurar cliente S3 para Oracle Cloud Object Storage (S3 Compatible)
const s3Client = new S3Client({
	region: process.env.AWS_S3_REGION_NAME || "us-ashburn-1",
	endpoint: process.env.AWS_S3_ENDPOINT_URL,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	forcePathStyle: true, // Necesario para Oracle Cloud
});

const BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME;

/**
 * Sube una imagen al bucket de Oracle Cloud
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} mimetype - Tipo MIME del archivo
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadImage = async (fileBuffer, fileName, mimetype) => {
	try {
		// Generar nombre único para evitar conflictos
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const extension = fileName.split(".").pop();
		const key = `products/${timestamp}-${randomString}.${extension}`;

		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: fileBuffer,
			ContentType: mimetype,
			// Nota: Oracle Cloud Object Storage no soporta ACL como AWS S3
			// El bucket debe estar configurado como público o usar pre-authenticated requests
		});

		await s3Client.send(command);

		// Construir URL pública
		const publicUrl = `${process.env.AWS_S3_ENDPOINT_URL}/${BUCKET_NAME}/${key}`;
		return publicUrl;
	} catch (error) {
		console.error("Error uploading image to S3:", error);
		throw new Error("Error al subir la imagen");
	}
};

/**
 * Elimina una imagen del bucket
 * @param {string} imageUrl - URL completa de la imagen
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageUrl) => {
	try {
		// Extraer la key de la URL
		// URL formato: https://endpoint/bucket/key
		const urlParts = imageUrl.split("/");
		const keyIndex = urlParts.findIndex((part) => part === BUCKET_NAME) + 1;
		const key = urlParts.slice(keyIndex).join("/");

		if (!key) {
			throw new Error("No se pudo extraer la key de la URL");
		}

		const command = new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);
	} catch (error) {
		console.error("Error deleting image from S3:", error);
		// No lanzar error para no romper el flujo si la imagen no existe
	}
};

