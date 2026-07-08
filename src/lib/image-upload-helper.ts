import { createBrowserClient } from './supabase/client';

/**
 * Helper de subida de imágenes para Alamanov2.
 * Intenta subir a Cloudinary si está configurado; de lo contrario, 
 * intenta subir a Supabase Storage; si ninguno está configurado, 
 * genera URLs placeholder estéticas (para facilitar pruebas sin credenciales).
 * 
 * @param file Archivo comprimido a subir
 * @param bucketName Nombre de la carpeta/bucket (ej. 'avatars', 'portfolio')
 * @returns Promesa con la URL final de la imagen
 */
export async function uploadImage(file: File, bucketName: string): Promise<string> {
  const isCloudinaryConfigured = 
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // --- Caso A: Subida a Cloudinary (Método principal) ---
  if (isCloudinaryConfigured) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append('folder', `alamanov2/${bucketName}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error en la respuesta de Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error al subir a Cloudinary, intentando fallback...', error);
    }
  }

  // --- Caso B: Fallback a Supabase Storage ---
  try {
    const supabase = createBrowserClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${bucketName}/${fileName}`;

    // Subir archivo al bucket de Supabase
    // Nota: El bucket debe estar configurado como público en Supabase
    const { data, error } = await supabase.storage
      .from('public_assets')
      .upload(filePath, file);

    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from('public_assets')
        .getPublicUrl(filePath);
      return publicUrl;
    }
  } catch (error) {
    console.error('Error al subir a Supabase Storage, intentando fallback a mock...', error);
  }

  // --- Caso C: Fallback a Mock Estético (Para pruebas sin configuración) ---
  console.warn('Utilizando URLs de prueba (Mock) debido a la falta de configuraciones en .env.local');
  const mockKeywords: Record<string, string> = {
    avatars: 'face,portrait,user',
    portfolio: 'work,tool,construction,tech,design'
  };
  const keyword = mockKeywords[bucketName] || 'work';
  const randomId = Math.floor(Math.random() * 1000);
  
  return `https://images.unsplash.com/photo-${randomId % 2 === 0 ? '1521791136064-7986c2959213' : '1531403009284-440f080d1e12'}?auto=format&fit=crop&q=80&w=400&h=400&q=80`;
}
