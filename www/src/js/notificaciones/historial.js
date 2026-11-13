// ===== Historial de notificaciones (campana del header) =====
// Se guarda en este dispositivo, por usuario, y cada aviso se borra solo a los 30 días.
// Aviso: { clave, tipo, icono, estado: 'vencido' | 'por-vencer' | 'info', titulo, texto,
//          fecha (ms), leida, rol, vence?: 'YYYY-MM-DD', accion?: { tipo, ... } }
// Hoy lo alimentan las push recibidas (notificaciones/modulo.js) y los avisos de vacunas y
// desparasitación del tutor (home/modulo.js: cargarAlertasSalud). Si el backend expone un
// historial propio, puede mezclarse aquí con agregarNotificacion().
const DIAS_HISTORIAL_NOTIFICACIONES = 30;
const MAX_HISTORIAL_NOTIFICACIONES = 200;

const ICONOS_NOTIFICACION = {
    vacunas: '<path d="M18 2l4 4M20 4l-3 3M14 8l-9 9v3h3l9-9M12 6l6 6M7 15l2 2"/>',
    desparasitacion: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
    mensaje: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.8 7 7.1 5.4a1.8 1.8 0 0 0 2.2 0L20.2 7"/>',
    seguridad: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    emergencia: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/>',
    campana: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>'
};

const escaparNotificacion = (v) => $('<div>').text(v == null ? '' : String(v)).html();

const claveHistorialNotificaciones = () => {
    var usuario = typeof _SESSION === 'function' ? _SESSION('id_usuario') : '';
    return 'historialNotificaciones:' + String(usuario || 'invitado');
};

// Lee el historial ya sin los avisos de más de 30 días.
const leerHistorialNotificaciones = () => {
    var lista = [];
    try { lista = JSON.parse(localStorage.getItem(claveHistorialNotificaciones()) || '[]'); } catch (e) { lista = []; }
    if (!Array.isArray(lista)) return [];
    var limite = Date.now() - DIAS_HISTORIAL_NOTIFICACIONES * 86400000;
    return lista.filter(function(n) { return n && Number(n.fecha) >= limite; });
};

const guardarHistorialNotificaciones = (lista) => {
    try {
        localStorage.setItem(claveHistorialNotificaciones(), JSON.stringify(lista.slice(0, MAX_HISTORIAL_NOTIFICACIONES)));
    } catch (e) {}
};

// Agrega un aviso salvo que ya exista uno con la misma clave. Devuelve true si era nuevo.
const agregarNotificacion = (aviso) => {
    var lista = leerHistorialNotificaciones();
    if (aviso.clave && lista.some(function(n) { return n.clave === aviso.clave; })) {
        guardarHistorialNotificaciones(lista);
        return false;
    }
    lista.unshift($.extend({
        clave: 'n|' + Date.now() + '|' + Math.random().toString(36).slice(2, 8),
        tipo: 'general', icono: 'campana', estado: 'info', texto: '',
        fecha: Date.now(), leida: false, rol: localStorage.getItem('rolActivo') || ''
    }, aviso));
    guardarHistorialNotificaciones(lista);
    pintarNotificaciones();
    return true;
};

const perteneceAlPerfil = (n) => {
    var rol = localStorage.getItem('rolActivo') || '';
    return !n.rol || !rol || n.rol === rol;
};

// Avisos visibles para el perfil activo (tutor o profesional), más recientes primero.
const notificacionesDelPerfil = () => {
    var orden = { vencido: 0, 'por-vencer': 1, info: 2 };
    return leerHistorialNotificaciones().filter(perteneceAlPerfil).sort(function(a, b) {
        return (b.fecha - a.fecha) ||
            ((orden[a.estado] === undefined ? 2 : orden[a.estado]) - (orden[b.estado] === undefined ? 2 : orden[b.estado])) ||
            String(a.vence || '').localeCompare(String(b.vence || ''));
    });
};

const tiempoNotificacion = (ms) => {
    var fecha = new Date(ms);
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var dia = new Date(fecha);
    dia.setHours(0, 0, 0, 0);
    var dias = Math.round((hoy - dia) / 86400000);
    if (dias <= 0) {
        var min = Math.round((Date.now() - ms) / 60000);
        if (min < 1) return 'Ahora';
        if (min < 60) return 'Hace ' + min + ' min';
        return 'Hoy, ' + ('0' + fecha.getHours()).slice(-2) + ':' + ('0' + fecha.getMinutes()).slice(-2);
    }
    if (dias === 1) return 'Ayer';
    return 'Hace ' + dias + ' días';
};

// Plazo al día de hoy de un aviso con vencimiento (vacunas y desparasitación).
const chipNotificacion = (n) => {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(n.vence || ''));
    if (!m) return '';
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var dias = Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - hoy) / 86400000);
    if (dias < 0) return '<span class="notif-chip vencido">Vencida</span>';
    var texto = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias + ' días';
    return '<span class="notif-chip por-vencer">' + texto + '</span>';
};

const pintarNotificaciones = () => {
    var lista = notificacionesDelPerfil();
    var sinLeer = lista.filter(function(n) { return !n.leida; }).length;

    $('.header-notificaciones').each(function() {
        var $btn = $(this);
        var $badge = $btn.find('.notif-badge');
        if (!$badge.length) $badge = $('<span class="notif-badge" aria-hidden="true"></span>').appendTo($btn);
        $badge.text(sinLeer > 9 ? '9+' : sinLeer).toggle(sinLeer > 0);
        $btn.attr('aria-label', sinLeer ? 'Notificaciones, ' + sinLeer + ' sin leer' : 'Notificaciones');
    });

    var items = lista.map(function(n) {
        var icono = ICONOS_NOTIFICACION[n.icono] || ICONOS_NOTIFICACION.campana;
        return '<button type="button" data-role="none" class="notif-item ' + escaparNotificacion(n.estado) + (n.leida ? '' : ' no-leida') + '"' +
                ' data-clave="' + escaparNotificacion(n.clave) + '" onclick="abrirNotificacion(this)">' +
            '<span class="notif-icono"><svg viewBox="0 0 24 24" aria-hidden="true">' + icono + '</svg></span>' +
            '<span class="notif-texto"><b>' + escaparNotificacion(n.titulo) + '</b>' +
                (n.texto ? '<small>' + escaparNotificacion(n.texto) + '</small>' : '') +
                '<em>' + tiempoNotificacion(n.fecha) + '</em></span>' +
            chipNotificacion(n) +
            '</button>';
    }).join('');

    $('.header-notificaciones-panel').html(
        '<div class="header-menu-cabecera notif-cabecera"><span class="header-menu-nombre">Notificaciones</span>' +
            '<small>Últimos ' + DIAS_HISTORIAL_NOTIFICACIONES + ' días</small></div>' +
        (items
            ? '<div class="notif-lista">' + items + '</div>'
            : '<p class="header-notificaciones-vacio">Sin notificaciones</p>')
    );
};

// Al abrir la campana se ve qué era nuevo; desde ese momento todo queda leído.
const alAbrirNotificaciones = () => {
    pintarNotificaciones();
    var lista = leerHistorialNotificaciones();
    lista.forEach(function(n) {
        if (perteneceAlPerfil(n)) n.leida = true;
    });
    guardarHistorialNotificaciones(lista);
    $('.header-notificaciones .notif-badge').hide();
    $('.header-notificaciones').attr('aria-label', 'Notificaciones');
};

const abrirNotificacion = (boton) => {
    var clave = String($(boton).attr('data-clave') || '');
    var aviso = leerHistorialNotificaciones().filter(function(n) { return n.clave === clave; })[0];
    $('.header-notificaciones-caja').removeClass('abierto');
    if (!aviso || !aviso.accion) return;
    var a = aviso.accion;

    if (a.tipo === 'vd' && typeof abrirVacunasDesparasitacion === 'function') {
        if (a.mascota && typeof mascotasPorId !== 'undefined' && !mascotasPorId[a.id_mascota]) {
            mascotasPorId[a.id_mascota] = a.mascota;
        }
        window.mascotaSeleccionada = a.id_mascota;
        vista('vacunas-desparasitacion');
        abrirVacunasDesparasitacion(a.id_mascota, null, a.seccion);
    } else if (a.tipo === 'direct_message' && typeof abrirMensajesApp === 'function') {
        abrirMensajesApp();
    } else if (a.tipo === 'authorization_request') {
        vista('autorizaciones_sdi', 'fade');
    } else if (a.tipo === 'patient_emergency' && typeof abrirMedicoEmergencia === 'function') {
        abrirMedicoEmergencia();
    } else if (typeof abrirDesafiosAcceso === 'function') {
        abrirDesafiosAcceso();
    }
};

const TITULOS_PUSH = {
    login_approval: { titulo: 'Solicitud de acceso', icono: 'seguridad' },
    authorization_request: { titulo: 'Solicitud de autorización', icono: 'seguridad' },
    direct_message: { titulo: 'Nuevo mensaje', icono: 'mensaje' },
    patient_emergency: { titulo: 'Alerta de emergencia', icono: 'emergencia' },
    rest_control_request: { titulo: 'Solicitud de control', icono: 'seguridad' },
    rest_control_reminder: { titulo: 'Recordatorio de control', icono: 'campana' }
};

// Una push llega dos veces cuando se toca (al recibirla y al abrirla): la clave evita duplicados.
const registrarNotificacionPush = (mensaje) => {
    var cfg = TITULOS_PUSH[mensaje.type] || { titulo: 'Notificación', icono: 'campana' };
    var id = mensaje.id || mensaje.messageId || mensaje['google.message_id'] ||
        [mensaje.type, mensaje.title || '', mensaje.body || '', mensaje.sent_time || mensaje['google.sent_time'] || ''].join('|');
    agregarNotificacion({
        clave: 'push|' + id,
        tipo: mensaje.type,
        icono: cfg.icono,
        estado: mensaje.type === 'patient_emergency' ? 'vencido' : 'info',
        titulo: mensaje.title || cfg.titulo,
        texto: mensaje.body || '',
        accion: { tipo: mensaje.type }
    });
};

$(document).on('pageshow', '#index, #inicio-profesional', pintarNotificaciones);
