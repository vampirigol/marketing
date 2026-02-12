import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import {
  CatalogoData,
  CatalogoDoctor,
  catalogoService,
} from '../lib/catalogo.service';
import { citasService } from '../lib/citas.service';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicAppointment'>;

export default function PublicAppointmentScreen({ navigation }: Props) {
  const [step, setStep] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  >(1);
  const [catalogo, setCatalogo] = useState<CatalogoData | null>(null);
  const [sucursalesBase, setSucursalesBase] = useState<CatalogoData['sucursales']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sucursalId, setSucursalId] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  const [slots, setSlots] = useState<Array<{ hora: string; disponible: boolean }>>([]);
  const [buscandoSlots, setBuscandoSlots] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [preMotivo, setPreMotivo] = useState('');
  const [preSintomas, setPreSintomas] = useState('');
  const [preNotas, setPreNotas] = useState('');
  const [preDocs, setPreDocs] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarSelectorMes, setMostrarSelectorMes] = useState(false);
  const [selectorAnio, setSelectorAnio] = useState(new Date().getFullYear());

  const daySwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 10,
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 30) return;
        const base = fecha || formatearFecha(new Date());
        const next = sumarDias(base, gesture.dx > 0 ? -1 : 1);
        setFecha(next);
      },
    })
  ).current;

  useEffect(() => {
    let isMounted = true;
    const cargarCatalogo = async () => {
      try {
        setLoading(true);
        const data = await catalogoService.obtenerCatalogo();
        if (isMounted) {
          setCatalogo(data);
          setSucursalesBase(data.sucursales);
        }
      } catch {
        if (isMounted) {
          setError('No se pudo cargar el catalogo');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void cargarCatalogo();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const filtrarPorSucursal = async () => {
      if (!sucursalId) return;
      try {
        const data = await catalogoService.obtenerCatalogo(sucursalId);
        if (isMounted) {
          setCatalogo({
            ...data,
            sucursales: sucursalesBase.length ? sucursalesBase : data.sucursales,
          });
        }
      } catch {
        if (isMounted) {
          setError('No se pudo filtrar el catalogo');
        }
      }
    };

    void filtrarPorSucursal();
    return () => {
      isMounted = false;
    };
  }, [sucursalId, sucursalesBase]);

  useEffect(() => {
    blurActiveElement();
  }, [mostrarModal, mostrarSelectorMes]);

  const doctoresFiltrados = useMemo<CatalogoDoctor[]>(() => {
    if (!catalogo) return [];
    if (!sucursalId && !especialidadId) return catalogo.doctores;
    return catalogo.doctores.filter((doc) => {
      if (sucursalId && doc.sucursalId !== sucursalId) return false;
      if (especialidadId && doc.especialidadId !== especialidadId) return false;
      return true;
    });
  }, [catalogo, sucursalId, especialidadId]);

  const serviciosFiltrados = useMemo(() => {
    if (!catalogo || !especialidadId) return [];
    return catalogo.servicios.filter(
      (srv) => srv.especialidadId === especialidadId
    );
  }, [catalogo, especialidadId]);

  const sucursalSeleccionada = useMemo(
    () => catalogo?.sucursales.find((suc) => suc.id === sucursalId),
    [catalogo, sucursalId]
  );
  const especialidadSeleccionada = useMemo(
    () => catalogo?.especialidades.find((esp) => esp.id === especialidadId),
    [catalogo, especialidadId]
  );
  const servicioSeleccionado = useMemo(
    () => catalogo?.servicios.find((srv) => srv.id === servicioId),
    [catalogo, servicioId]
  );
  const doctorSeleccionado = useMemo(
    () => catalogo?.doctores.find((doc) => doc.id === doctorId),
    [catalogo, doctorId]
  );
  const mesAnio = useMemo(() => obtenerMesAnio(fecha), [fecha]);

  const buscarDisponibilidad = async () => {
    if (!sucursalId || !fecha || !doctorId) {
      setError('Selecciona sucursal, doctor y fecha');
      return;
    }
    try {
      setError('');
      setBuscandoSlots(true);
      const doctor = doctorSeleccionado;
      const disponibilidad = await citasService.obtenerDisponibilidadPublica({
        sucursalId,
        doctorId: doctor?.nombre || undefined,
        fecha,
        inicio: doctor?.horario?.inicio,
        fin: doctor?.horario?.fin,
        intervaloMin: doctor?.horario?.intervaloMin,
        maxEmpalmes: doctor?.capacidadEmpalmes,
      });
      setSlots(disponibilidad);
    } catch {
      setError('No se pudo obtener disponibilidad');
    } finally {
      setBuscandoSlots(false);
    }
  };

  const agendar = async () => {
    if (
      !sucursalId ||
      !doctorId ||
      !especialidadId ||
      !fecha ||
      !horaSeleccionada ||
      !telefono ||
      !nombre
    ) {
      setError(
        'Completa sucursal, especialidad, doctor, fecha, hora, nombre y telefono'
      );
      return;
    }
    try {
      setError('');
      setEnviando(true);
      const sucursal = sucursalSeleccionada;
      const doctor = doctorSeleccionado;
      const especialidad = especialidadSeleccionada;

      if (!especialidad) {
        setError('Selecciona especialidad');
        return;
      }

      const fechaNacimiento = '1990-01-01';
      const edad = new Date().getFullYear() - 1990;
      const pacientePayload = {
        nombreCompleto: nombre,
        telefono,
        whatsapp: telefono,
        email: email || undefined,
        fechaNacimiento,
        edad,
        sexo: 'Otro' as const,
        noAfiliacion: `PUBLICO-${telefono}`,
        tipoAfiliacion: 'Particular' as const,
        ciudad: sucursal?.ciudad || 'Ciudad',
        estado: sucursal?.estado || 'Estado',
        origenLead: 'WhatsApp' as const,
      };

      const documentos = preDocs
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((url) => ({ url }));
      const preconsulta =
        preMotivo || preSintomas || preNotas
          ? {
              motivo: preMotivo || undefined,
              sintomas: preSintomas || undefined,
              notas: preNotas || undefined,
            }
          : undefined;

      const cita = await citasService.crearPublica({
        paciente: pacientePayload,
        sucursalId,
        fechaCita: fecha,
        horaCita: horaSeleccionada,
        tipoConsulta: 'Primera_Vez',
        especialidad: especialidad.nombre,
        medicoAsignado: doctor?.nombre,
        preconsulta,
        documentos: documentos.length ? documentos : undefined,
      });

      setConfirmacion(`Cita agendada: ${cita.id}`);
      setMostrarModal(true);
      setHoraSeleccionada('');
    } catch {
      setError('No se pudo agendar la cita');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando catalogo...</Text>
      </View>
    );
  }

  if (!catalogo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay catalogo disponible.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.outline}>
          <Text style={styles.outlineText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Modal animationType="fade" transparent visible={mostrarModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cita agendada correctamente</Text>
            <Text style={styles.modalSubtitle}>
              Tu cita quedo registrada. Puedes volver al menu principal.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setMostrarModal(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'PublicHome' }],
                });
              }}
            >
              <Text style={styles.primaryButtonText}>Confirmar cita</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Agendar cita</Text>
        <Text style={styles.subtitle}>Paso {step} de 11</Text>

      <View style={styles.stepRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => (
          <View
            key={`step-${value}`}
            style={[styles.stepDot, step >= value && styles.stepDotActive]}
          />
        ))}
      </View>

      {step === 1 ? (
        <>
          <Text style={styles.sectionTitle}>Sucursal</Text>
          <View style={styles.chips}>
            {sucursalesBase.map((suc) => (
              <Pressable
                key={suc.id}
                style={[
                  styles.chip,
                  sucursalId === suc.id && styles.chipActive,
                ]}
                onPress={() => {
                  setSucursalId(suc.id);
                  setEspecialidadId('');
                  setDoctorId('');
                  setServicioId('');
                  setSlots([]);
                  setHoraSeleccionada('');
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    sucursalId === suc.id && styles.chipTextActive,
                  ]}
                >
                  {suc.nombre}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.primaryButton, styles.nextButton]}
            onPress={() => {
              if (!sucursalId) {
                setError('Selecciona una sucursal');
                return;
              }
              setError('');
              setStep(2);
            }}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </Pressable>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.sectionTitle}>Especialidad</Text>
          <View style={styles.chips}>
            {catalogo.especialidades.map((esp) => (
              <Pressable
                key={esp.id}
                style={[
                  styles.chip,
                  especialidadId === esp.id && styles.chipActive,
                ]}
                onPress={() => {
                  setEspecialidadId(esp.id);
                  setDoctorId('');
                  setServicioId('');
                  setSlots([]);
                  setHoraSeleccionada('');
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    especialidadId === esp.id && styles.chipTextActive,
                  ]}
                >
                  {esp.nombre}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(1)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!especialidadId) {
                  setError('Selecciona una especialidad');
                  return;
                }
                setError('');
                setStep(3);
              }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Text style={styles.sectionTitle}>Servicio</Text>
          <View style={styles.chips}>
            {serviciosFiltrados.map((srv) => (
              <Pressable
                key={srv.id}
                style={[
                  styles.chip,
                  servicioId === srv.id && styles.chipActive,
                ]}
                onPress={() => setServicioId(srv.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    servicioId === srv.id && styles.chipTextActive,
                  ]}
                >
                  {srv.nombre}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(2)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setStep(4)}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Text style={styles.sectionTitle}>Doctor</Text>
          <View style={styles.chips}>
            {doctoresFiltrados.map((doc) => (
              <Pressable
                key={doc.id}
                style={[
                  styles.chip,
                  doctorId === doc.id && styles.chipActive,
                ]}
                onPress={() => {
                  setDoctorId(doc.id);
                  setSlots([]);
                  setHoraSeleccionada('');
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    doctorId === doc.id && styles.chipTextActive,
                  ]}
                >
                  {doc.nombre}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(3)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!doctorId) {
                  setError('Selecciona un doctor');
                  return;
                }
                setError('');
                setStep(5);
              }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <Text style={styles.sectionTitle}>Fecha</Text>
          <Text style={styles.selectedDateText}>
            Fecha seleccionada: {fecha || 'Selecciona un dia'}
          </Text>
          <View style={styles.monthPickerRow}>
            <Pressable
              style={styles.monthPickerButton}
              onPress={() => setFecha(cambiarMes(fecha, -1))}
            >
              <Text style={styles.monthPickerButtonText}>‹</Text>
            </Pressable>
            <Pressable
              style={styles.monthPickerCenter}
              onPress={() => {
                setSelectorAnio(mesAnio.anio);
                setMostrarSelectorMes(true);
              }}
            >
              <Text style={styles.monthPickerTitle}>{`${mesAnio.mes} ${mesAnio.anio}`}</Text>
              <Text style={styles.monthPickerSubtitle}>Seleccionar mes</Text>
            </Pressable>
            <Pressable
              style={styles.monthPickerButton}
              onPress={() => setFecha(cambiarMes(fecha, 1))}
            >
              <Text style={styles.monthPickerButtonText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.monthHeaderRow}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.monthHeaderText}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid} {...daySwipe.panHandlers}>
            {obtenerMesConOffset(fecha).map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.monthCellEmpty} />;
              }
              return (
                <Pressable
                  key={day.value}
                  style={[
                    styles.monthCell,
                    day.value === fecha && styles.monthCellActive,
                  ]}
                  onPress={() => setFecha(day.value)}
                >
                  <Text style={styles.monthDay}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.primaryButton} onPress={buscarDisponibilidad}>
            {buscandoSlots ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Buscar horarios</Text>
            )}
          </Pressable>

          {slots.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Horarios disponibles</Text>
              <View style={styles.chips}>
                {slots
                  .filter((slot) => slot.disponible)
                  .map((slot) => (
                    <Pressable
                      key={slot.hora}
                      style={[
                        styles.chip,
                        horaSeleccionada === slot.hora && styles.chipActive,
                      ]}
                      onPress={() => setHoraSeleccionada(slot.hora)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          horaSeleccionada === slot.hora && styles.chipTextActive,
                        ]}
                      >
                        {slot.hora}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(4)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!fecha || !horaSeleccionada) {
                  setError('Selecciona fecha y horario');
                  return;
                }
                setError('');
                setStep(6);
              }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Modal animationType="fade" transparent visible={mostrarSelectorMes}>
        <View style={styles.monthModalBackdrop}>
          <View style={styles.monthModalCard}>
            <Text style={styles.monthModalTitle}>Seleccionar mes</Text>
            <View style={styles.monthYearRow}>
              <Pressable
                style={styles.monthYearButton}
                onPress={() => setSelectorAnio((prev) => prev - 1)}
              >
                <Text style={styles.monthYearButtonText}>−</Text>
              </Pressable>
              <Text style={styles.monthYearText}>{selectorAnio}</Text>
              <Pressable
                style={styles.monthYearButton}
                onPress={() => setSelectorAnio((prev) => prev + 1)}
              >
                <Text style={styles.monthYearButtonText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.monthGridSelector}>
              {MESES.map((mes, index) => (
                <Pressable
                  key={mes}
                  style={[
                    styles.monthChip,
                    mesAnio.indiceMes === index && selectorAnio === mesAnio.anio && styles.monthChipActive,
                  ]}
                  onPress={() => {
                    setFecha(actualizarMesAnio(fecha, index, selectorAnio));
                    setMostrarSelectorMes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      mesAnio.indiceMes === index && selectorAnio === mesAnio.anio && styles.monthChipTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.monthModalClose} onPress={() => setMostrarSelectorMes(false)}>
              <Text style={styles.monthModalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {step === 6 ? (
        <>
          <Text style={styles.sectionTitle}>Nombre del paciente</Text>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu nombre completo"
            value={nombre}
            onChangeText={setNombre}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(5)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!nombre.trim()) {
                  setError('Nombre requerido');
                  return;
                }
                setError('');
                setStep(7);
              }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 7 ? (
        <>
          <Text style={styles.sectionTitle}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo (opcional)"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(6)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setStep(8)}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 8 ? (
        <>
          <Text style={styles.sectionTitle}>Telefono</Text>
          <TextInput
            style={styles.input}
            placeholder="Telefono"
            value={telefono}
            onChangeText={setTelefono}
          />
          <Text style={styles.helper}>
            El telefono es obligatorio para poder agendar.
          </Text>
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(7)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (!telefono) {
                  setError('Telefono requerido');
                  return;
                }
                setError('');
                setStep(9);
              }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 9 ? (
        <>
          <Text style={styles.sectionTitle}>Preconsulta</Text>
          <TextInput
            style={styles.input}
            placeholder="Motivo de consulta (opcional)"
            value={preMotivo}
            onChangeText={setPreMotivo}
          />
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Sintomas principales (opcional)"
            value={preSintomas}
            onChangeText={setPreSintomas}
            multiline
          />
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Notas adicionales (opcional)"
            value={preNotas}
            onChangeText={setPreNotas}
            multiline
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(8)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setStep(10)}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 10 ? (
        <>
          <Text style={styles.sectionTitle}>Documentos previos</Text>
          <Text style={styles.helper}>
            Agrega links de resultados o documentos (uno por linea).
          </Text>
          <TextInput
            style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
            placeholder="https://archivo.com/resultado.pdf"
            value={preDocs}
            onChangeText={setPreDocs}
            multiline
            autoCapitalize="none"
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(9)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setStep(11)}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 11 ? (
        <>
          <Text style={styles.sectionTitle}>Confirmacion</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Resumen de la cita</Text>
              <Text style={styles.summarySubtitle}>
                Verifica que la informacion sea correcta.
              </Text>
            </View>

            <View style={styles.summaryBlock}>
              <Text style={styles.summaryBlockTitle}>Datos de la cita</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sucursal</Text>
                <Text style={styles.summaryValue}>
                  {sucursalSeleccionada?.nombre || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Especialidad</Text>
                <Text style={styles.summaryValue}>
                  {especialidadSeleccionada?.nombre || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicio</Text>
                <Text style={styles.summaryValue}>
                  {servicioSeleccionado?.nombre || 'General'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor</Text>
                <Text style={styles.summaryValue}>
                  {doctorSeleccionado?.nombre || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha y hora</Text>
                <Text style={styles.summaryValue}>
                  {fecha} · {horaSeleccionada}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBlock}>
              <Text style={styles.summaryBlockTitle}>Datos del paciente</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paciente</Text>
                <Text style={styles.summaryValue}>{nombre || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Correo</Text>
                <Text style={styles.summaryValue}>{email || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Telefono</Text>
                <Text style={styles.summaryValue}>{telefono}</Text>
              </View>
            </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockTitle}>Preconsulta</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Motivo</Text>
              <Text style={styles.summaryValue}>{preMotivo || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sintomas</Text>
              <Text style={styles.summaryValue}>{preSintomas || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Notas</Text>
              <Text style={styles.summaryValue}>{preNotas || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Documentos</Text>
              <Text style={styles.summaryValue}>
                {preDocs
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean).length || 0}
              </Text>
            </View>
          </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {confirmacion ? (
            <Text style={styles.successText}>{confirmacion}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setStep(10)}>
              <Text style={styles.secondaryButtonText}>Atras</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, enviando && styles.buttonDisabled]}
              onPress={agendar}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Agendar cita</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : null}
      </ScrollView>
    </>
  );
}

const obtenerMesConOffset = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const startDay = first.getDay(); // domingo=0
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const dias: Array<{ label: string; value: string } | null> = [];
  for (let i = 0; i < startDay; i++) dias.push(null);
  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(base.getFullYear(), base.getMonth(), day);
    dias.push({ label: String(day), value: formatearFecha(date) });
  }
  return dias;
};

const formatearFecha = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const blurActiveElement = () => {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  active?.blur?.();
};

const parseLocalDate = (fecha?: string) => {
  if (!fecha) return new Date();
  const [yyyy, mm, dd] = fecha.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const sumarDias = (fecha: string, delta: number) => {
  const base = parseLocalDate(fecha);
  base.setDate(base.getDate() + delta);
  return formatearFecha(base);
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const obtenerMesAnio = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const indiceMes = base.getMonth();
  return { mes: MESES[indiceMes], anio: base.getFullYear(), indiceMes };
};

const actualizarMesAnio = (fecha: string, mes: number, anio: number) => {
  const base = parseLocalDate(fecha);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const dia = Math.min(base.getDate(), ultimoDia);
  return formatearFecha(new Date(anio, mes, dia));
};

const cambiarMes = (fecha: string, delta: number) => {
  const base = parseLocalDate(fecha);
  const anio = base.getFullYear();
  const mes = base.getMonth();
  const nuevo = new Date(anio, mes + delta, 1);
  return actualizarMesAnio(fecha, nuevo.getMonth(), nuevo.getFullYear());
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f6f7fb',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7fb',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  stepDot: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
  },
  selectedDateText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#111827',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButton: {
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#eef2f7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  helper: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 8,
  },
  successText: {
    color: '#16a34a',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  summaryHeader: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryBlock: {
    gap: 8,
  },
  summaryBlockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  monthHeaderText: {
    width: 36,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  monthCell: {
    width: 36,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  monthCellActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  monthCellEmpty: {
    width: 36,
    height: 44,
  },
  monthDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  monthPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  monthPickerButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  monthPickerButtonText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  monthPickerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  monthPickerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  monthModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  monthModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  monthModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  monthYearButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  monthGridSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  monthChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  monthChipTextActive: {
    color: '#ffffff',
  },
  monthModalClose: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  monthModalCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 12,
    backgroundColor: '#ffffff',
  },
  outlineText: {
    color: '#111827',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 16,
  },
});
