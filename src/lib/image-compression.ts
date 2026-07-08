import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

/**
 * Comprime una imagen localmente en el navegador antes de subirla a Cloudinary.
 * Rechaza archivos que no sean imágenes (como videos o documentos).
 * 
 * @param file Archivo original seleccionado por el usuario
 * @param options Opciones adicionales para la compresión
 * @returns Promesa que resuelve al archivo de imagen comprimido
 */
export async function compressLocalImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Validar estrictamente que sea una imagen (no videos, no pdfs, etc.)
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen (.jpg, .jpeg, .png, .webp). Los videos no están permitidos.');
  }

  // Opciones de compresión por defecto optimizadas para Alamanov2 (visualización premium pero ligera)
  const defaultOptions = {
    maxSizeMB: 0.8, // Apuntar a un tamaño máximo de 800KB
    maxWidthOrHeight: 1200, // Redimensionar el lado más largo a un máximo de 1200px
    useWebWorker: true,
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, finalOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error al realizar la compresión local de la imagen:', error);
    // En caso de error, retornamos el archivo original como fallback
    return file;
  }
}
