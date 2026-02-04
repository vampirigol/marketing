'use client';

import { useState, useEffect } from 'react';
import ContactarAgenteForm from '@/components/contacto/ContactarAgenteForm';

export default function ContactoPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/catalogo');
      const data = await response.json();
      if (data.success) {
        setSucursales(data.catalogo.sucursales);
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (solicitudId: string) => {
    console.log('Solicitud creada:', solicitudId);
    // Aquí podrías redirigir o mostrar un mensaje adicional
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ContactarAgenteForm sucursales={sucursales} onSuccess={handleSuccess} />
    </div>
  );
}
