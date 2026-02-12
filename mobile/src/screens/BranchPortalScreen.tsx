import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  actualizarFotoPerfil,
  cambiarPassword,
  limpiarToken,
  obtenerUsuarioActual,
  UsuarioAuth,
} from '../lib/auth.service';
import { catalogoService } from '../lib/catalogo.service';
import { crmService, Lead, LeadStatus } from '../lib/crm.service';
import { matrixService, ConversacionDetalle, ConversacionResumen } from '../lib/matrix.service';
import { portalService, PortalNoticia, PortalTarea } from '../lib/portal.service';

const TABS = ['CRM', 'Tareas', 'Chats', 'Noticias', 'Menú'] as const;
type TabKey = (typeof TABS)[number];
const CRM_TABS = ['Negociaciones', 'Contactos', 'Compañías'] as const;
type CrmTabKey = (typeof CRM_TABS)[number];

const STATUS_LABELS: Record<string, string> = {
  new: 'Lead',
  reviewing: 'Prospecto',
  'in-progress': 'Cita pendiente',
  'agendados-mobile': 'Agendados Mobile',
  open: 'Confirmada',
  qualified: 'Cierre',
};
const STATUS_ORDER: LeadStatus[] = ['new', 'reviewing', 'in-progress', 'agendados-mobile', 'open', 'qualified'];

type Props = NativeStackScreenProps<RootStackParamList, 'BranchPortal'>;

export default function BranchPortalScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('CRM');
  const [crmTab, setCrmTab] = useState<CrmTabKey>('Negociaciones');
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState('Sucursal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPanel, setLeadPanel] = useState<'comentarios' | 'timeline'>('comentarios');
  const [crmSearch, setCrmSearch] = useState('');
  const [showCrmSearch, setShowCrmSearch] = useState(false);
  const [showCrmFilters, setShowCrmFilters] = useState(false);
  const [crmStatusFilter, setCrmStatusFilter] = useState<LeadStatus | null>(null);
  const [crmSort, setCrmSort] = useState<'recientes' | 'antiguas'>('recientes');
  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<ConversacionDetalle | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [tareas, setTareas] = useState<PortalTarea[]>([]);
  const [noticias, setNoticias] = useState<PortalNoticia[]>([]);
  const [comentariosDraft, setComentariosDraft] = useState<Record<string, string>>({});
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState(true);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const cargarUsuario = async () => {
      try {
        const me = await obtenerUsuarioActual();
        if (!mounted) return;
        setUsuario(me);
        if (me.fotoUrl) setFotoPerfil(me.fotoUrl);
        const catalogo = await catalogoService.obtenerCatalogo();
        const sucursal = catalogo.sucursales.find((suc) => suc.id === me.sucursalId);
        if (sucursal?.nombre) setSucursalNombre(sucursal.nombre);
      } catch {
        if (mounted) setError('No se pudo cargar el perfil de sucursal');
      }
    };
    void cargarUsuario();
    void (async () => {
      const saved = await AsyncStorage.getItem('notifications_enabled');
      if (saved !== null) {
        setNotificaciones(saved === 'true');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    let mounted = true;
    const cargarTab = async () => {
      try {
        setLoading(true);
        setError('');
        if (activeTab === 'CRM') {
          const data = await crmService.obtenerLeads(usuario.sucursalId);
          if (mounted) setLeads(data);
        }
        if (activeTab === 'Chats') {
          const data = await matrixService.listarConversaciones();
          if (mounted) setConversaciones(data);
        }
        if (activeTab === 'Noticias') {
          const data = await portalService.obtenerNoticias();
          if (mounted) setNoticias(data);
        }
        if (activeTab === 'Tareas') {
          const data = await portalService.obtenerTareas();
          if (mounted) setTareas(data);
        }
      } catch {
        if (mounted) setError('No se pudo cargar la información del portal');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void cargarTab();
    return () => {
      mounted = false;
    };
  }, [activeTab, usuario]);

  const leadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const crmLeads = useMemo(() => {
    let data = leads;
    if (crmStatusFilter) {
      data = data.filter((lead) => lead.status === crmStatusFilter);
    }
    if (crmSearch.trim()) {
      const term = crmSearch.trim().toLowerCase();
      data = data.filter((lead) =>
        `${lead.nombre} ${lead.email || ''} ${lead.telefono || ''}`.toLowerCase().includes(term)
      );
    }
    const sorted = [...data].sort((a, b) => {
      const aDate = new Date(a.customFields?.FechaUltimoEstado as string || 0).getTime();
      const bDate = new Date(b.customFields?.FechaUltimoEstado as string || 0).getTime();
      if (crmSort === 'recientes') return bDate - aDate;
      return aDate - bDate;
    });
    return sorted;
  }, [leads, crmSearch, crmSort, crmStatusFilter]);

  const actualizarLead = async (lead: Lead, status: LeadStatus) => {
    try {
      setLoading(true);
      const updated = await crmService.actualizarLead(lead.id, { status });
      setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedLead(updated);
    } catch {
      setError('No se pudo actualizar el lead');
    } finally {
      setLoading(false);
    }
  };

  const noticiasLocales = noticias.filter((item) => item.tipo === 'local');
  const noticiasGenerales = noticias.filter((item) => item.tipo === 'general');

  const cargarConversacion = async (id: string) => {
    try {
      setLoading(true);
      const data = await matrixService.obtenerConversacion(id);
      setConversacionActiva(data);
    } catch {
      setError('No se pudo cargar la conversación');
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async () => {
    if (!conversacionActiva || !mensaje.trim()) return;
    try {
      setLoading(true);
      await matrixService.enviarMensaje(conversacionActiva.id, mensaje.trim());
      setMensaje('');
      const data = await matrixService.obtenerConversacion(conversacionActiva.id);
      setConversacionActiva(data);
    } catch {
      setError('No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const actualizarTareas = (tareaActualizada: PortalTarea) => {
    setTareas((prev) => prev.map((task) => (task.id === tareaActualizada.id ? tareaActualizada : task)));
  };

  const tomarEvidencia = async (tareaId: string) => {
    try {
      setSubiendoId(tareaId);
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setError('Permiso denegado para acceder a las imagenes');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.6,
      });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const nombre = asset.fileName || `evidencia-${Date.now()}.jpg`;
      const tipo = 'imagen' as const;
      const dataUri = asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : undefined;
      const url = asset.base64 ? undefined : asset.uri;
      const tarea = await portalService.agregarEvidencia({
        id: tareaId,
        nombre,
        tipo,
        dataUri,
        url,
      });
      actualizarTareas(tarea);
    } catch {
      setError('No se pudo subir la evidencia');
    } finally {
      setSubiendoId(null);
    }
  };

  const cerrarSesion = async () => {
    await limpiarToken();
    navigation.replace('DoctorLogin');
  };

  const cambiarCuenta = async () => {
    await limpiarToken();
    navigation.replace('DoctorLogin');
  };

  const cambiarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setError('Permiso denegado para acceder a las imagenes');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.6,
      });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const dataUri = asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;
      const updated = await actualizarFotoPerfil(dataUri);
      setUsuario(updated);
      setFotoPerfil(dataUri);
    } catch {
      setError('No se pudo actualizar la foto');
    }
  };

  const actualizarNotificaciones = async (value: boolean) => {
    setNotificaciones(value);
    await AsyncStorage.setItem('notifications_enabled', String(value));
  };

  const actualizarPassword = async () => {
    if (!passwordActual || !passwordNuevo) {
      setError('Completa la contraseña actual y la nueva');
      return;
    }
    if (passwordNuevo !== passwordConfirm) {
      setError('La confirmación no coincide');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await cambiarPassword({ passwordActual, passwordNuevo });
      setPasswordActual('');
      setPasswordNuevo('');
      setPasswordConfirm('');
      Alert.alert('Contraseña actualizada', 'La contraseña se actualizó correctamente');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portal CRM</Text>
          <Text style={styles.subtitle}>{sucursalNombre}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RCA</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab(tab);
              setConversacionActiva(null);
              setError('');
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'CRM' ? (
          <>
            <View style={styles.crmTopRow}>
              <Text style={styles.crmTitle}>CRM</Text>
              <View style={styles.crmActions}>
                <Pressable
                  style={styles.crmActionButton}
                  onPress={() => setShowCrmFilters((prev) => !prev)}
                >
                  <Text style={styles.crmActionText}>Filtros</Text>
                </Pressable>
                <Pressable
                  style={styles.crmActionButton}
                  onPress={() => setShowCrmSearch((prev) => !prev)}
                >
                  <Text style={styles.crmActionText}>Buscar</Text>
                </Pressable>
                <Pressable
                  style={styles.crmActionButton}
                  onPress={() =>
                    setCrmSort((prev) => (prev === 'recientes' ? 'antiguas' : 'recientes'))
                  }
                >
                  <Text style={styles.crmActionText}>
                    {crmSort === 'recientes' ? 'Recientes' : 'Antiguas'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.crmTabsRow}>
              {CRM_TABS.map((tab) => (
                <Pressable
                  key={tab}
                  style={[styles.crmTab, crmTab === tab && styles.crmTabActive]}
                  onPress={() => setCrmTab(tab)}
                >
                  <Text style={[styles.crmTabText, crmTab === tab && styles.crmTabTextActive]}>
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>

            {showCrmSearch ? (
              <TextInput
                style={styles.crmSearch}
                placeholder="Buscar por nombre, correo o telefono"
                value={crmSearch}
                onChangeText={setCrmSearch}
                placeholderTextColor="#94a3b8"
              />
            ) : null}

            {showCrmFilters ? (
              <View style={styles.crmFilters}>
                {STATUS_ORDER.map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.crmFilterChip,
                      crmStatusFilter === status && styles.crmFilterChipActive,
                    ]}
                    onPress={() =>
                      setCrmStatusFilter((prev) => (prev === status ? null : status))
                    }
                  >
                    <Text
                      style={[
                        styles.crmFilterText,
                        crmStatusFilter === status && styles.crmFilterTextActive,
                      ]}
                    >
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.crmPipeline}>
              <View>
                <Text style={styles.crmPipelineTitle}>Pipeline "{sucursalNombre}"</Text>
                <Text style={styles.crmPipelineMeta}>
                  {crmLeads.length} negociaciones activas
                </Text>
              </View>
              <Pressable
                style={styles.crmPipelineButton}
                onPress={() => Alert.alert('Pipeline', 'Selector de pipeline en preparación')}
              >
                <Text style={styles.crmPipelineButtonText}>Etapas</Text>
              </Pressable>
            </View>

            {crmTab === 'Negociaciones' ? (
              <>
                {selectedLead ? (
                  <View style={styles.crmDetailCard}>
                    <View style={styles.crmDetailHeader}>
                      <Text style={styles.crmDetailTitle}>{selectedLead.nombre}</Text>
                      <Pressable onPress={() => setSelectedLead(null)}>
                        <Text style={styles.linkText}>Cerrar</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.crmDetailMeta}>
                      {selectedLead.canal || selectedLead.customFields?.Origen || 'Sin canal'}
                    </Text>
                    <View style={styles.crmStatusRow}>
                      {STATUS_ORDER.map((status) => (
                        <Pressable
                          key={status}
                          style={[
                            styles.crmStatusChip,
                            selectedLead.status === status && styles.crmStatusChipActive,
                          ]}
                          onPress={() => actualizarLead(selectedLead, status)}
                        >
                          <Text
                            style={[
                              styles.crmStatusText,
                              selectedLead.status === status && styles.crmStatusTextActive,
                            ]}
                          >
                            {STATUS_LABELS[status]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.crmDetailRow}>
                      <Text style={styles.crmDetailLabel}>Cliente</Text>
                      <Text style={styles.crmDetailValue}>{selectedLead.nombre}</Text>
                    </View>
                    <View style={styles.crmDetailRow}>
                      <Text style={styles.crmDetailLabel}>Origen</Text>
                      <Text style={styles.crmDetailValue}>
                        {selectedLead.customFields?.Origen || selectedLead.canal || 'Sin origen'}
                      </Text>
                    </View>
                    <View style={styles.crmSubTabs}>
                      <Pressable
                        style={[
                          styles.crmSubTab,
                          leadPanel === 'comentarios' && styles.crmSubTabActive,
                        ]}
                        onPress={() => setLeadPanel('comentarios')}
                      >
                        <Text
                          style={[
                            styles.crmSubTabText,
                            leadPanel === 'comentarios' && styles.crmSubTabTextActive,
                          ]}
                        >
                          Comentarios
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.crmSubTab,
                          leadPanel === 'timeline' && styles.crmSubTabActive,
                        ]}
                        onPress={() => setLeadPanel('timeline')}
                      >
                        <Text
                          style={[
                            styles.crmSubTabText,
                            leadPanel === 'timeline' && styles.crmSubTabTextActive,
                          ]}
                        >
                          Timeline
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={styles.crmDetailNote}>
                      {leadPanel === 'comentarios'
                        ? 'Comentarios del canal y seguimiento en preparación.'
                        : 'Timeline de actividad en preparación.'}
                    </Text>
                  </View>
                ) : null}

                {crmLeads.map((lead) => (
                  <Pressable
                    key={lead.id}
                    style={styles.crmCard}
                    onPress={() => setSelectedLead(lead)}
                  >
                    <View style={styles.crmCardHeader}>
                      <Text style={styles.crmCardTitle}>{lead.nombre}</Text>
                      <Text style={styles.crmCardMeta}>
                        {lead.customFields?.Origen || lead.canal || 'Sin origen'}
                      </Text>
                    </View>
                    <View style={styles.crmCardFooter}>
                      <View style={styles.crmStatusBadge}>
                        <Text style={styles.crmStatusBadgeText}>
                          {STATUS_LABELS[lead.status]}
                        </Text>
                      </View>
                      <Text style={styles.crmCardSmall}>
                        {lead.telefono || lead.email || 'Sin contacto'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.crmFloating}
                  onPress={() => Alert.alert('CRM', 'Nueva negociación en preparación')}
                >
                  <Text style={styles.crmFloatingText}>+</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{crmTab}</Text>
                <Text style={styles.cardBody}>
                  Vista de {crmTab.toLowerCase()} en preparación para CRM móvil.
                </Text>
              </View>
            )}
          </>
        ) : null}

        {activeTab === 'Chats' ? (
          <>
            {conversacionActiva ? (
              <View style={styles.chatCard}>
                <View style={styles.chatHeader}>
                  <Pressable onPress={() => setConversacionActiva(null)}>
                    <Text style={styles.linkText}>Volver</Text>
                  </Pressable>
                  <Text style={styles.chatTitle}>{conversacionActiva.nombreContacto}</Text>
                </View>
                <View style={styles.chatMessages}>
                  {conversacionActiva.mensajes.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.messageBubble,
                        msg.esDeKeila ? styles.messageOutgoing : styles.messageIncoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.esDeKeila ? styles.messageTextOutgoing : styles.messageTextIncoming,
                        ]}
                      >
                        {msg.contenido}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Escribe un mensaje"
                    value={mensaje}
                    onChangeText={setMensaje}
                  />
                  <Pressable style={styles.chatSend} onPress={enviarMensaje}>
                    <Text style={styles.chatSendText}>Enviar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {conversaciones.map((conv) => (
                  <Pressable
                    key={conv.id}
                    style={styles.card}
                    onPress={() => cargarConversacion(conv.id)}
                  >
                    <Text style={styles.cardTitle}>{conv.nombreContacto}</Text>
                    <Text style={styles.cardBody}>{conv.ultimoMensaje}</Text>
                    <Text style={styles.cardMeta}>
                      {conv.canal} · {conv.mensajesNoLeidos} sin leer
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </>
        ) : null}

        {activeTab === 'Noticias' ? (
          <>
            <Text style={styles.sectionTitle}>Noticias locales</Text>
            {noticiasLocales.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardBody}>{item.contenido}</Text>
              </View>
            ))}
            <Text style={styles.sectionTitle}>Noticias generales</Text>
            {noticiasGenerales.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardBody}>{item.contenido}</Text>
              </View>
            ))}
          </>
        ) : null}

        {activeTab === 'Tareas' ? (
          <>
            {tareas.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.cardTitle}>{task.titulo}</Text>
                  <Text style={styles.taskStatus}>{task.estado}</Text>
                </View>
                <Text style={styles.cardBody}>{task.descripcion}</Text>
                <Text style={styles.taskMeta}>Prioridad: {task.prioridad}</Text>

                <View style={styles.taskActions}>
                  {task.estado === 'pendiente' ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={async () => actualizarTareas(await portalService.recibirTarea(task.id))}
                    >
                      <Text style={styles.actionButtonText}>Recibir</Text>
                    </Pressable>
                  ) : null}
                  {task.estado === 'recibida' ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={async () => actualizarTareas(await portalService.iniciarTarea(task.id))}
                    >
                      <Text style={styles.actionButtonText}>Iniciar</Text>
                    </Pressable>
                  ) : null}
                  {task.estado === 'en_progreso' ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={async () => actualizarTareas(await portalService.terminarTarea(task.id))}
                    >
                      <Text style={styles.actionButtonText}>Terminar</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.commentSection}>
                  <Text style={styles.sectionTitle}>Comentarios</Text>
                  {task.comentarios.length === 0 ? (
                    <Text style={styles.emptyText}>Sin comentarios</Text>
                  ) : (
                    task.comentarios.map((comentario) => (
                      <Text key={comentario.id} style={styles.commentText}>
                        {comentario.autor}: {comentario.mensaje}
                      </Text>
                    ))
                  )}
                  <View style={styles.commentRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Agregar comentario"
                      value={comentariosDraft[task.id] || ''}
                      onChangeText={(value) =>
                        setComentariosDraft((prev) => ({ ...prev, [task.id]: value }))
                      }
                    />
                    <Pressable
                      style={styles.commentButton}
                      onPress={async () => {
                        const mensaje = (comentariosDraft[task.id] || '').trim();
                        if (!mensaje) return;
                        const updated = await portalService.agregarComentario(task.id, mensaje);
                        actualizarTareas(updated);
                        setComentariosDraft((prev) => ({ ...prev, [task.id]: '' }));
                      }}
                    >
                      <Text style={styles.commentButtonText}>Enviar</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.evidenceSection}>
                  <Text style={styles.sectionTitle}>Evidencias</Text>
                  <Pressable
                    style={styles.evidenceButton}
                    onPress={() => tomarEvidencia(task.id)}
                    disabled={subiendoId === task.id}
                  >
                    <Text style={styles.evidenceButtonText}>
                      {subiendoId === task.id ? 'Subiendo...' : 'Agregar evidencia'}
                    </Text>
                  </Pressable>
                  {task.evidencias.length === 0 ? (
                    <Text style={styles.emptyText}>Sin evidencias</Text>
                  ) : (
                    <View style={styles.evidenceList}>
                      {task.evidencias.map((evidencia) => (
                        <View key={evidencia.id} style={styles.evidenceItem}>
                          {evidencia.dataUri || evidencia.url ? (
                            <Image
                              source={{ uri: evidencia.dataUri || evidencia.url }}
                              style={styles.evidenceImage}
                            />
                          ) : null}
                          <Text style={styles.evidenceName}>{evidencia.nombre}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        ) : null}

        {activeTab === 'Menú' ? (
          <>
            <View style={styles.menuProfileCard}>
              <View style={styles.menuProfileRow}>
                <View style={styles.menuAvatar}>
                  {fotoPerfil ? (
                    <Image source={{ uri: fotoPerfil }} style={styles.menuAvatarImage} />
                  ) : null}
                </View>
                <View style={styles.menuProfileInfo}>
                  <Text style={styles.menuProfileName}>
                    {usuario?.nombreCompleto || 'Usuario'}
                  </Text>
                  <Text style={styles.menuProfileRole}>
                    {usuario?.rol || 'Sucursal'}
                  </Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Configuración</Text>
              <View style={styles.menuCard}>
                {['General', 'Menú inferior'].map((item) => (
                  <Pressable
                    key={item}
                    style={styles.menuItem}
                    onPress={() => Alert.alert(item, 'Funcionalidad en preparación')}
                  >
                    <Text style={styles.menuItemText}>{item}</Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </Pressable>
                ))}
                <View style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Notificaciones</Text>
                  <Switch
                    value={notificaciones}
                    onValueChange={actualizarNotificaciones}
                    thumbColor={notificaciones ? '#2563eb' : '#e5e7eb'}
                    trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>CRM</Text>
              <View style={styles.menuCard}>
                {['Llamar', 'Mis actividades', 'Gestión del inventario'].map((item) => (
                  <Pressable
                    key={item}
                    style={styles.menuItem}
                    onPress={() => Alert.alert(item, 'Funcionalidad en preparación')}
                  >
                    <Text style={styles.menuItemText}>{item}</Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Cuenta</Text>
              <View style={styles.menuCard}>
                {['Abrir la versión web'].map((item) => (
                  <Pressable
                    key={item}
                    style={styles.menuItem}
                    onPress={() => Alert.alert(item, 'Funcionalidad en preparación')}
                  >
                    <Text style={styles.menuItemText}>{item}</Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.menuItem} onPress={cambiarCuenta}>
                  <Text style={styles.menuItemText}>Cambiar de cuenta</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </Pressable>
                <Pressable
                  style={styles.menuItem}
                  onPress={cerrarSesion}
                >
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                    Cerrar sesión
                  </Text>
                  <Text style={[styles.menuChevron, styles.menuItemDanger]}>›</Text>
                </Pressable>
              </View>
            </View>

            {usuario?.rol === 'Admin' ? (
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Administración</Text>
                <View style={styles.menuCard}>
                  <Pressable style={styles.menuItem} onPress={cambiarFoto}>
                    <Text style={styles.menuItemText}>Cambiar foto de perfil</Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </Pressable>
                  <View style={styles.adminForm}>
                    <TextInput
                      style={styles.adminInput}
                      placeholder="Contraseña actual"
                      secureTextEntry
                      value={passwordActual}
                      onChangeText={setPasswordActual}
                    />
                    <TextInput
                      style={styles.adminInput}
                      placeholder="Nueva contraseña"
                      secureTextEntry
                      value={passwordNuevo}
                      onChangeText={setPasswordNuevo}
                    />
                    <TextInput
                      style={styles.adminInput}
                      placeholder="Confirmar nueva contraseña"
                      secureTextEntry
                      value={passwordConfirm}
                      onChangeText={setPasswordConfirm}
                    />
                    <Pressable style={styles.adminButton} onPress={actualizarPassword}>
                      <Text style={styles.adminButtonText}>Actualizar contraseña</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottomNav}>
        {TABS.map((tab) => (
          <Pressable
            key={`bottom-${tab}`}
            style={styles.bottomItem}
            onPress={() => {
              setActiveTab(tab);
              setConversacionActiva(null);
            }}
          >
            <Text
              style={[
                styles.bottomText,
                activeTab === tab && styles.bottomTextActive,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab ? <View style={styles.bottomIndicator} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  crmTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  crmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  crmActionButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  crmActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  crmTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  crmTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  crmTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  crmTabText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  crmTabTextActive: {
    color: '#ffffff',
  },
  crmSearch: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
  },
  crmFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  crmFilterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  crmFilterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  crmFilterText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  crmFilterTextActive: {
    color: '#ffffff',
  },
  crmPipeline: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crmPipelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  crmPipelineMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  crmPipelineButton: {
    backgroundColor: '#eef2f7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  crmPipelineButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  crmCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  crmCardHeader: {
    gap: 6,
  },
  crmCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  crmCardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  crmCardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crmStatusBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  crmStatusBadgeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  crmCardSmall: {
    fontSize: 11,
    color: '#6b7280',
  },
  crmDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
  },
  crmDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crmDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  crmDetailMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  crmStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  crmStatusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  crmStatusChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  crmStatusText: {
    fontSize: 11,
    color: '#6b7280',
  },
  crmStatusTextActive: {
    color: '#ffffff',
  },
  crmDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  crmDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  crmDetailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  crmSubTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  crmSubTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
  },
  crmSubTabActive: {
    backgroundColor: '#2563eb',
  },
  crmSubTabText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  crmSubTabTextActive: {
    color: '#ffffff',
  },
  crmDetailNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 10,
  },
  crmFloating: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crmFloatingText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 96,
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    color: '#4b5563',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metric: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  leadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  leadName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  leadMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  leadPhone: {
    fontSize: 12,
    color: '#111827',
  },
  chatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  chatMessages: {
    gap: 8,
    marginBottom: 12,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageIncoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
  },
  messageOutgoing: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  messageText: {
    fontSize: 12,
    color: '#111827',
  },
  messageTextOutgoing: {
    color: '#ffffff',
  },
  messageTextIncoming: {
    color: '#111827',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#ffffff',
  },
  chatSend: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  chatSendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  linkText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  taskMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentSection: {
    gap: 6,
  },
  commentText: {
    fontSize: 12,
    color: '#4b5563',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  commentButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceSection: {
    gap: 6,
  },
  evidenceButton: {
    backgroundColor: '#eef2f7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  evidenceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  evidenceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceItem: {
    alignItems: 'center',
    gap: 4,
  },
  evidenceImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  evidenceName: {
    fontSize: 11,
    color: '#4b5563',
    maxWidth: 72,
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomItem: {
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  bottomTextActive: {
    color: '#2563eb',
  },
  bottomIndicator: {
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  menuProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginTop: 12,
  },
  menuProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  menuAvatarImage: {
    width: 48,
    height: 48,
  },
  menuProfileInfo: {
    flex: 1,
  },
  menuProfileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  menuProfileRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menuSection: {
    marginTop: 16,
  },
  menuSectionTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemText: {
    fontSize: 13,
    color: '#111827',
  },
  menuChevron: {
    fontSize: 16,
    color: '#9ca3af',
  },
  menuItemDanger: {
    color: '#f87171',
  },
  adminForm: {
    paddingVertical: 12,
    gap: 10,
  },
  adminInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: '#ffffff',
  },
  adminButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
