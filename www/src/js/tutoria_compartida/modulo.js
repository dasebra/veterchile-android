/* =========================================================
   Módulo: Tutoría compartida (+ Traspaso de mascota)
   Basado en vetsdi_laravel13:
     - partials/tutoria_compartida (modal_tutoria_compartida / modal_invitar_cotutor)
     - modales/dependientes/traspasar_mascota (modal_traspasar_mascota)
   En la app el traspaso es una vista (#traspasar-mascota) que se abre desde
   el botón "Traspasar" de cada mascota en Mis mascotas.

   Servicios esperados (los implementa el backend):
     GET  paciente/tutoria_listar_app      { id_mascota }              -> { invitaciones: [{ id, nombre, correo, rol, estado, vence_el }] }
     GET  paciente/tutoria_buscar_rut_app  { id_mascota, rut }         -> { tutor: { id, nombre, rut, email } }
     POST paciente/tutoria_invitar_app     { id_mascota, correo, rut, rol } -> { invitacion }
     POST paciente/tutoria_gestionar_app   { id_mascota, id, accion }  -> { invitacion? }   accion: reenviar | cancelar | quitar
     GET  paciente/traspaso_buscar_tutor_app { rut }                   -> { estado, msj, tutor: { id, nombre, rut, requiere_formulario, ... } }
     GET  paciente/traspaso_resumen_app    { id_mascota, rut_tutor, tutor_* } -> { estado, msj, tutor_actual, tutor_nuevo, resumen: { fvu, vacunas, desparasitaciones } }
     POST paciente/traspaso_ejecutar_app   { id_mascota, rut_tutor, situacion, confirmar, tutor_* } -> { estado, msj }
   ========================================================= */

var tcMascotas = {};          // id -> mascota (solo las que el usuario puede compartir/traspasar)
var tcMascotasOrden = [];
var tcMascotaHome = null;     // mascota elegida en la sección del inicio
var tcMascotaId = null;       // mascota abierta en el modal
var tcInvitaciones = {};      // id mascota -> invitaciones
var tcPersonaRut = null;
var tcEnviando = false;
var tcVolverALista = false;

var TC_ROLES = {
    co_tutor: { nombre: 'Cotutor', titulo: 'Invita a un cotutor', persona: 'cotutora', sinAcceso: 'Ya no podrá ver ni editar la información de ' },
    cuidador: { nombre: 'Cuidador', titulo: 'Invita a un cuidador', persona: 'cuidadora', sinAcceso: 'Ya no podrá ver la ficha ni agendar citas de ' }
};

var TC_ESTADOS = {
    pendiente: { texto: 'Invitación pendiente', clase: 'tc-badge-pendiente' },
    activa: { texto: 'Activo', clase: 'tc-badge-activa' },
    expirada: { texto: 'Expirada', clase: 'tc-badge-expirada' },
    rechazada: { texto: 'Rechazada', clase: 'tc-badge-rechazada' }
};

var TC_PATA = '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
var TC_ICONO_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

// ---------- Utilidades ----------
const tcEsc = (v) => $('<div>').text(v == null ? '' : String(v)).html();
const tcModoDemo = () => typeof MODO_DEMO_MASCOTAS !== 'undefined' && MODO_DEMO_MASCOTAS;
const tcEsDemo = (id) => tcModoDemo() && String(id) === 'demo';

const tcAlerta = (titulo, texto, tipo) => {
    if (typeof swalMedsdi === 'function') return swalMedsdi(titulo, texto, tipo || 'info');
    window.alert(titulo + (texto ? '\n\n' + texto : ''));
    return Promise.resolve();
};

const tcConfirmar = (titulo, texto, boton) => {
    if (typeof confirmarMedsdi === 'function') {
        return confirmarMedsdi(titulo, texto, { icon: 'warning', confirmButtonText: boton, confirmButtonColor: '#d93a46' });
    }
    return Promise.resolve(window.confirm(titulo + '\n\n' + texto));
};

const tcAvatar = (m) => {
    var foto = m && (m.foto || m.foto_url);
    return '<span class="tc-avatar">' + (foto ? '<img src="' + tcEsc(foto) + '" alt="" onerror="this.remove()">' : TC_PATA) + '</span>';
};

const tcNombreMascota = () => {
    var m = tcMascotas[tcMascotaId];
    return m && m.nombre ? m.nombre : 'tu mascota';
};

const tcTitular = () => ({
    nombre: (typeof _SESSION === 'function' && _SESSION('nombre')) || '',
    correo: String((typeof _SESSION === 'function' && _SESSION('email')) || '').toLowerCase(),
    rut: (typeof _SESSION === 'function' && _SESSION('rut')) || ''
});

const tcEsCorreo = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const tcPareceRut = (v) => /^[0-9.]{6,12}-?[0-9kK]$/.test(v);

const tcFecha = (iso) => {
    var f = new Date(iso);
    if (isNaN(f.getTime())) return '';
    return ('0' + f.getDate()).slice(-2) + '-' + ('0' + (f.getMonth() + 1)).slice(-2) + '-' + f.getFullYear();
};

// Una pendiente cuyo plazo ya pasó se muestra como expirada aunque el servidor no la haya marcado
const tcEstadoInvitacion = (inv) => (inv.estado === 'pendiente' && inv.vence_el && new Date(inv.vence_el) < new Date()) ? 'expirada' : inv.estado;

const tcBotonCargando = ($b, cargando, texto) => {
    if (cargando) {
        if (!$b.data('html-original')) $b.data('html-original', $b.html());
        $b.prop('disabled', true).html('<span class="tc-spinner" aria-hidden="true"></span> ' + tcEsc(texto));
        return;
    }
    if ($b.data('html-original')) $b.html($b.data('html-original')).removeData('html-original');
    $b.prop('disabled', false);
};

const tcMensajeError = (xhr, porDefecto) => {
    var d = (xhr && (xhr.responseJSON || (function() { try { return JSON.parse(xhr.responseText); } catch (e) { return null; } })())) || {};
    if (d.errors) return Object.values(d.errors).flat().join('\n');
    if (d.msj) return d.msj;
    if (xhr && xhr.status === 409 && d.message) return d.message;
    if (xhr && xhr.status === 403) return 'Solo el tutor titular puede gestionar esta mascota.';
    return porDefecto;
};

const tcApi = (metodo, datos, tipo) => {
    var dfd = $.Deferred();
    new Api('paciente', metodo).request(datos || {}, function(r) { dfd.resolve(r || {}); }, function(xhr) { dfd.reject(xhr); }, tipo || 'GET');
    return dfd.promise();
};

// ---------- Mascotas del tutor ----------
// Solo mascotas vivas, activas y donde el usuario es titular (igual que en la web).
const tcCargarMascotas = () => {
    var dfd = $.Deferred();
    var alExito = function(resp) {
        var lista = resp && Array.isArray(resp.mascotas) ? resp.mascotas : [];
        if (!lista.length && tcModoDemo() && typeof MASCOTA_DEMO !== 'undefined') lista = [MASCOTA_DEMO.mascota];
        tcMascotas = {};
        tcMascotasOrden = [];
        lista.forEach(function(m, i) {
            var id = String(m.id || m.id_paciente || i);
            if (m.fallecida || m.fecha_fallecimiento || String(m.estado) === '0') return;
            if (m.rol_acceso && m.rol_acceso !== 'titular') return;
            if (tcMascotas[id]) return;
            tcMascotas[id] = Object.assign({}, m, { id: id });
            tcMascotasOrden.push(id);
        });
        dfd.resolve(tcMascotasOrden);
    };
    tcApi('mis_mascotas_app').done(alExito).fail(function() { alExito({ mascotas: [] }); });
    return dfd.promise();
};

// ---------- Sección del inicio ----------
const tcPintarHome = () => {
    var $lista = $('#home_tutoria_mascotas');
    if (!$lista.length) return;
    if (!tcMascotasOrden.length) {
        tcMascotaHome = null;
        $lista.addClass('tc-oculto').empty();
        $('#home_tutoria_vacio').removeClass('tc-oculto');
        $('#home_tutoria_boton').prop('disabled', true);
        return;
    }
    if (!tcMascotaHome || !tcMascotas[tcMascotaHome]) tcMascotaHome = tcMascotasOrden[0];
    $lista.removeClass('tc-oculto').html(tcMascotasOrden.map(function(id) {
        var m = tcMascotas[id];
        var activa = id === tcMascotaHome;
        return '<button type="button" data-role="none" class="home-tutoria-mascota' + (activa ? ' activa' : '') + '" data-id="' + tcEsc(id) + '" aria-pressed="' + activa + '">' +
            tcAvatar(m) + '<span>' + tcEsc(m.nombre || 'Mascota') + '</span></button>';
    }).join(''));
    $('#home_tutoria_vacio').addClass('tc-oculto');
    $('#home_tutoria_boton').prop('disabled', false);
    $('#home_tutoria_nombre').text(tcMascotas[tcMascotaHome].nombre || 'tu mascota');
};

const cargarSeccionTutoriaHome = () => {
    tcCargarMascotas().done(tcPintarHome);
};

$(document).on('click', '.home-tutoria-mascota', function() {
    tcMascotaHome = String($(this).data('id'));
    tcPintarHome();
});

$(document).on('pageshow', '#index', cargarSeccionTutoriaHome);

// ---------- Modal: Tutoría compartida ----------
const tcAbrirOverlay = (id) => { $('#' + id).addClass('visible').attr('aria-hidden', 'false'); };
const tcCerrarOverlay = (id) => { $('#' + id).removeClass('visible').attr('aria-hidden', 'true'); };

const abrirTutoriaCompartida = (event, idMascota) => {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    var abrir = function() {
        if (!tcMascotasOrden.length) {
            tcAlerta('Sin mascotas', 'Agrega una mascota para compartir su tutoría con otra persona.', 'info');
            return;
        }
        var $select = $('#tutoria_mascota_id').empty();
        tcMascotasOrden.forEach(function(id) {
            $select.append($('<option></option>').val(id).text(tcMascotas[id].nombre || 'Sin nombre'));
        });
        var elegida = idMascota && tcMascotas[String(idMascota)] ? String(idMascota) : tcMascotasOrden[0];
        $select.val(elegida);
        tcCambiarMascota(elegida);
        vista('tutoria-compartida');
    };
    if (tcMascotasOrden.length) abrir(); else tcCargarMascotas().done(abrir);
    return false;
};

const cerrarTutoriaCompartida = () => vista('index');

const tcCambiarMascota = (idMascota) => {
    tcMascotaId = String(idMascota);
    $('.tutoria-nombre-mascota').text(tcNombreMascota());
    $('#tutoria_lista').html('<p class="tc-vacio"><span class="tc-spinner" aria-hidden="true"></span> Cargando...</p>');

    if (tcEsDemo(idMascota)) {
        tcInvitaciones[tcMascotaId] = tcInvitaciones[tcMascotaId] || [];
        tcPintarLista();
        return;
    }
    tcApi('tutoria_listar_app', { id_mascota: tcMascotaId }).done(function(resp) {
        tcInvitaciones[String(idMascota)] = resp.invitaciones || [];
        if (tcMascotaId === String(idMascota)) tcPintarLista();
    }).fail(function(xhr) {
        if (tcMascotaId !== String(idMascota)) return;
        $('#tutoria_lista').html('<p class="tc-vacio">' + tcEsc(tcMensajeError(xhr, 'No se pudo cargar la lista. Intenta nuevamente.')) + '</p>');
    });
};

const tcFilaPersona = (inv) => {
    var estado = tcEstadoInvitacion(inv);
    var e = TC_ESTADOS[estado] || TC_ESTADOS.pendiente;
    var nombre = inv.nombre || inv.correo;
    var detalle = [(TC_ROLES[inv.rol] || TC_ROLES.co_tutor).nombre];
    if (inv.nombre && inv.correo) detalle.push(inv.correo);
    if (estado === 'pendiente' && inv.vence_el) detalle.push('Vence el ' + tcFecha(inv.vence_el));

    var acc = '';
    var boton = function(accion, texto, peligro) {
        return '<button type="button" data-role="none" class="tc-accion' + (peligro ? ' tc-accion-peligro' : '') + '" data-accion="' + accion + '" data-id="' + tcEsc(inv.id) + '">' + texto + '</button>';
    };
    if (estado === 'pendiente') acc = boton('reenviar', 'Reenviar') + boton('cancelar', 'Cancelar invitación', true);
    else if (estado === 'activa') acc = boton('quitar', 'Quitar acceso', true);
    else if (estado === 'expirada') acc = boton('reenviar', 'Enviar de nuevo');

    return '<div class="tc-persona" data-id="' + tcEsc(inv.id) + '">' +
        '<div class="tc-persona-datos"><strong>' + tcEsc(nombre) + '</strong><span>' + tcEsc(detalle.join(' · ')) + '</span></div>' +
        '<span class="tc-badge ' + e.clase + '">' + e.texto + '</span>' +
        (acc ? '<div class="tc-acciones">' + acc + '</div>' : '') +
        '</div>';
};

const tcPintarLista = () => {
    var invitaciones = tcInvitaciones[tcMascotaId] || [];
    var html = '<div class="tc-persona">' +
        '<div class="tc-persona-datos"><strong>' + (tcTitular().nombre ? tcEsc(tcTitular().nombre) + ' (tú)' : 'Tú') + '</strong><span>Puede invitar, quitar accesos y eliminar la mascota</span></div>' +
        '<span class="tc-badge tc-badge-titular">Tutor titular</span></div>';
    invitaciones.forEach(function(inv) { html += tcFilaPersona(inv); });
    $('#tutoria_lista').html(html);
};

const tcBuscarInvitacion = (id) => (tcInvitaciones[tcMascotaId] || []).filter(function(i) { return String(i.id) === String(id); })[0] || null;

const tcReemplazarInvitacion = (inv) => {
    var lista = tcInvitaciones[tcMascotaId] || [];
    var idx = -1;
    lista.forEach(function(it, i) { if (String(it.id) === String(inv.id)) idx = i; });
    if (idx >= 0) lista[idx] = inv; else lista.unshift(inv);
    tcInvitaciones[tcMascotaId] = lista;
};

const tcQuitarInvitacion = (id) => {
    tcInvitaciones[tcMascotaId] = (tcInvitaciones[tcMascotaId] || []).filter(function(i) { return String(i.id) !== String(id); });
};

// ---------- Invitar co-tutor / cuidador: 3 pasos dentro de la misma página ----------
var tcPaso = 1;

const tcIrPaso = (n) => {
    tcPaso = n;
    $('#form_invitar_cotutor .tc-paso-panel').each(function() { $(this).toggle(Number($(this).data('paso')) === n); });
    $('#tc_pasos .tc-paso-item').each(function() {
        var p = Number($(this).data('paso'));
        $(this).toggleClass('activo', p === n).toggleClass('hecho', p < n);
    });
    $('#btn_invitacion_atras').text(n === 1 ? 'Cancelar' : 'Atrás');
    $('#btn_invitacion_siguiente').toggle(n < 3);
    $('#btn_enviar_invitacion').toggle(n === 3);
    if (n === 2) setTimeout(function() { $('#invitacion_destino').trigger('focus'); }, 100);
    if (n === 3) tcPintarResumenInvitacion();
    $('.tc-pagina-contenido').scrollTop(0);
};

const tcPintarResumenInvitacion = () => {
    var rol = $('#form_invitar_cotutor input[name="rol"]:checked').val() || 'co_tutor';
    var destino = $.trim($('#invitacion_destino').val() || '');
    $('#invitacion_resumen_rol').text((TC_ROLES[rol] || TC_ROLES.co_tutor).nombre);
    $('#invitacion_resumen_persona').text(tcPersonaRut ? tcPersonaRut.nombre + ' (' + tcPersonaRut.email + ')' : destino);
};

const abrirInvitacionTutoria = () => {
    tcResetInvitacion();
    $('#tc_vista_lista').hide();
    $('#tc_vista_invitacion').show();
    tcIrPaso(1);
};

// Al terminar o cancelar se vuelve a la lista de la mascota
const cerrarInvitacionTutoria = () => {
    $('#tc_vista_invitacion').hide();
    $('#tc_vista_lista').show();
    tcPintarLista();
    $('.tc-pagina-contenido').scrollTop(0);
};

// Flecha del encabezado: un paso atrás, luego a la lista y, desde la lista, al inicio
const tcVolverPagina = () => {
    if ($('#tc_vista_invitacion').is(':visible')) { tcPasoAtras(); return; }
    vista('index');
};

const tcPasoAtras = () => {
    if (tcEnviando) return;
    if (tcPaso <= 1) { cerrarInvitacionTutoria(); return; }
    tcIrPaso(tcPaso - 1);
};

const tcPasoSiguiente = () => {
    if (tcPaso === 1) { tcIrPaso(2); return; }
    if (tcPaso !== 2) return;
    var destino = $.trim($('#invitacion_destino').val() || '');
    if (!tcEsCorreo(destino) && tcPareceRut(destino) && !tcPersonaRut) { tcBuscarRutInvitacion(destino, function() { tcIrPaso(3); }); return; }
    var correo = tcPersonaRut ? String(tcPersonaRut.email).toLowerCase() : destino.toLowerCase();
    if (!tcEsCorreo(correo)) {
        tcErrorInvitacion(/^[0-9.\-kK]+$/.test(destino) ? 'Ingresa un RUT válido.' : 'Ingresa un correo válido.');
        $('#invitacion_destino').trigger('focus');
        return;
    }
    var duplicado = tcErrorDuplicado(correo);
    if (duplicado) { tcErrorInvitacion(duplicado); return; }
    tcErrorInvitacion('');
    tcIrPaso(3);
};

const tcResetInvitacion = () => {
    tcEnviando = false;
    tcPersonaRut = null;
    $('#form_invitar_cotutor')[0].reset();
    $('#invitacion_persona').addClass('tc-oculto');
    tcErrorInvitacion('');
    tcBotonCargando($('#btn_enviar_invitacion'), false);
    tcActualizarTituloInvitacion();
};

const tcActualizarTituloInvitacion = () => {
    var rol = $('#form_invitar_cotutor input[name="rol"]:checked').val();
    $('#modalInvitarCotutorLabel').empty().append(
        document.createTextNode((TC_ROLES[rol] || TC_ROLES.co_tutor).titulo + ' para cuidar a '),
        $('<span class="tutoria-nombre-mascota"></span>').text(tcNombreMascota())
    );
};

const tcErrorInvitacion = (mensaje) => {
    $('#invitacion_destino').toggleClass('invalido', !!mensaje);
    $('#invitacion_destino_error').toggleClass('tc-oculto', !mensaje).text(mensaje || '');
};

const tcBuscarRutInvitacion = (rut, alEncontrar) => {
    var $b = $('#btn_invitacion_siguiente');
    if ($b.prop('disabled')) return;
    tcBotonCargando($b, true, 'Buscando…');
    var listo = function(persona) {
        tcBotonCargando($b, false);
        if ($.trim($('#invitacion_destino').val()) !== rut) return;
        tcPersonaRut = persona;
        $('#invitacion_persona_nombre').text(persona.nombre);
        $('#invitacion_persona_correo').text('RUT ' + (persona.rut || rut) + ' · ' + persona.email);
        $('#invitacion_persona .tc-badge').toggleClass('tc-oculto', !persona.id);
        $('#invitacion_persona').removeClass('tc-oculto');
        if (alEncontrar) alEncontrar();
    };
    var falla = function(m) { tcBotonCargando($b, false); tcErrorInvitacion(m); };

    if (tcEsDemo(tcMascotaId)) { falla('No encontramos a nadie con ese RUT. Ingresa su correo electrónico.'); return; }
    tcApi('tutoria_buscar_rut_app', { id_mascota: tcMascotaId, rut: rut }).done(function(resp) {
        var p = resp.tutor;
        if (!p || !p.nombre) return falla('No encontramos a nadie con ese RUT. Ingresa su correo electrónico.');
        if (!p.email) return falla('Esta persona no tiene un correo registrado. Ingresa su correo electrónico.');
        listo(p);
    }).fail(function(xhr) { falla(tcMensajeError(xhr, 'No se pudo buscar el RUT. Ingresa su correo electrónico.')); });
};

// Revisa duplicados contra la lista de la mascota antes de enviar
const tcErrorDuplicado = (correo) => {
    var titular = tcTitular();
    if (titular.correo && correo === titular.correo) return 'Ese es tu propio correo. Ingresa el de la persona que quieres invitar.';
    var mensaje = '';
    (tcInvitaciones[tcMascotaId] || []).forEach(function(it) {
        if (mensaje || String(it.correo).toLowerCase() !== correo) return;
        var e = tcEstadoInvitacion(it);
        if (e === 'activa') mensaje = 'Esta persona ya es ' + (TC_ROLES[it.rol] || TC_ROLES.co_tutor).persona + ' de ' + tcNombreMascota() + '.';
        else if (e === 'pendiente') mensaje = 'Ya enviaste una invitación a este correo.';
    });
    return mensaje;
};

const enviarInvitacionTutoria = (event) => {
    if (event) event.preventDefault();
    if (tcEnviando) return false;
    var destino = $.trim($('#invitacion_destino').val() || '');
    var rol = $('#form_invitar_cotutor input[name="rol"]:checked').val() || 'co_tutor';
    var $b = $('#btn_enviar_invitacion');

    if (!tcEsCorreo(destino) && tcPareceRut(destino) && !tcPersonaRut) { tcIrPaso(2); tcPasoSiguiente(); return false; }

    var correo = tcPersonaRut ? String(tcPersonaRut.email).toLowerCase() : destino.toLowerCase();
    if (!tcEsCorreo(correo)) {
        tcIrPaso(2);
        tcErrorInvitacion(/^[0-9.\-kK]+$/.test(destino) ? 'Ingresa un RUT válido.' : 'Ingresa un correo válido.');
        return false;
    }
    var duplicado = tcErrorDuplicado(correo);
    if (duplicado) { tcIrPaso(2); tcErrorInvitacion(duplicado); return false; }

    tcErrorInvitacion('');
    tcEnviando = true;
    tcBotonCargando($b, true, 'Enviando…');
    var nombreDestino = tcPersonaRut ? tcPersonaRut.nombre : correo;
    var exito = function(resp) {
        tcEnviando = false;
        tcBotonCargando($b, false);
        if (resp && resp.invitacion) tcReemplazarInvitacion(resp.invitacion);
        cerrarInvitacionTutoria();
        tcAlerta('Invitación enviada a ' + nombreDestino, '', 'success');
    };

    if (tcEsDemo(tcMascotaId)) {
        var vence = new Date(); vence.setDate(vence.getDate() + 7);
        setTimeout(function() {
            exito({ invitacion: { id: 'demo-' + Date.now(), nombre: tcPersonaRut ? tcPersonaRut.nombre : '', correo: correo, rol: rol, estado: 'pendiente', vence_el: vence.toISOString() } });
        }, 400);
        return false;
    }
    tcApi('tutoria_invitar_app', {
        id_mascota: tcMascotaId,
        correo: tcPersonaRut ? null : correo,
        rut: tcPersonaRut ? tcPersonaRut.rut : '',
        rol: rol
    }, 'POST').done(exito).fail(function(xhr) {
        tcEnviando = false;
        tcBotonCargando($b, false);
        tcIrPaso(2);
        tcErrorInvitacion(tcMensajeError(xhr, 'No se pudo enviar la invitación. Intenta nuevamente.'));
    });
    return false;
};

const tcAccionInvitacion = (accion, id, $b) => {
    var inv = tcBuscarInvitacion(id);
    if (!inv) return;
    var textos = { reenviar: 'Enviando…', cancelar: 'Cancelando…', quitar: 'Quitando…' };
    tcBotonCargando($b, true, textos[accion]);
    $('#tutoria_lista .tc-accion').prop('disabled', true);
    var mascotaId = tcMascotaId;
    var exito = function(resp) {
        if (tcMascotaId !== mascotaId) return;
        if (accion === 'reenviar') {
            var nueva = (resp && resp.invitacion) || inv;
            if (tcEsDemo(mascotaId)) { var v = new Date(); v.setDate(v.getDate() + 7); nueva = Object.assign({}, inv, { estado: 'pendiente', vence_el: v.toISOString() }); }
            tcReemplazarInvitacion(nueva);
        } else {
            tcQuitarInvitacion(id);
        }
        tcPintarLista();
        var mensajes = {
            reenviar: 'Invitación enviada a ' + inv.correo,
            cancelar: 'Invitación cancelada',
            quitar: (inv.nombre || inv.correo) + ' ya no tiene acceso a ' + tcNombreMascota()
        };
        tcAlerta(mensajes[accion], '', 'success');
    };
    if (tcEsDemo(mascotaId)) { setTimeout(exito, 400); return; }
    tcApi('tutoria_gestionar_app', { id_mascota: mascotaId, id: id, accion: accion }, 'POST').done(exito).fail(function(xhr) {
        if (tcMascotaId !== mascotaId) return;
        tcBotonCargando($b, false);
        $('#tutoria_lista .tc-accion').prop('disabled', false);
        tcAlerta('No se pudo completar la acción', tcMensajeError(xhr, 'Intenta nuevamente.'), 'error');
    });
};

$(document).on('change', '#tutoria_mascota_id', function() { tcCambiarMascota(this.value); });
$(document).on('change', '#form_invitar_cotutor input[name="rol"]', tcActualizarTituloInvitacion);
$(document).on('input', '#invitacion_destino', function() {
    tcPersonaRut = null;
    $('#invitacion_persona').addClass('tc-oculto');
    tcErrorInvitacion('');
});
$(document).on('blur', '#invitacion_destino', function() {
    var v = $.trim(this.value || '');
    if (!tcPersonaRut && !tcEsCorreo(v) && tcPareceRut(v)) tcBuscarRutInvitacion(v);
});
$(document).on('click', '#tutoria_lista .tc-accion', function() {
    var $b = $(this), accion = $b.data('accion'), id = $b.data('id');
    var inv = tcBuscarInvitacion(id);
    if (!inv) return;
    if (accion !== 'quitar') { tcAccionInvitacion(accion, id, $b); return; }
    var rol = TC_ROLES[inv.rol] || TC_ROLES.co_tutor;
    tcConfirmar('¿Quitar a ' + (inv.nombre || inv.correo) + ' como ' + rol.nombre.toLowerCase() + '?', rol.sinAcceso + tcNombreMascota() + '.', 'Quitar acceso')
        .then(function(ok) { if (ok) tcAccionInvitacion('quitar', id, $b); });
});


/* =========================================================
   Vista: Traspasar mascota a otro tutor (wizard de 3 pasos)
   ========================================================= */
var TRASPASO_TOTAL_PASOS = 3;
var traspasoPaso = 1;
var traspasoTutor = null;
var traspasoResumenListo = false;
var traspasoCargando = false;

const traspasoDatosTutor = () => ({
    tutor_nombres: $.trim($('#traspaso_tutor_nombres').val() || ''),
    tutor_apellido_uno: $.trim($('#traspaso_tutor_apellido_uno').val() || ''),
    tutor_apellido_dos: $.trim($('#traspaso_tutor_apellido_dos').val() || ''),
    tutor_email: $.trim($('#traspaso_tutor_email').val() || ''),
    tutor_telefono: $.trim($('#traspaso_tutor_telefono').val() || ''),
    tutor_direccion: $.trim($('#traspaso_tutor_direccion').val() || '')
});

// Se abre desde el botón "Traspasar" de cada mascota en Mis mascotas
const abrirTraspasoMascota = (idMascota) => {
    traspasoReset();
    var pintar = function() {
        var $s = $('#traspaso_mascota_id');
        $s.find('option:not(:first)').remove();
        tcMascotasOrden.forEach(function(id) { $s.append($('<option></option>').val(id).text(tcMascotas[id].nombre || 'Sin nombre')); });
        if (idMascota && tcMascotas[String(idMascota)]) $s.val(String(idMascota));
        traspasoActualizarMascota();
        traspasoActualizarWizard();
        if (!tcMascotasOrden.length) tcAlerta('Sin mascotas', 'Debe tener al menos una mascota registrada para realizar un traspaso.', 'info');
    };
    tcCargarMascotas().done(pintar);
};

const traspasoReset = () => {
    traspasoPaso = 1;
    traspasoCargando = false;
    $('#traspaso_mascota_id').val('');
    $('#traspaso_situacion, #traspaso_rut_tutor').val('');
    $('#traspaso_paso1_error').addClass('tc-oculto').text('');
    $('#traspaso_mascota_resumen').addClass('tc-oculto');
    $('#traspaso_tutor_actual, #traspaso_tutor_nuevo_resumen, #traspaso_resumen_mascota, #traspaso_resumen_motivo').text('-');
    $('#traspaso_tutor_actual_rut, #traspaso_tutor_nuevo_rut').text('');
    $('#traspaso_total_fvu, #traspaso_total_vacunas, #traspaso_total_desparasitaciones').text('0');
    $('#btn_traspaso_buscar_tutor, #btn_traspaso_siguiente, #btn_traspaso_confirmar').each(function() { tcBotonCargando($(this), false); });
    traspasoLimpiarTutor();
    $('#traspasar-mascota .traspaso-panel').removeClass('activo').filter('[data-paso="1"]').addClass('activo');
    traspasoActualizarWizard();
};

const traspasoLimpiarTutor = () => {
    traspasoTutor = null;
    traspasoResumenListo = false;
    $('#traspaso_tutor_nombre, #traspaso_tutor_rut').text('-');
    $('#traspaso_tutor_formulario input').val('');
    $('#traspaso_tutor_resultado, #traspaso_tutor_formulario, #traspaso_tutor_alerta').addClass('tc-oculto');
    $('#traspaso_tutor_alerta_texto').text('');
    $('#traspaso_tutor_error').addClass('tc-oculto').text('');
};

const traspasoActualizarMascota = () => {
    var m = tcMascotas[$('#traspaso_mascota_id').val()];
    if (!m) { $('#traspaso_mascota_resumen').addClass('tc-oculto'); return; }
    var detalle = [m.especie, m.raza, m.sexo].filter(Boolean).join(' · ');
    $('#traspaso_mascota_foto').replaceWith($(tcAvatar(m)).attr('id', 'traspaso_mascota_foto'));
    $('#traspaso_mascota_nombre').text(m.nombre || '-');
    $('#traspaso_mascota_detalle').text(detalle);
    $('#traspaso_mascota_resumen').removeClass('tc-oculto');
};

const traspasoTutorListo = () => {
    if (!traspasoTutor) return false;
    if (traspasoTutor.id) return true;
    var d = traspasoDatosTutor();
    return d.tutor_nombres.length > 0 && d.tutor_apellido_uno.length > 0;
};

const traspasoErrorPasoUno = () => {
    if (!$('#traspaso_mascota_id').val()) return 'Seleccione la mascota que va a traspasar.';
    if ($.trim($('#traspaso_situacion').val() || '').length < 5) return 'Indique el motivo del traspaso (mínimo 5 caracteres).';
    return '';
};

const traspasoPasoCompleto = (p) => p === 1 ? traspasoErrorPasoUno() === '' : (p === 2 ? traspasoTutorListo() && traspasoResumenListo : false);

const traspasoPasoDisponible = (p) => {
    for (var a = 1; a < p; a++) if (!traspasoPasoCompleto(a)) return false;
    return true;
};

const traspasoActualizarWizard = () => {
    var ultimo = traspasoPaso === TRASPASO_TOTAL_PASOS;
    $('#traspaso_pasos .traspaso-paso').each(function() {
        var p = Number($(this).data('paso'));
        var hecho = p !== traspasoPaso && p < TRASPASO_TOTAL_PASOS && traspasoPasoDisponible(p) && traspasoPasoCompleto(p);
        $(this).toggleClass('activo', p === traspasoPaso).toggleClass('completado', hecho);
        $(this).find('.traspaso-paso-numero').html(hecho ? TC_ICONO_CHECK : p);
        $(this).find('button').prop('disabled', traspasoCargando || !traspasoPasoDisponible(p))
            .attr('aria-current', p === traspasoPaso ? 'step' : null);
    });
    $('#btn_traspaso_cancelar').toggleClass('tc-oculto', traspasoPaso > 1);
    $('#btn_traspaso_anterior').toggleClass('tc-oculto', traspasoPaso === 1);
    $('#btn_traspaso_siguiente').toggleClass('tc-oculto', ultimo);
    $('#btn_traspaso_confirmar').toggleClass('tc-oculto', !ultimo);
    if (traspasoCargando) { $('#btn_traspaso_anterior').prop('disabled', true); return; }
    $('#btn_traspaso_anterior, #btn_traspaso_siguiente').prop('disabled', false);
    $('#btn_traspaso_confirmar').prop('disabled', !ultimo || !traspasoPasoCompleto(2));
};

const irPasoTraspaso = (p) => {
    if (p < 1 || p > TRASPASO_TOTAL_PASOS || traspasoCargando || !traspasoPasoDisponible(p)) return;
    traspasoPaso = p;
    $('#traspasar-mascota .traspaso-panel').removeClass('activo').filter('[data-paso="' + p + '"]').addClass('activo');
    if (p === TRASPASO_TOTAL_PASOS) traspasoLlenarConfirmacion();
    traspasoActualizarWizard();
    $('html, body').scrollTop(0);
};

const siguientePasoTraspaso = () => {
    if (traspasoCargando) return;
    if (traspasoPaso === 1) {
        var error = traspasoErrorPasoUno();
        $('#traspaso_paso1_error').toggleClass('tc-oculto', !error).text(error);
        if (!error) irPasoTraspaso(2);
        return;
    }
    if (traspasoPaso === 2) traspasoValidarTutor();
};

const anteriorPasoTraspaso = () => irPasoTraspaso(traspasoPaso - 1);

const traspasoErrorTutor = (m) => { $('#traspaso_tutor_error').removeClass('tc-oculto').text(m); };

const traspasoMostrarTutor = (tutor, mensaje) => {
    traspasoTutor = tutor || {};
    traspasoResumenListo = false;
    if (traspasoTutor.requiere_formulario) {
        $('#traspaso_tutor_resultado').addClass('tc-oculto');
        $('#traspaso_tutor_formulario').removeClass('tc-oculto');
        $('#traspaso_tutor_nombres').val(traspasoTutor.nombres || '');
        $('#traspaso_tutor_apellido_uno').val(traspasoTutor.apellido_uno || '');
        $('#traspaso_tutor_apellido_dos').val(traspasoTutor.apellido_dos || '');
        $('#traspaso_tutor_email').val(traspasoTutor.email || '');
        $('#traspaso_tutor_telefono').val(traspasoTutor.telefono_uno || '');
        $('#traspaso_tutor_direccion').val(traspasoTutor.direccion || '');
    } else {
        $('#traspaso_tutor_formulario').addClass('tc-oculto');
        $('#traspaso_tutor_nombre').text(traspasoTutor.nombre || '-');
        $('#traspaso_tutor_rut').text(traspasoTutor.rut || '-');
        $('#traspaso_tutor_resultado').removeClass('tc-oculto');
    }
    $('#traspaso_tutor_alerta').toggleClass('tc-oculto', !mensaje);
    $('#traspaso_tutor_alerta_texto').text(mensaje || '');
    $('#traspaso_tutor_error').addClass('tc-oculto').text('');
    traspasoActualizarWizard();
};

const buscarTutorTraspaso = () => {
    if (traspasoCargando) return;
    var rut = $.trim($('#traspaso_rut_tutor').val() || '');
    if (!rut) { traspasoErrorTutor('Ingrese el RUT del nuevo tutor.'); return; }
    var $b = $('#btn_traspaso_buscar_tutor');
    var fin = function() { traspasoCargando = false; tcBotonCargando($b, false); };
    traspasoLimpiarTutor();
    traspasoCargando = true;
    tcBotonCargando($b, true, 'Buscando');
    traspasoActualizarWizard();

    if (tcEsDemo($('#traspaso_mascota_id').val())) {
        setTimeout(function() {
            fin();
            traspasoMostrarTutor({ rut: rut, requiere_formulario: true }, 'Este RUT aún no está registrado. Ingrese los datos del nuevo tutor.');
        }, 400);
        return;
    }
    tcApi('traspaso_buscar_tutor_app', { rut: rut }).done(function(d) {
        fin();
        if (d.estado != 1 || !d.tutor) { traspasoErrorTutor(d.msj || 'No se pudo buscar el tutor.'); traspasoActualizarWizard(); return; }
        traspasoMostrarTutor(d.tutor, d.msj);
    }).fail(function(xhr) {
        fin();
        traspasoErrorTutor(tcMensajeError(xhr, 'No se pudo buscar el tutor.'));
        traspasoActualizarWizard();
    });
};

// Al pulsar "Siguiente" en el paso 2: revisa el tutor y trae el resumen antes de pasar a confirmar
const traspasoValidarTutor = () => {
    var rut = $.trim($('#traspaso_rut_tutor').val() || '');
    if (!traspasoTutor || !rut) { traspasoErrorTutor('Busque al nuevo tutor por su RUT antes de continuar.'); return; }
    if (traspasoTutor.requiere_formulario) {
        var d = traspasoDatosTutor();
        if (!d.tutor_nombres || !d.tutor_apellido_uno) { traspasoErrorTutor('Nombre y apellido paterno son obligatorios.'); return; }
        traspasoTutor = Object.assign({}, traspasoTutor, d, {
            rut: rut,
            nombre: [d.tutor_nombres, d.tutor_apellido_uno, d.tutor_apellido_dos].filter(Boolean).join(' '),
            requiere_formulario: true
        });
    }
    if (traspasoResumenListo) { irPasoTraspaso(3); return; }
    traspasoCargarResumen($('#traspaso_mascota_id').val(), rut, function() { irPasoTraspaso(3); });
};

const traspasoMostrarResumen = (d) => {
    if (!d || d.estado != 1) { traspasoResumenListo = false; traspasoActualizarWizard(); return; }
    var actual = d.tutor_actual || {}, nuevo = d.tutor_nuevo || {}, r = d.resumen || {};
    $('#traspaso_tutor_actual').text(actual.nombre || '-');
    $('#traspaso_tutor_actual_rut').text(actual.rut ? 'RUT ' + actual.rut : '');
    $('#traspaso_tutor_nuevo_resumen').text(nuevo.nombre || '-');
    $('#traspaso_tutor_nuevo_rut').text(nuevo.rut ? 'RUT ' + nuevo.rut : '');
    $('#traspaso_total_fvu').text(r.fvu || 0);
    $('#traspaso_total_vacunas').text(r.vacunas || 0);
    $('#traspaso_total_desparasitaciones').text(r.desparasitaciones || 0);
    traspasoResumenListo = true;
    traspasoActualizarWizard();
};

const traspasoLlenarConfirmacion = () => {
    var m = tcMascotas[$('#traspaso_mascota_id').val()];
    $('#traspaso_resumen_mascota').text(m && m.nombre ? m.nombre : '-');
    $('#traspaso_resumen_foto').replaceWith($(tcAvatar(m)).attr('id', 'traspaso_resumen_foto'));
    $('#traspaso_resumen_motivo').text($.trim($('#traspaso_situacion').val() || '') || '-');
};

const traspasoCargarResumen = (idMascota, rut, alTerminar) => {
    if (!idMascota) { traspasoMostrarResumen(null); return; }
    var $b = $('#btn_traspaso_siguiente');
    var fin = function() { traspasoCargando = false; tcBotonCargando($b, false); };
    traspasoCargando = true;
    tcBotonCargando($b, true, 'Revisando');
    traspasoActualizarWizard();

    var procesar = function(d) {
        fin();
        if (d.estado != 1) { traspasoErrorTutor(d.msj || 'No se pudo cargar el resumen.'); traspasoMostrarResumen(null); return; }
        if (d.tutor_nuevo) {
            traspasoTutor = Object.assign({}, traspasoTutor, d.tutor_nuevo);
            $('#traspaso_tutor_error').addClass('tc-oculto').text('');
        }
        traspasoMostrarResumen(d);
        if (traspasoResumenListo && typeof alTerminar === 'function') alTerminar();
    };

    if (tcEsDemo(idMascota)) {
        var r = (typeof MASCOTA_DEMO !== 'undefined' && MASCOTA_DEMO.resumen) || {};
        var t = tcTitular();
        setTimeout(function() {
            procesar({
                estado: 1,
                tutor_actual: { nombre: t.nombre, rut: t.rut },
                tutor_nuevo: { nombre: traspasoTutor.nombre, rut: rut, requiere_formulario: traspasoTutor.requiere_formulario },
                resumen: { fvu: (r.atenciones || []).length, vacunas: (r.vacunas || []).length, desparasitaciones: (r.desparasitaciones || []).length }
            });
        }, 400);
        return;
    }
    tcApi('traspaso_resumen_app', Object.assign({ id_mascota: idMascota, rut_tutor: rut }, traspasoDatosTutor())).done(procesar).fail(function(xhr) {
        fin();
        traspasoErrorTutor(tcMensajeError(xhr, 'No se pudo cargar el resumen del traspaso.'));
        traspasoMostrarResumen(null);
    });
};

const ejecutarTraspasoMascota = () => {
    if (traspasoCargando) return;
    var idMascota = $('#traspaso_mascota_id').val();
    var situacion = $.trim($('#traspaso_situacion').val() || '');
    var rut = $.trim($('#traspaso_rut_tutor').val() || '');
    if (!idMascota || situacion.length < 5 || !traspasoTutorListo() || !traspasoResumenListo) {
        tcAlerta('Traspaso incompleto', 'Seleccione mascota, indique el motivo y complete los datos del nuevo tutor.', 'warning');
        return;
    }
    var d = traspasoDatosTutor();
    var nombreTutor = traspasoTutor.nombre || [d.tutor_nombres, d.tutor_apellido_uno, d.tutor_apellido_dos].filter(Boolean).join(' ');
    var m = tcMascotas[idMascota];
    var nombreMascota = m ? m.nombre : 'la mascota';

    tcConfirmar('Confirmar traspaso', '¿Traspasar a ' + nombreMascota + ' al tutor ' + nombreTutor + '? Se transferirán FVU, carné de vacunas y desparasitaciones.', 'Confirmar traspaso')
        .then(function(ok) {
            if (!ok) return;
            if (tcEsDemo(idMascota)) {
                tcAlerta('Traspaso de mascota', 'El traspaso desde la app aún no está habilitado para la mascota de ejemplo.', 'info');
                return;
            }
            var $b = $('#btn_traspaso_confirmar');
            var fin = function() { traspasoCargando = false; tcBotonCargando($b, false); traspasoActualizarWizard(); };
            traspasoCargando = true;
            tcBotonCargando($b, true, 'Traspasando');
            traspasoActualizarWizard();
            tcApi('traspaso_ejecutar_app', Object.assign({
                id_mascota: idMascota, rut_tutor: rut, situacion: situacion, confirmar: 1
            }, d), 'POST').done(function(resp) {
                fin();
                if (resp.estado == 1) {
                    tcAlerta('Traspaso realizado', resp.msj || 'La mascota fue traspasada correctamente.', 'success');
                    tcMascotasOrden = [];
                    vista('mis-mascotas');
                } else {
                    tcAlerta('No se pudo traspasar', resp.msj || 'Intente nuevamente.', 'error');
                }
            }).fail(function(xhr) {
                fin();
                tcAlerta('Error en traspaso', tcMensajeError(xhr, 'No se pudo completar el traspaso.'), 'error');
            });
        });
};

$(document).on('change', '#traspaso_mascota_id', function() {
    traspasoActualizarMascota();
    traspasoResumenListo = false;
    $('#traspaso_paso1_error').addClass('tc-oculto');
    traspasoActualizarWizard();
});
$(document).on('input', '#traspaso_situacion', function() { $('#traspaso_paso1_error').addClass('tc-oculto'); traspasoActualizarWizard(); });
$(document).on('click', '#traspasar-mascota .traspaso-motivo', function() {
    $('#traspaso_situacion').val($(this).data('motivo')).trigger('input');
});
$(document).on('click', '#traspaso_pasos button', function() { irPasoTraspaso(Number($(this).data('paso'))); });
// Si cambia el RUT, hay que volver a buscar
$(document).on('input', '#traspaso_rut_tutor', function() {
    if (traspasoTutor) { traspasoLimpiarTutor(); traspasoActualizarWizard(); }
});
$(document).on('keydown', '#traspaso_rut_tutor', function(e) { if (e.key === 'Enter') { e.preventDefault(); buscarTutorTraspaso(); } });
$(document).on('input', '#traspaso_tutor_formulario input', function() { traspasoResumenListo = false; traspasoActualizarWizard(); });
