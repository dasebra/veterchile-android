var mensajesAppCache = [];

const escaparTextoMensaje = (valor) => $('<div>').text(valor == null ? '' : String(valor)).html();

const abrirMensajesApp = () => {
    $('.header-menu-perfil').removeClass('abierto');
    vista('mensajes-app', 'fade');
    cargarMensajesApp();
};

const cargarMensajesApp = () => {
    $('#mensajes-app-lista').html(
        '<div class="app-estado-carga"><span class="app-spinner"></span><p>Actualizando tus mensajes…</p></div>'
    );
    var rol = localStorage.getItem('rolActivo') === 'Profesional' ? 'Profesional' : 'Paciente';
    var api = new Api('mensajes', '');
    api.request({rol: rol}, function(resp) {
        mensajesAppCache = resp.registros || [];
        renderMensajesApp(mensajesAppCache, Number(resp.no_leidos || 0));
    }, function() {
        $('#mensajes-app-resumen').html('');
        $('#mensajes-app-lista').html(
            '<div class="mensajes-app-vacio">No fue posible cargar tus mensajes. Intenta nuevamente.</div>'
        );
    }, 'GET');
};

const renderMensajesApp = (mensajes, noLeidos) => {
    $('.mensajes-badge').text(noLeidos).toggle(noLeidos > 0);
    $('#mensajes-app-resumen').html(
        noLeidos > 0
            ? '<strong>' + noLeidos + '</strong> mensaje' + (noLeidos === 1 ? '' : 's') + ' sin leer'
            : 'No tienes mensajes pendientes'
    );

    if (!mensajes.length) {
        $('#mensajes-app-lista').html(
            '<div class="mensajes-app-vacio">Aún no tienes mensajes en esta bandeja.</div>'
        );
        return;
    }

    $('#mensajes-app-lista').html(mensajes.map(function(mensaje) {
        var cantidadAdjuntos = (mensaje.archivos || []).length;
        return '<button type="button" class="mensaje-app-card ' + (mensaje.leido ? '' : 'no-leido') +
            '" onclick="abrirDetalleMensajeApp(' + Number(mensaje.id) + ')">' +
                '<div class="mensaje-app-card-layout">' +
                    '<span class="mensaje-app-card-icono">' + (mensaje.leido ? '✉' : '●') + '</span>' +
                    '<div class="mensaje-app-card-contenido">' +
                        '<div class="mensaje-app-card-cabecera">' +
                            '<span class="mensaje-app-asunto">' + escaparTextoMensaje(mensaje.asunto) + '</span>' +
                            (mensaje.leido ? '' : '<span class="mensaje-app-nuevo">Nuevo</span>') +
                        '</div>' +
                        '<div class="mensaje-app-emisor">De: ' + escaparTextoMensaje(mensaje.emisor) + '</div>' +
                        '<div class="mensaje-app-preview">' + escaparTextoMensaje(mensaje.mensaje) + '</div>' +
                        '<div class="mensaje-app-card-pie">' +
                            '<span class="mensaje-app-fecha">' + escaparTextoMensaje(mensaje.fecha_envio) + '</span>' +
                            (cantidadAdjuntos ? '<span class="mensaje-app-clip">📎 ' + cantidadAdjuntos + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</button>';
    }).join(''));
};

const abrirDetalleMensajeApp = (id) => {
    var mensaje = mensajesAppCache.find(function(item) {
        return Number(item.id) === Number(id);
    });
    if (!mensaje) return;

    var adjuntos = (mensaje.archivos || []).map(function(archivo, indice) {
        return '<a class="mensaje-app-adjunto" href="#" onclick="abrirAdjuntoMensajeApp(' +
            Number(mensaje.id) + ', ' + indice + '); return false;">📎 ' +
            escaparTextoMensaje(archivo.nombre) + '</a>';
    }).join('');

    var contenido =
        '<div class="mensaje-app-detalle">' +
            '<h3>' + escaparTextoMensaje(mensaje.asunto) + '</h3>' +
            '<div class="mensaje-app-detalle-meta">De: ' + escaparTextoMensaje(mensaje.emisor) +
                '<br>' + escaparTextoMensaje(mensaje.fecha_envio) + '</div>' +
            '<div class="mensaje-app-cuerpo">' + escaparTextoMensaje(mensaje.mensaje).replace(/\n/g, '<br>') + '</div>' +
            (adjuntos ? '<div class="mensaje-app-adjuntos"><strong>Adjuntos</strong>' + adjuntos + '</div>' : '') +
        '</div>';

    $('#mensaje-app-modal-contenido').html(contenido);
    $('#mensaje-app-overlay').addClass('visible').attr('aria-hidden', 'false');

    if (!mensaje.leido) {
        var api = new Api('mensajes/' + mensaje.id, 'leer');
        api.request({}, function() {
            mensaje.leido = true;
            renderMensajesApp(
                mensajesAppCache,
                mensajesAppCache.filter(function(item) { return !item.leido; }).length
            );
        }, function() {}, 'PUT');
    }
};

const cerrarDetalleMensajeApp = () => {
    $('#mensaje-app-overlay').removeClass('visible').attr('aria-hidden', 'true');
};

const abrirAdjuntoMensajeApp = (mensajeId, indice) => {
    var mensaje = mensajesAppCache.find(function(item) {
        return Number(item.id) === Number(mensajeId);
    });
    var url = mensaje && mensaje.archivos && mensaje.archivos[indice]
        ? mensaje.archivos[indice].url
        : '';
    if (!url) return;
    if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
        cordova.InAppBrowser.open(url, '_system');
        return;
    }
    window.open(url, '_blank');
};

$(document).on('pageshow', '#mensajes-app', function() {
    cargarMensajesApp();
});
