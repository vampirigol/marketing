import { useState } from 'react';

export default function AgendarCitaDemo() {
  const [form, setForm] = useState({
    pacienteNombre: '',
    doctor: '',
    especialidad: '',
    fecha: '',
    hora: '',
    sucursal: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess('Cita agendada correctamente');
      setForm({ pacienteNombre: '', doctor: '', especialidad: '', fecha: '', hora: '', sucursal: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4 mt-8">
      <h2 className="text-xl font-bold mb-2">Agendar Cita Demo</h2>
      <input name="pacienteNombre" value={form.pacienteNombre} onChange={handleChange} placeholder="Nombre del paciente" className="w-full border p-2 rounded" required />
      <input name="doctor" value={form.doctor} onChange={handleChange} placeholder="Doctor" className="w-full border p-2 rounded" required />
      <input name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Especialidad" className="w-full border p-2 rounded" />
      <input name="fecha" value={form.fecha} onChange={handleChange} type="date" className="w-full border p-2 rounded" required />
      <input name="hora" value={form.hora} onChange={handleChange} type="time" className="w-full border p-2 rounded" required />
      <input name="sucursal" value={form.sucursal} onChange={handleChange} placeholder="Sucursal" className="w-full border p-2 rounded" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50" disabled={loading}>{loading ? 'Agendando...' : 'Agendar'}</button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </form>
  );
}
