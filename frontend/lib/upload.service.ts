const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ArchivoSubido {
  nombre: string;
  nombreGuardado: string;
  tipo: string;
  tamano: number;
  url: string;
}

export const uploadService = {
  /**
   * Sube un archivo para usar en mensajes
   */
  async subirArchivoMensaje(
    file: File,
    token: string
  ): Promise<ArchivoSubido> {
    const formData = new FormData();
    formData.append("archivo", file);

    const res = await fetch(`${API_URL}/upload/mensaje`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al subir archivo");
    }

    const data = await res.json();
    return data.archivo;
  },

  /**
   * Sube múltiples archivos
   */
  async subirMultiplesArchivos(
    files: File[],
    token: string
  ): Promise<ArchivoSubido[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("archivos", file);
    });

    const res = await fetch(`${API_URL}/upload/multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al subir archivos");
    }

    const data = await res.json();
    return data.archivos;
  },

  /**
   * Sube avatar/foto de perfil
   */
  async subirAvatar(file: File, token: string): Promise<ArchivoSubido> {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_URL}/upload/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al subir avatar");
    }

    const data = await res.json();
    return data.avatar;
  },

  /**
   * Valida un archivo antes de subir
   */
  validarArchivo(file: File): { valido: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/ogg",
      "audio/webm",
      "audio/wav",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (file.size > MAX_SIZE) {
      return {
        valido: false,
        error: "El archivo es demasiado grande (máximo 10MB)",
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valido: false,
        error: `Tipo de archivo no permitido: ${file.type}`,
      };
    }

    return { valido: true };
  },
};
