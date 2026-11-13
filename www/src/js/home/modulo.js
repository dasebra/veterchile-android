var svg_receta = '<svg style="width: 40px;" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512"> <g> <g> <g> <path d="m208,177.2h27.7v26.2c0,11.3 9.1,20.4 20.4,20.4 11.3,0 20.4-9.1 20.4-20.4v-26.2h27.7c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-27.7v-26.2c0-11.3-9.1-20.4-20.4-20.4-11.3,0-20.4,9.1-20.4,20.4v26.2h-27.7c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.2,20.4 20.4,20.4z"/> <path d="M440.5,10.8H71.8c-11.3,0-20.4,9.1-20.4,20.4v449.2c0,11.3,9.1,20.4,20.4,20.4h368.7c11.3,0,20.4-9.1,20.4-20.4V31.2 C460.9,20,451.8,10.8,440.5,10.8z M420.1,460H92.2V51.7h327.9V460z"/> <path d="m157.3,318h197.6c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-197.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.2 9.1,20.4 20.4,20.4z"/> <path d="m157.3,409.6h197.6c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-197.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.2 9.1,20.4 20.4,20.4z"/> </g> </g> </g></svg>';


/* =========================================================
   SweetAlert2 MED-SDI
   Funciones reutilizables para toda la aplicación.
   Si SweetAlert2 no carga, se usa confirm/alert del navegador.
   ========================================================= */

const swalMedsdi = (titulo, mensaje, tipo, opciones) => {
    tipo = tipo || 'info';
    opciones = opciones || {};

    if (typeof Swal === 'undefined') {
        window.alert((titulo ? titulo + '\n\n' : '') + (mensaje || ''));
        return Promise.resolve({isConfirmed: true});
    }

    return Swal.fire(Object.assign({
        title: titulo || 'MED-SDI',
        text: mensaje || '',
        icon: tipo,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#6f42c1',
        buttonsStyling: true,
        heightAuto: false,
        allowOutsideClick: false,
        customClass: {
            popup: 'swal-medsdi-popup',
            title: 'swal-medsdi-title',
            htmlContainer: 'swal-medsdi-text',
            confirmButton: 'swal-medsdi-confirm',
            cancelButton: 'swal-medsdi-cancel'
        }
    }, opciones));
};

const confirmarMedsdi = (titulo, mensaje, opciones) => {
    opciones = opciones || {};

    if (typeof Swal === 'undefined') {
        return Promise.resolve(window.confirm((titulo ? titulo + '\n\n' : '') + (mensaje || '')));
    }

    return Swal.fire(Object.assign({
        title: titulo || 'Confirmar',
        text: mensaje || '',
        icon: opciones.icon || 'question',
        showCancelButton: true,
        confirmButtonText: opciones.confirmButtonText || 'Confirmar',
        cancelButtonText: opciones.cancelButtonText || 'Cancelar',
        confirmButtonColor: opciones.confirmButtonColor || '#6f42c1',
        cancelButtonColor: opciones.cancelButtonColor || '#7b8a9a',
        reverseButtons: true,
        focusCancel: true,
        heightAuto: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
            popup: 'swal-medsdi-popup',
            title: 'swal-medsdi-title',
            htmlContainer: 'swal-medsdi-text',
            confirmButton: 'swal-medsdi-confirm',
            cancelButton: 'swal-medsdi-cancel'
        }
    }, opciones)).then(function(resultado) {
        return !!resultado.isConfirmed;
    });
};


$(document).on("pageshow", "#home", function () {
    // La verificación del equipo se reutiliza durante varios minutos.
    // No cargamos recetas automáticamente desde el home.
    if (typeof checkDevice === 'function') {
        checkDevice(null, true);
    }
});

$(document).on('pageshow', '#index, #inicio-profesional', function () {
    if (typeof checkDevice !== 'function') {
        return;
    }

    checkDevice(function (deviceReady) {
        if (!deviceReady) {
            return;
        }

        console.log(
            'Dispositivo verificado. Emergency token:',
            localStorage.getItem('emergencyToken') ? 'OK' : 'NO DISPONIBLE'
        );
    }, true);
});

var homeResumenTimer = null;

const fechaIsoCita = (hora) => String(hora && hora.fecha_consulta || '').slice(0, 10);

const fechaCortaHome = (iso) => {
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
};

// Horas anuladas, canceladas o rechazadas: no se muestran en ninguna lista ni resumen.
const esHoraAnulada = (h) => {
    var t = [h && h.estado, h && h.estado_agenda, h && h.nombre_estado]
        .filter(Boolean).join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return /anulad|cancelad|rechazad|eliminad|suspendid/.test(t) || !!(h && (h.anulada || h.cancelada || h.deleted_at));
};

const construirSlidesHome = (horas) => {
    var hoy = new Date();
    var hoyIso = hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + ('0' + hoy.getDate()).slice(-2);

    var vigentes = (horas || []).filter(function(h) {
        return !esHoraAnulada(h) && [1, 2].indexOf(Number(h.id_estado)) !== -1 && fechaIsoCita(h) >= hoyIso;
    }).sort(function(a, b) {
        return (fechaIsoCita(a) + (a.hora_inicio || '')).localeCompare(fechaIsoCita(b) + (b.hora_inicio || ''));
    });

    var deHoy = vigentes.filter(function(h) { return fechaIsoCita(h) === hoyIso; });
    var porConfirmar = vigentes.filter(function(h) { return Number(h.id_estado) === 1; });
    var proxima = vigentes.filter(function(h) { return Number(h.id_estado) === 2; })[0];
    var profesional = function(h) {
        return escaparTextoConsentimiento(nombrePropio(((h.nombre_profesional || '') + ' ' + (h.apellido_uno_profesional || '')).trim()));
    };

    var slideHoy = {
        kicker: 'Hoy · ' + fechaCortaHome(hoyIso),
        titulo: 'No hay citas agendadas',
        accion: { texto: 'Agendar', onclick: "vista('pedirhora')" }
    };
    if (deHoy.length === 1) {
        slideHoy.titulo = 'Tienes una cita hoy';
        slideHoy.texto = (deHoy[0].hora_inicio || '') + (profesional(deHoy[0]) ? ' · ' + profesional(deHoy[0]) : '');
        slideHoy.accion = { texto: 'Ver', onclick: "vista('citas'); solicitarMisHorasMedicas();" };
    } else if (deHoy.length > 1) {
        slideHoy.titulo = 'Tienes ' + deHoy.length + ' citas hoy';
        slideHoy.texto = 'La primera es a las ' + (deHoy[0].hora_inicio || '');
        slideHoy.accion = { texto: 'Ver', onclick: "vista('citas'); solicitarMisHorasMedicas();" };
    }

    var slideConfirmar;
    if (porConfirmar.length) {
        slideConfirmar = {
            kicker: 'Por confirmar · ' + fechaCortaHome(fechaIsoCita(porConfirmar[0])) + ' · ' + (porConfirmar[0].hora_inicio || ''),
            titulo: porConfirmar.length === 1
                ? 'Tienes una hora agendada, confírmala'
                : 'Tienes ' + porConfirmar.length + ' horas agendadas, confírmalas',
            accion: { texto: 'Confirmar', onclick: "vista('citas'); solicitarMisHorasMedicas();" }
        };
    } else if (proxima) {
        slideConfirmar = {
            kicker: 'Próximas citas',
            titulo: fechaCortaHome(fechaIsoCita(proxima)) + ' · ' + (proxima.hora_inicio || ''),
            texto: profesional(proxima),
            accion: { texto: 'Ver', onclick: "vista('citas'); solicitarMisHorasMedicas();" }
        };
    } else {
        slideConfirmar = {
            kicker: 'Próximas citas',
            titulo: 'Agenda tu próxima hora',
            accion: { texto: 'Agendar', onclick: "vista('pedirhora')" }
        };
    }

    return [slideHoy, slideConfirmar];
};

const hoyIsoHome = () => {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
};

const construirSlidesProfesional = (agenda, pendientes) => {
    var hoyIso = hoyIsoHome();
    var ahora = new Date();
    var horaActual = ('0' + ahora.getHours()).slice(-2) + ':' + ('0' + ahora.getMinutes()).slice(-2);

    var atenciones = (agenda || []).filter(function(h) {
        return !esHoraAnulada(h);
    }).sort(function(a, b) {
        return String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''));
    });
    var proxima = atenciones.filter(function(h) {
        return String(h.hora_inicio || '').slice(0, 5) >= horaActual;
    })[0];
    var telemedicina = atenciones.filter(function(h) { return h.es_telemedicina; }).length;

    var slideHoy = {
        kicker: 'Hoy · ' + fechaCortaHome(hoyIso),
        titulo: 'Hoy no tienes atenciones',
        accion: { texto: 'Ver agenda', onclick: "vista('agenda-profesional'); cargarAgendaProfesional()" }
    };
    if (proxima) {
        slideHoy.titulo = 'Próxima atención ' + escaparTextoConsentimiento(String(proxima.hora_inicio).slice(0, 5)) +
            (proxima.lugar ? ' en ' + escaparTextoConsentimiento(proxima.lugar) : '');
    } else if (atenciones.length) {
        slideHoy.titulo = 'No te quedan más atenciones hoy';
    }

    var slideSolicitudes = {
        kicker: 'Autorizaciones',
        titulo: 'Tienes ' + pendientes + (pendientes === 1 ? ' autorización pendiente' : ' autorizaciones pendientes'),
        accion: { texto: 'Revisar', onclick: "vista('autorizaciones_sdi')" }
    };

    var slideAgenda = {
        kicker: 'Tu agenda de hoy',
        titulo: atenciones.length === 1 ? '1 atención agendada' : atenciones.length + ' atenciones agendadas',
        accion: { texto: 'Tutores y mascotas', onclick: 'abrirMisPacientesProfesional()' }
    };
    if (telemedicina) {
        slideAgenda.texto = telemedicina + ' por telemedicina';
    }

    return [slideHoy, slideSolicitudes, slideAgenda];
};

const raizResumenActiva = () => $('.ui-page-active .home-resumen').first();

const mostrarSlideHome = (indice, $raiz) => {
    $raiz = $raiz && $raiz.length ? $raiz : raizResumenActiva();
    var $slides = $raiz.find('.home-resumen-slide');
    if (!$slides.length) return;
    indice = (indice + $slides.length) % $slides.length;

    var $anterior = $slides.filter('.activo');
    if ($anterior.length && $anterior.index() !== indice) {
        $anterior.removeClass('activo').addClass('saliendo');
        setTimeout(function() { $anterior.removeClass('saliendo'); }, 520);
    }
    $slides.eq(indice).addClass('activo').removeClass('saliendo');
    $raiz.find('.home-resumen-puntos button').removeClass('activo').eq(indice).addClass('activo');
    $raiz.data('indice', indice);
};

const detenerRotacionHome = () => {
    if (homeResumenTimer) {
        clearInterval(homeResumenTimer);
        homeResumenTimer = null;
    }
};

const iniciarRotacionHome = () => {
    detenerRotacionHome();
    homeResumenTimer = setInterval(function() {
        var $raiz = raizResumenActiva();
        if ($raiz.length) {
            mostrarSlideHome(($raiz.data('indice') || 0) + 1, $raiz);
        }
    }, 5500);
};

const renderizarResumenHome = (slides, $raiz) => {
    $raiz.find('.home-resumen-pista').html(slides.map(function(s, i) {
        return '<article class="home-resumen-slide' + (i === 0 ? ' activo' : '') + '">' +
            '<div class="home-resumen-texto">' +
                '<span class="home-resumen-kicker">' + s.kicker + '</span>' +
                '<strong>' + s.titulo + '</strong>' +
                (s.texto ? '<p>' + s.texto + '</p>' : '') +
            '</div>' +
            (s.accion ? '<button type="button" data-role="none" class="home-resumen-accion" onclick="' + s.accion.onclick + '">' + s.accion.texto + '</button>' : '') +
            '</article>';
    }).join(''));
    $raiz.find('.home-resumen-puntos').html(slides.map(function(s, i) {
        return '<button type="button" data-role="none" aria-label="Ir al aviso ' + (i + 1) + '" data-indice="' + i + '"' + (i === 0 ? ' class="activo"' : '') + '></button>';
    }).join(''));
    $raiz.data('indice', 0);
    iniciarRotacionHome();
};

// Se consulta sin el loader global: es información de apoyo del home.
const consultarSinLoader = (ruta, datos, alExito, alError) => {
    $.ajax({
        type: 'GET',
        url: MEDSDI_API_URL + ruta,
        data: datos,
        dataType: 'json',
        headers: { 'Accept': 'application/json', 'X-Auth-Token': localStorage.getItem('authToken') },
        timeout: 15000,
        success: alExito,
        error: alError
    });
};

const cargarResumenHome = () => {
    var $raiz = $('#index .home-resumen');
    renderizarResumenHome(construirSlidesHome([]), $raiz);

    if (!localStorage.getItem('authToken') || localStorage.getItem('rolActivo') === 'Profesional') return;

    consultarSinLoader('/paciente/agenda', { id_paciente: _SESSION('id_usuario') }, function(resp) {
        if (resp && resp.estado == 1 && Array.isArray(resp.horas)) {
            renderizarResumenHome(construirSlidesHome(resp.horas), $raiz);
        }
    });
};

const cargarResumenProfesional = () => {
    var $raiz = $('#inicio-profesional .home-resumen');
    var datos = { agenda: [], pendientes: 0 };
    var pintar = function() {
        renderizarResumenHome(construirSlidesProfesional(datos.agenda, datos.pendientes), $raiz);
    };
    pintar();

    if (!localStorage.getItem('authToken') || localStorage.getItem('rolActivo') !== 'Profesional') return;

    consultarSinLoader('/profesional/agenda', { id_lugar_atencion: '', fecha: hoyIsoHome() }, function(resp) {
        datos.agenda = resp && Array.isArray(resp.registros) ? resp.registros : [];
        pintar();
    });

    consultarSinLoader('/mobile-authorization/requests', {}, function(resp) {
        var registros = resp && resp.estado == 1 && Array.isArray(resp.registros) ? resp.registros : [];
        datos.pendientes = registros.filter(function(r) { return Number(r.estado) === 0; }).length;
        pintar();
    });
};

// ===== Banner promocional del home del tutor: una imagen de fondo por slide =====
// Para agregar otro slide, suma un objeto con su imagen (1080 x 160 px en src/images).
const promosHome = [
    {
        imagen: 'src/images/veterfood.png?v=20261112c',
        tono: 'naranjo',
        titulo: 'Próximamente programa tu despacho de alimento mensual'
    },
    {
        imagen: 'src/images/veterfarma.png?v=20261112c',
        tono: 'verde',
        titulo: 'Próximamente los medicamentos en la puerta de tu casa',
        texto: '¡Pide a domicilio!'
    }
];

// Degradado claro que queda detrás de la imagen del slide (verde light / naranjo tenue / morado light).
const fondosDegradadoPromo = {
    verde: 'linear-gradient(135deg,#f1faf7 0%,#cdebe2 100%)',
    naranjo: 'linear-gradient(135deg,#fff8f0 0%,#fbdcbd 100%)',
    morado: 'linear-gradient(135deg,#f8f4fd 0%,#dccdf3 100%)'
};

// Enlaces de las tiendas aliadas. Completar la URL de cada una cuando esté definida.
const tiendasAliadas = { Veterfood: '', Farmavet: '' };

const abrirTiendaAliada = (nombre) => {
    var url = tiendasAliadas[nombre];
    if (!url) { msg(nombre, 'Muy pronto podrás ir a ' + nombre + ' desde la app.', 'info'); return; }
    window.open(url, '_system');
};

var promoHomeTimer = null;
var promoHomeIndice = 0;

const mostrarPromoHome = (indice) => {
    var $slides = $('#home_promo .home-promo-slide');
    if (!$slides.length) return;
    promoHomeIndice = (indice + $slides.length) % $slides.length;
    $slides.removeClass('activo').eq(promoHomeIndice).addClass('activo');
    $('#home_promo .home-promo-puntos button').removeClass('activo').eq(promoHomeIndice).addClass('activo');
};

const detenerPromoHome = () => {
    if (promoHomeTimer) { clearInterval(promoHomeTimer); promoHomeTimer = null; }
};

const iniciarPromoHome = () => {
    detenerPromoHome();
    if (promosHome.length < 2) return;
    promoHomeTimer = setInterval(function() { mostrarPromoHome(promoHomeIndice + 1); }, 6000);
};

const renderizarPromoHome = () => {
    var $promo = $('#home_promo');
    if (!promosHome.length) { $promo.hide(); return; }
    $promo.show();
    $('#home_promo_pista').html(promosHome.map(function(p, i) {
        return '<article class="home-promo-slide' + (i === 0 ? ' activo' : '') + (p.imagen ? '' : ' sin-imagen') + (p.tono ? ' tono-' + p.tono : '') + '" style="' +
            (p.imagen ? 'background-image:url(\'' + p.imagen + '\')' + (fondosDegradadoPromo[p.tono] ? ',' + fondosDegradadoPromo[p.tono] : '') + ';' : '') +
            (p.fondo ? 'background-color:' + p.fondo + ';' : '') + '">' +
            '<div class="home-promo-texto"><div class="home-promo-copy"><strong>' + p.titulo + '</strong>' +
            (p.texto ? '<p>' + p.texto + '</p>' : '') + '</div>' +
            (p.accion
                ? (p.accion.deshabilitado
                    ? '<span class="home-promo-badge">' + p.accion.texto + '</span>'
                    : '<button type="button" data-role="none" class="home-promo-accion" onclick="' + p.accion.onclick + '">' + p.accion.texto + '</button>')
                : '') +
            '</div></article>';
    }).join(''));
    $('#home_promo_puntos').html(promosHome.length < 2 ? '' : promosHome.map(function(p, i) {
        return '<button type="button" data-role="none" aria-label="Ir a la promoción ' + (i + 1) + '" data-indice="' + i + '"' + (i === 0 ? ' class="activo"' : '') + '></button>';
    }).join(''));
    promoHomeIndice = 0;
    iniciarPromoHome();
};

$(document).on('click', '#home_promo .home-promo-puntos button', function() {
    mostrarPromoHome(Number($(this).data('indice')));
    iniciarPromoHome();
});

$(document).on('pageshow', '#index', renderizarPromoHome);
$(document).on('pagehide', '#index', detenerPromoHome);

$(document).on('pageshow', '#index', cargarResumenHome);
$(document).on('pageshow', '#inicio-profesional', cargarResumenProfesional);
$(document).on('pagehide', '#index, #inicio-profesional', detenerRotacionHome);

$(document).on('click', '.home-resumen-puntos button', function() {
    mostrarSlideHome(Number($(this).data('indice')), $(this).closest('.home-resumen'));
    iniciarRotacionHome();
});

(function() {
    var inicioX = null;
    $(document).on('touchstart', '.home-resumen', function(ev) {
        inicioX = ev.originalEvent.touches[0].clientX;
        detenerRotacionHome();
    });
    $(document).on('touchend', '.home-resumen', function(ev) {
        if (inicioX !== null) {
            var dx = ev.originalEvent.changedTouches[0].clientX - inicioX;
            var $raiz = $(this);
            if (Math.abs(dx) > 40) mostrarSlideHome(($raiz.data('indice') || 0) + (dx < 0 ? 1 : -1), $raiz);
        }
        inicioX = null;
        iniciarRotacionHome();
    });
})();

$(document).on('pageshow', '#certificadosro', function() {
    list_consentimientos();
});

$(document).on('pageshow', '#recetasro', function() {
    list_recetas_paciente();
});

$(document).on('pageshow', '#examenesro', function() {
    list_examenes_paciente();
});

$(document).on('click', '.js-ver-consentimiento', function() {
    abrirConsentimiento($(this).attr('data-consentimiento-url'));
});

$(document).on('click', '.js-ver-receta', function() {
    abrirConsentimiento($(this).attr('data-receta-url'));
});

$(document).on('click', '.js-ver-examen', function() {
    abrirDocumentoClinico($(this).attr('data-examen-url'), 'examen');
});

$(document).on("pageshow", "#autorizaciones_sdi", function () {
    configurarFooterAutorizaciones();

    // La primera vista prioriza las solicitudes que requieren acción.
    if (!autorizacionesFiltroActivo) {
        autorizacionesFiltroActivo = 'pendientes';
    }

    // Primero verificamos el dispositivo. Solo si está OK cargamos autorizaciones.
    checkDevice(function (deviceReady) {
        if (!deviceReady) {
            return;
        }

        // Fuerza una recarga al entrar, pero manteniendo protección
        // contra solicitudes simultáneas.
        list_log_device();
    }, true);
});

$(document).on('pagehide', '#autorizaciones_sdi', function () {
    // Solo liberamos la lista pesada. El detalle pertenece a otra página.
    $('#list_log_reg').empty();
});

const volverInicioSegunRol = () => {
    const rolActivo = localStorage.getItem('rolActivo');
    vista(rolActivo === 'Profesional' ? 'inicio-profesional' : 'index', 'fade');
};

// Menú inferior único de las pantallas interiores, según el rol activo.
const PAGINAS_SIN_MENU_INFERIOR = ['login', 'seleccionar-rol', 'index', 'inicio-profesional', 'autorizado', 'rechazado', 'log-secundario', 'recuperar-clave'];

const menuInferiorHtml = (profesional) => {
    var item = function(onclick, icono, texto) {
        return '<div class="col-xs-4 pt10 pb10 text-center">' +
            '<p class="color-blanco size12" onclick="' + onclick + '"><img class="mb10" width="20" src="src/images/' + icono + '"><br>' + texto + '</p>' +
            '</div>';
    };
    return '<div class="row bg-azul">' +
        item(profesional ? "vista('inicio-profesional')" : "vista('index')", 'home.svg', 'Inicio') +
        (profesional
            ? item("vista('agenda-profesional'); cargarAgendaProfesional()", 'citas.svg', 'Agenda')
            : item("vista('citas'); solicitarMisHorasMedicas()", 'citas.svg', 'Citas')) +
        item('cerrarSesion()', 'salir.svg', 'Cerrar sesión') +
        '</div>';
};

$(document).on('pagebeforeshow', '[data-role="page"]', function() {
    var $pagina = $(this);
    if (PAGINAS_SIN_MENU_INFERIOR.indexOf($pagina.attr('id')) !== -1) return;

    var $menu = $pagina.children('.menu-inferior');
    if (!$menu.length) {
        $menu = $('<div class="footer menu-inferior"></div>').appendTo($pagina);
        $pagina.addClass('con-menu-inferior');
    }
    $menu.html(menuInferiorHtml(localStorage.getItem('rolActivo') === 'Profesional'));
});

// Con el teclado abierto el menú inferior se oculta: así no queda flotando sobre el teclado ni deja huecos.
$(document).on('focusin', 'input:not([type=checkbox]):not([type=radio]):not([type=button]), textarea', function() {
    $('body').addClass('teclado-abierto');
});

$(document).on('focusout', 'input, textarea', function() {
    $('body').removeClass('teclado-abierto');
});

const toggleMenuPerfil = (event) => {
    if (event) event.stopPropagation();
    $('.header-notificaciones-caja').removeClass('abierto');
    var $menu = $(event.currentTarget).closest('.header-menu-perfil');
    $('.header-menu-perfil').not($menu).removeClass('abierto');
    $menu.toggleClass('abierto');
};

const toggleNotificaciones = (event) => {
    if (event) event.stopPropagation();
    var $caja = $(event.currentTarget).closest('.header-notificaciones-caja');
    $('.header-menu-perfil').removeClass('abierto');
    $('.header-notificaciones-caja').not($caja).removeClass('abierto');
    $caja.toggleClass('abierto');
    if ($caja.hasClass('abierto') && typeof alAbrirNotificaciones === 'function') alAbrirNotificaciones();
};

$(document).on('click', function() {
    $('.header-menu-perfil').removeClass('abierto');
    $('.header-notificaciones-caja').removeClass('abierto');
});

// Mi perfil: lista de opciones y vistas internas (solo interfaz).
const mostrarVistaPerfilApp = (vista) => {
    $('.perfil-app-form').attr('data-vista', vista);
    window.scrollTo(0, 0);
};

const volverPerfilApp = () => {
    if ($('.perfil-app-form').attr('data-vista') !== 'menu') {
        cancelarFotoAjustada();
        mostrarVistaPerfilApp('menu');
        return;
    }
    volverInicioSegunRol();
};

const abrirEditarPerfil = () => {
    $('.header-menu-perfil').removeClass('abierto');
    $('.perfil-app-form').attr('data-vista', 'menu');
    var rol = localStorage.getItem('rolActivo') === 'Profesional'
        ? 'Profesional'
        : 'Paciente';
    var api = new Api('perfil', 'datos');
    api.request(
        {rol: rol},
        function(resp) {
            var perfil = resp.perfil || {};
            $('#perfil_app_rol').val(rol);
            $('#perfil_app_nombres').val(perfil.nombres || '');
            $('#perfil_app_apellido_uno').val(perfil.apellido_uno || '');
            $('#perfil_app_apellido_dos').val(perfil.apellido_dos || '');
            $('#perfil_app_telefono_uno').val(perfil.telefono_uno || '');
            $('#perfil_app_telefono_dos').val(perfil.telefono_dos || '');
            $('#perfil_app_email').val(perfil.email || '');
            actualizarNombreHeroPerfil();
            var perfilLocal = {};
            try {
                perfilLocal = JSON.parse(localStorage.getItem(
                    rol === 'Profesional' ? 'perfilProfesional' : 'perfilPaciente'
                ) || '{}') || {};
            } catch (error) {
                perfilLocal = {};
            }
            var rut = perfil.rut || perfilLocal.rut || '';
            $('#perfil_menu_rut').text(rut ? 'RUT: ' + rut : '').toggle(!!rut);
            $('#perfil_app_rut').val(rut);
            $('#perfil_app_foto, #perfil_app_foto_camara').val('');
            $('.perfil-app-foto').removeClass('con-nueva-foto');
            $('#perfil_app_foto_preview, #perfil_menu_foto').attr(
                'src',
                perfil.foto_perfil_url || 'src/images/avatar-generico.svg'
            );
            $('#perfil_app_clave_actual, #perfil_app_clave_nueva, #perfil_app_clave_confirmacion, #perfil_app_biometria_pin, #perfil_app_password_login').val('');
            vista('editar-perfil-app', 'fade');
            if (typeof actualizarEstadoBiometriaApp === 'function') {
                actualizarEstadoBiometriaApp();
            }
        },
        function() {
            msg('Perfil', 'No fue posible cargar el perfil.', 'error');
        },
        'GET'
    );
};

const guardarPerfilApp = () => {
    var datos = {
        rol: $('#perfil_app_rol').val(),
        nombres: $.trim($('#perfil_app_nombres').val()),
        apellido_uno: $.trim($('#perfil_app_apellido_uno').val()),
        apellido_dos: $.trim($('#perfil_app_apellido_dos').val()),
        telefono_uno: $.trim($('#perfil_app_telefono_uno').val()),
        telefono_dos: $.trim($('#perfil_app_telefono_dos').val())
    };
    var api = new Api('perfil', 'datos');
    api.request(datos, function(resp) {
        msg('Perfil', resp.msj || 'Perfil actualizado.', 'success');
        localStorage.setItem('nombre', datos.nombres);
        volverInicioSegunRol();
    }, function(xhr) {
        var mensaje = xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : 'Revisa los datos ingresados.';
        msg('Perfil', mensaje, 'error');
    }, 'PUT');
};

const abrirOpcionesFotoPerfil = () => {
    $('.perfil-app-foto').addClass('sheet-abierta');
};

const cerrarOpcionesFotoPerfil = () => {
    $('.perfil-app-foto').removeClass('sheet-abierta');
};

const elegirOrigenFotoPerfil = (idInput) => {
    cerrarOpcionesFotoPerfil();
    var input = document.getElementById(idInput);
    input.value = '';
    input.click();
};

$(document).on('change', '#perfil_app_foto, #perfil_app_foto_camara', function() {
    var archivo = this.files && this.files[0];
    if (!archivo) return;
    var maximo = (this.id === 'perfil_app_foto_camara' ? 25 : 5) * 1024 * 1024;
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type) || archivo.size > maximo) {
        this.value = '';
        $('.perfil-app-foto').removeClass('con-nueva-foto');
        msg('Foto de perfil', 'Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.', 'error');
        return;
    }
    iniciarEncuadreFotoPerfil(archivo);
});

const actualizarNombreHeroPerfil = () => {
    var nombre = $.trim($('#perfil_app_nombres').val() + ' ' + $('#perfil_app_apellido_uno').val());
    $('#perfil_hero_nombre, #perfil_menu_nombre').text(nombre ? nombrePropio(nombre) : 'Nombre Apellido');
};

$(document).on('input', '#perfil_app_nombres, #perfil_app_apellido_uno', actualizarNombreHeroPerfil);

/*
 * Encuadre visual de la foto de perfil (solo interfaz): se arrastra y se hace
 * zoom dentro del círculo; al guardar se recorta a un cuadrado y se entrega a
 * guardarFotoPerfilApp(), que sigue siendo quien sube la foto.
 */
var encuadreFoto = { x: 0, y: 0, escala: 1, minimo: 1, ancho: 0, alto: 0, marco: 0, url: null };

const aplicarEncuadreFoto = () => {
    var e = encuadreFoto;
    var s = e.minimo * e.escala;
    e.x = Math.min(0, Math.max(e.marco - e.ancho * s, e.x));
    e.y = Math.min(0, Math.max(e.marco - e.alto * s, e.y));
    $('#perfil_foto_editor').css('transform', 'translate(' + e.x + 'px,' + e.y + 'px) scale(' + s + ')');
};

const iniciarEncuadreFotoPerfil = (archivo) => {
    if (encuadreFoto.url) URL.revokeObjectURL(encuadreFoto.url);
    encuadreFoto.url = URL.createObjectURL(archivo);

    var editor = document.getElementById('perfil_foto_editor');
    editor.onload = function() {
        var e = encuadreFoto;
        $('.perfil-app-foto').addClass('con-nueva-foto');
        e.marco = document.getElementById('perfil_foto_marco').clientWidth; // ya excluye el borde
        e.ancho = editor.naturalWidth;
        e.alto = editor.naturalHeight;
        e.minimo = e.marco / Math.min(e.ancho, e.alto);
        e.escala = 1;
        e.x = (e.marco - e.ancho * e.minimo) / 2;
        e.y = (e.marco - e.alto * e.minimo) / 2;
        $('#perfil_foto_zoom').val(100);
        $(editor).css({ width: e.ancho + 'px', height: e.alto + 'px' });
        aplicarEncuadreFoto();
    };
    editor.onerror = function() {
        cancelarFotoAjustada();
        msg('Foto de perfil', 'No fue posible leer la imagen. Prueba con otra.', 'error');
    };
    editor.src = encuadreFoto.url;
};

$(document).on('input', '#perfil_foto_zoom', function() {
    var e = encuadreFoto;
    var anterior = e.minimo * e.escala;
    var centroX = (e.marco / 2 - e.x) / anterior;
    var centroY = (e.marco / 2 - e.y) / anterior;
    e.escala = this.value / 100;
    var nueva = e.minimo * e.escala;
    e.x = e.marco / 2 - centroX * nueva;
    e.y = e.marco / 2 - centroY * nueva;
    aplicarEncuadreFoto();
});

(function() {
    var arrastre = null;
    $(document).on('pointerdown', '.perfil-app-foto.con-nueva-foto #perfil_foto_marco', function(ev) {
        arrastre = { px: ev.originalEvent.clientX, py: ev.originalEvent.clientY, x: encuadreFoto.x, y: encuadreFoto.y };
        try { this.setPointerCapture(ev.originalEvent.pointerId); } catch (err) {}
    });
    $(document).on('pointermove', '#perfil_foto_marco', function(ev) {
        if (!arrastre) return;
        encuadreFoto.x = arrastre.x + (ev.originalEvent.clientX - arrastre.px);
        encuadreFoto.y = arrastre.y + (ev.originalEvent.clientY - arrastre.py);
        aplicarEncuadreFoto();
    });
    $(document).on('pointerup pointercancel', '#perfil_foto_marco', function() { arrastre = null; });
})();

const cancelarFotoAjustada = () => {
    $('#perfil_app_foto, #perfil_app_foto_camara').val('');
    $('.perfil-app-foto').removeClass('con-nueva-foto sheet-abierta');
    if (encuadreFoto.url) {
        URL.revokeObjectURL(encuadreFoto.url);
        encuadreFoto.url = null;
    }
};

// Recorta lo que se ve dentro del círculo y lo sube con la función existente.
const guardarFotoAjustada = () => {
    var e = encuadreFoto;
    var editor = document.getElementById('perfil_foto_editor');
    if (!editor.naturalWidth) return;

    var s = e.minimo * e.escala;
    var lado = 512;
    var lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.drawImage(editor, -e.x / s, -e.y / s, e.marco / s, e.marco / s, 0, 0, lado, lado);

    lienzo.toBlob(function(blob) {
        if (!blob) {
            msg('Foto de perfil', 'No fue posible preparar la foto.', 'error');
            return;
        }
        var recorte = new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' });
        var transferencia = new DataTransfer();
        transferencia.items.add(recorte);
        document.getElementById('perfil_app_foto').files = transferencia.files;
        guardarFotoPerfilApp();
    }, 'image/jpeg', 0.9);
};

const guardarFotoPerfilApp = () => {
    var input = document.getElementById('perfil_app_foto');
    var archivo = input && input.files ? input.files[0] : null;
    if (!archivo) {
        msg('Foto de perfil', 'Selecciona una foto antes de continuar.', 'error');
        return;
    }

    var formData = new FormData();
    formData.append('rol', $('#perfil_app_rol').val());
    formData.append('foto', archivo);

    $.ajax({
        url: MEDSDI_API_URL + '/perfil/foto',
        type: 'POST',
        data: formData,
        headers: {
            'Accept': 'application/json',
            'X-Auth-Token': localStorage.getItem('authToken')
        },
        contentType: false,
        processData: false,
        success: function(resp) {
            $('#perfil_app_foto_preview, #perfil_menu_foto').attr('src', resp.foto_perfil_url);
            $('#perfil_app_foto').val('');
            $('.perfil-app-foto').removeClass('con-nueva-foto');
            localStorage.setItem('foto_perfil', resp.foto_perfil || '');
            localStorage.setItem('foto_perfil_url', resp.foto_perfil_url || '');

            var clavePerfil = $('#perfil_app_rol').val() === 'Profesional'
                ? 'perfilProfesional'
                : 'perfilPaciente';
            try {
                var perfilGuardado = JSON.parse(localStorage.getItem(clavePerfil) || '{}');
                perfilGuardado.foto_perfil = resp.foto_perfil || '';
                perfilGuardado.foto_perfil_url = resp.foto_perfil_url || '';
                localStorage.setItem(clavePerfil, JSON.stringify(perfilGuardado));
            } catch (error) {
                console.log('No fue posible actualizar la copia local del perfil.', error);
            }

            if (typeof actualizarHeaderUsuario === 'function') {
                actualizarHeaderUsuario();
            }
            msg('Foto de perfil', resp.msj || 'Foto actualizada.', 'success');
        },
        error: function(xhr) {
            var mensaje = xhr.responseJSON && xhr.responseJSON.message
                ? xhr.responseJSON.message
                : 'No fue posible actualizar la foto.';
            // Si falló, vuelve a mostrar la foto que sigue guardada.
            $('#perfil_app_foto').val('');
            $('.perfil-app-foto').removeClass('con-nueva-foto');
            $('#perfil_app_foto_preview, #perfil_menu_foto').attr(
                'src',
                localStorage.getItem('foto_perfil_url') || 'src/images/avatar-generico.svg'
            );
            msg('Foto de perfil', mensaje, 'error');
        }
    });
};

const cambiarClaveDispositivoApp = () => {
    var actual = $.trim($('#perfil_app_clave_actual').val());
    var nueva = $.trim($('#perfil_app_clave_nueva').val());
    var confirmacion = $.trim($('#perfil_app_clave_confirmacion').val());
    var uuid = typeof obtenerUuidDispositivo === 'function'
        ? obtenerUuidDispositivo()
        : (localStorage.getItem('uuid') || $('#uuid').val());

    if (!/^\d{4}$/.test(actual) || !/^\d{4}$/.test(nueva)) {
        msg('Clave del dispositivo', 'Las claves deben contener exactamente 4 dígitos.', 'error');
        return;
    }
    if (nueva !== confirmacion) {
        msg('Clave del dispositivo', 'La confirmación no coincide con la nueva clave.', 'error');
        return;
    }
    if (!uuid || uuid === '0') {
        msg('Clave del dispositivo', 'No fue posible identificar este dispositivo.', 'error');
        return;
    }

    var api = new Api('perfil', 'clave-dispositivo');
    api.request({
        uuid: uuid,
        clave_actual: actual,
        clave_nueva: nueva,
        clave_nueva_confirmation: confirmacion
    }, function(resp) {
        localStorage.setItem('password', nueva);
        $('#pass_device').val(nueva);
        if (typeof actualizarSecretoBiometricoApp === 'function') {
            actualizarSecretoBiometricoApp(nueva);
        }
        $('#perfil_app_clave_actual, #perfil_app_clave_nueva, #perfil_app_clave_confirmacion').val('');
        msg('Clave del dispositivo', resp.msj || 'Clave actualizada.', 'success');
    }, function(xhr) {
        var mensaje = xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : 'No fue posible cambiar la clave.';
        msg('Clave del dispositivo', mensaje, 'error');
    }, 'PUT');
};

const abrirVideollamadaApp = (url) => {
    if (!url) return;
    if (window.cordova && cordova.InAppBrowser) {
        cordova.InAppBrowser.open(url, '_blank', 'location=yes,mediaPlaybackRequiresUserAction=no');
    } else {
        window.open(url, '_blank');
    }
};

const fechaLocalAgendaProfesional = (fecha) => {
    var year = fecha.getFullYear();
    var month = String(fecha.getMonth() + 1).padStart(2, '0');
    var day = String(fecha.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
};

const irHoyAgendaProfesional = () => {
    $('#agenda_profesional_fecha').val(fechaLocalAgendaProfesional(new Date()));
    cargarAgendaProfesional();
};

const cambiarDiaAgendaProfesional = (dias) => {
    var valor = $('#agenda_profesional_fecha').val() || fechaLocalAgendaProfesional(new Date());
    var fecha = new Date(valor + 'T12:00:00');
    fecha.setDate(fecha.getDate() + dias);
    $('#agenda_profesional_fecha').val(fechaLocalAgendaProfesional(fecha));
    cargarAgendaProfesional();
};

const cargarAgendaProfesional = (idLugar) => {
    if (!$('#agenda_profesional_fecha').val()) {
        $('#agenda_profesional_fecha').val(fechaLocalAgendaProfesional(new Date()));
    }

    var fechaSeleccionada = $('#agenda_profesional_fecha').val();
    var fechaLabel = new Date(fechaSeleccionada + 'T12:00:00');
    $('#agenda_profesional_dia_label').text(
        fechaLabel.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    );

    var api = new Api('profesional', 'agenda');
    api.request(
        {
            id_lugar_atencion: idLugar || $('#agenda_profesional_lugar').val() || '',
            fecha: fechaSeleccionada
        },
        function(resp) {
            var lugares = Array.isArray(resp.lugares) ? resp.lugares : [];
            var actual = String(idLugar || $('#agenda_profesional_lugar').val() || '');
            var opciones = '<option value="">Seleccione lugar de atención</option>';
            lugares.forEach(function(lugar) {
                opciones += '<option value="' + lugar.id + '">' +
                    escaparTextoConsentimiento(String(lugar.nombre || '').toUpperCase()) + '</option>';
            });
            $('#agenda_profesional_lugar').html(opciones).val(actual);

            var registros = (Array.isArray(resp.registros) ? resp.registros : [])
                .filter(function(hora) { return !esHoraAnulada(hora); });
            var html = registros.length ? '' : '<p class="text-center">No hay registro</p>';
            registros.forEach(function(hora) {
                var video = hora.es_telemedicina
                    ? (hora.puede_conectarse && hora.video_url
                        ? '<div class="btn-app7 mt10" onclick="abrirVideollamadaApp(\'' +
                            hora.video_url + '\')">Iniciar videollamada</div>'
                        : '<div class="btn-app8 mt10">Telemedicina: ' +
                            escaparTextoConsentimiento(hora.estado) + '</div>')
                    : '';
                html += '<div class="card-button-dos agenda-profesional-cita mb20">' +
                    '<p class="agenda-profesional-paciente">' + escaparTextoConsentimiento(nombrePropio(hora.paciente)) + '</p>' +
                    '<div class="agenda-profesional-detalle">' +
                    '<p><b>Fecha</b><span>' + escaparTextoConsentimiento(fechaEsp(hora.fecha)) + '</span></p>' +
                    '<p><b>Horario</b><span>' + escaparTextoConsentimiento(hora.hora_inicio) +
                        ' - ' + escaparTextoConsentimiento(hora.hora_termino) + '</span></p>' +
                    '<p><b>Lugar</b><span class="text-uppercase">' + escaparTextoConsentimiento(hora.lugar) + '</span></p>' +
                    '<p><b>Estado</b><span>' + escaparTextoConsentimiento(hora.estado) + '</span></p>' +
                    '</div>' +
                    video + '</div>';
            });
            $('#lista-agenda-profesional').html(html);
        },
        function() {
            $('#lista-agenda-profesional').html('<p>No fue posible cargar la agenda.</p>');
        },
        'GET'
    );
};

var paginaMisPacientesProfesional = 1;

const abrirMisPacientesProfesional = () => {
    paginaMisPacientesProfesional = 1;
    $('#mis_pacientes_buscar').val('');
    vista('mis-pacientes-profesional');
    cargarMisPacientesProfesional(1);
};

const cargarMisPacientesProfesional = (pagina) => {
    paginaMisPacientesProfesional = pagina || 1;
    $('#lista-mis-pacientes-profesional').html('<div class="mis-pacientes-vacio">Cargando tutores y mascotas...</div>');

    var api = new Api('profesional', 'mis_pacientes');
    api.request(
        {
            buscar: ($('#mis_pacientes_buscar').val() || '').trim(),
            pagina: paginaMisPacientesProfesional,
            por_pagina: 20
        },
        function(resp) {
            var registros = Array.isArray(resp.registros) ? resp.registros : [];
            var paginacion = resp.paginacion || {};
            var html = '';

            registros.forEach(function(paciente) {
                var nombre = escaparTextoConsentimiento(paciente.nombre || 'Tutor');
                var iniciales = (paciente.nombre || 'P').split(/\s+/).slice(0, 2).map(function(parte) {
                    return parte.charAt(0).toUpperCase();
                }).join('');
                var contacto = paciente.telefono || paciente.email || 'Sin datos de contacto';
                var ultima = paciente.ultima_atencion ? fechaEsp(String(paciente.ultima_atencion).substring(0, 10)) : 'Sin fecha';

                html += '<article class="mis-paciente-card">' +
                    '<div class="mis-paciente-avatar">' + escaparTextoConsentimiento(iniciales) + '</div>' +
                    '<div class="mis-paciente-datos"><h3>' + nombre + '</h3>' +
                    '<p><b>RUT:</b> ' + escaparTextoConsentimiento(paciente.rut || 'No registrado') + '</p>' +
                    '<p><b>Contacto:</b> ' + escaparTextoConsentimiento(contacto) + '</p>' +
                    '<p><b>Última atención:</b> ' + escaparTextoConsentimiento(ultima) + '</p>' +
                    '<span>' + Number(paciente.total_atenciones || 0) + ' atención(es)</span></div></article>';
            });

            $('#lista-mis-pacientes-profesional').html(
                html || '<div class="mis-pacientes-vacio">No hay registro</div>'
            );
            $('#mis_pacientes_resumen').text((paginacion.total || 0) + ' registro(s)');

            var actual = Number(paginacion.pagina_actual || 1);
            var ultima = Number(paginacion.ultima_pagina || 1);
            $('#mis_pacientes_paginacion').html(
                '<button type="button" data-role="none" ' + (actual <= 1 ? 'disabled' : '') +
                ' onclick="cargarMisPacientesProfesional(' + (actual - 1) + ')">Anterior</button>' +
                '<span>Página ' + actual + ' de ' + ultima + '</span>' +
                '<button type="button" data-role="none" ' + (actual >= ultima ? 'disabled' : '') +
                ' onclick="cargarMisPacientesProfesional(' + (actual + 1) + ')">Siguiente</button>'
            );
        },
        function() {
            $('#lista-mis-pacientes-profesional').html('<div class="mis-pacientes-vacio mis-pacientes-error">No fue posible cargar los tutores y mascotas.</div>');
            $('#mis_pacientes_paginacion').empty();
        },
        'GET'
    );
};

$(document).on('keyup', '#mis_pacientes_buscar', function(event) {
    if (event.key === 'Enter') cargarMisPacientesProfesional(1);
});

const configurarFooterAutorizaciones = () => {
    const esProfesional = localStorage.getItem('rolActivo') === 'Profesional';
    const $pagina = $('#autorizaciones_sdi');

    $pagina.find('.autorizaciones-footer-citas').toggle(!esProfesional);
    $pagina.find('.autorizaciones-footer-principal')
        .toggleClass('col-xs-6', esProfesional)
        .toggleClass('col-xs-4', !esProfesional);
};

// O si usas el evento show de jQuery Mobile
$(document).on('pageshow', '#med_no_insc', function() {
    aplicarFormatoRut();
    limpiarFormularioAtencion();
});

//$(document).on('pageshow', '#buscador_profesional', function() {
  //  limpiarFormularioBusquedaMedico();
//});

var checkDeviceEnCurso = false;
var checkDeviceUltimaVerificacion = 0;
// Una verificación válida del dispositivo se reutiliza durante 5 minutos.
var checkDeviceCacheMs = 5 * 60 * 1000;
// Si varias vistas piden verificación mientras una petición está en curso,
// sus callbacks quedan esperando la misma respuesta en vez de lanzar otra petición.
var checkDeviceCallbacksPendientes = [];

const resolverCallbacksCheckDevice = (resultado) => {
    var callbacks = checkDeviceCallbacksPendientes.slice();
    checkDeviceCallbacksPendientes = [];

    callbacks.forEach(function(callback) {
        try {
            callback(resultado);
        } catch (error) {
            console.error('[MED-SDI] Error ejecutando callback de checkDevice:', error);
        }
    });
};

const checkDevice = (onReady, silencioso) => {

    var ahora = Date.now();

    // Reutilizar una verificación reciente.
    if (
        checkDeviceUltimaVerificacion &&
        (ahora - checkDeviceUltimaVerificacion) < checkDeviceCacheMs
    ) {
        if (typeof onReady === 'function') {
            onReady(true);
        }
        return;
    }

    // Si ya hay una verificación en curso, la siguiente vista espera
    // el mismo resultado. Así evitamos peticiones duplicadas y pantallas pegadas.
    if (checkDeviceEnCurso) {
        if (typeof onReady === 'function') {
            checkDeviceCallbacksPendientes.push(onReady);
        }

        console.log('[MED-SDI] checkDevice ya está en ejecución; reutilizando la petición actual.');
        return;
    }

    var datos = {};

    datos.uuid = typeof obtenerUuidDispositivo === 'function'
        ? obtenerUuidDispositivo()
        : (localStorage.getItem('uuid') || $('#uuid').val());

    if (!datos.uuid || datos.uuid === '0') {
        if (typeof onReady === 'function') {
            onReady(false);
        }

        if (!silencioso) {
            msg('Check Device', 'No fue posible identificar este dispositivo.', 'error');
        }

        return;
    }

    if (typeof onReady === 'function') {
        checkDeviceCallbacksPendientes.push(onReady);
    }

    checkDeviceEnCurso = true;

    if (!silencioso) {
        cargando(1);
    }

    console.log('[MED-SDI] Verificando dispositivo:', datos.uuid);

    var api = new Api('mobile-authorization', 'device');

    api.request(
        datos,
        function (resp) {
            checkDeviceEnCurso = false;

            if (!silencioso) {
                cargando(0);
            }

            console.log('[MED-SDI] checkDevice respuesta:', resp);

            if (resp.estado == 0) {
                resolverCallbacksCheckDevice(false);

                // Cuando la llamada original no esperaba callback, mantenemos
                // el flujo legacy para registrar el equipo.
                if (typeof onReady !== 'function') {
                    registrarPasswordShow();
                }

                return;
            }

            if (!resp.registros || !resp.registros.length) {
                console.error('[MED-SDI] Respuesta checkDevice sin registros.', resp);
                resolverCallbacksCheckDevice(false);
                return;
            }

            if (resp.registros[0].estado == 0) {
                resolverCallbacksCheckDevice(false);

                if (typeof onReady !== 'function') {
                    vista('login', 'fade');
                    $('#modalRegistroDevice').modal('show');
                }

                return;
            }

            if (resp.password) {
                setSession('password', resp.password);
                $('#pass_device').val(resp.password);
            }

            if (resp.registros[0].emergency_token) {
                localStorage.setItem(
                    'emergencyToken',
                    resp.registros[0].emergency_token
                );
            }

            // Solo las verificaciones exitosas quedan cacheadas.
            checkDeviceUltimaVerificacion = Date.now();
            resolverCallbacksCheckDevice(true);

            /*
             * IMPORTANTE:
             * checkDevice ya no carga recetas/documentos ni otras vistas.
             * Cada módulo obtiene sus datos únicamente cuando el usuario entra
             * realmente en esa pantalla.
             */
        },
        function (xhr, status, error) {
            checkDeviceEnCurso = false;

            if (!silencioso) {
                cargando(0);
            }

            console.error('[MED-SDI] CHECK DEVICE ERROR', {
                status: xhr ? xhr.status : null,
                responseText: xhr ? xhr.responseText : null,
                responseJSON: xhr ? xhr.responseJSON : null,
                ajaxStatus: status,
                error: error,
                uuid: datos.uuid,
                api: typeof MEDSDI_API_URL !== 'undefined' ? MEDSDI_API_URL : ''
            });

            resolverCallbacksCheckDevice(false);

            if (xhr && xhr.status === 429) {
                // Pequeño enfriamiento para no insistir inmediatamente.
                checkDeviceUltimaVerificacion = Date.now();

                if (!silencioso) {
                    msg(
                        'Check Device',
                        'Se realizaron demasiadas verificaciones. Intenta nuevamente en unos minutos.',
                        'warning'
                    );
                }
                return;
            }

            var mensaje = 'Error de verificación';

            if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
                mensaje = xhr.responseJSON.message;
            } else if (xhr && xhr.status) {
                mensaje += ' (HTTP ' + xhr.status + ')';
            } else {
                mensaje += ' (sin respuesta del servidor)';
            }

            if (!silencioso) {
                msg('Check Device', mensaje, 'error');
            }
        },
        'GET'
    );
}

const registrarPasswordShow = () => {
    vista('clave_desbloqueo','fade');
}

/*
const registrarPasswordShow = () => {
    navigator.notification.prompt(
        'Debe Ingresar un clave, para registrar el equipo',  // message
        registrarPassword,                  // callback to invoke
        'Clave',            // title
        ['Ingresar','Cerrar'],             // buttonLabels
        ''                 // defaultText
    );
    
}
*/


const registrarPassword = () => {

    var pass = $.trim($('#password_desbloqueo').val());

    if(/^\d{4}$/.test(pass))
    {
        $('#pass_device').val(pass);
        registerDeviceShow();
    }else{
        msg('Clave de desbloqueo', 'La clave debe tener exactamente 4 dígitos numéricos.', 'warning');
        $('#password_desbloqueo').focus().select();
    }

}

$(document).on('input', '#password_desbloqueo', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
});

$(document).on('keydown', '#password_desbloqueo', function(ev) {
    if (ev.key === 'Enter') registrarPassword();
});

/*
const registrarPassword = (results) => {

    switch(results.buttonIndex)
    {
        case 1:
            var pass = $.trim(results.input1);
            if(pass.length>3)
            {
                $('#pass_device').val(pass);
                registerDeviceShow();   
            }else{                
                navigator.notification.alert('Debe ingresar un password mayor a 3 digitos', registrarPasswordShow, 'Aviso', 'Cerrar');
            }
        break;
        case 2:
                navigator.notification.alert('Debe ingresar un password mayor a 3 digitos', registrarPasswordShow, 'Aviso', 'Cerrar');
        break;       
    }

}
*/

const registerDeviceShow = () => {
    navigator.notification.confirm(
        'Quiere registrar el dispositivo', // message
         optionDevice,            // callback to invoke with index of button pressed
        'Registrar Dispositivo',           // title
        ['Registrar','Cancelar']     // buttonLabels
    );
}


function optionDevice(btnIndex) {
    //alert('You selected button ' + btnIndex);

    switch(btnIndex)
    {
        case 1:
            registerDevice();
        break;
        case 2:
            vista('login','fade');
        break;
    }
}

const registerDevice = () => {

    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    if(month<10)
    month = '0'+month;

    if(day<10)
    day = '0'+day;

    newdate = year + "/" + month + "/" + day;

    var datos = {};

    datos.id_user = _SESSION('id_usuario');
    datos.alias = $('#model_device').val();
    datos.uuid = typeof obtenerUuidDispositivo === 'function'
        ? obtenerUuidDispositivo()
        : ($('#uuid').val() || localStorage.getItem('uuid') || '');
    datos.password = $('#pass_device').val();
    datos.estado = 0;
    datos.fecha_ingreso = `${year}-${month}-${day} 00:00:00`;
    datos.fecha_termino = `${year+1}-${month}-${day} 00:00:00`;

    cargando(1); 

    // El alta se realiza con la sesión autenticada. El backend obtiene el
    // usuario desde el token y no confía en un id_user manipulable.
    var api = new Api("mobile-authorization", "device");
    api.request(
        datos,
        function (resp) {
            
            if (resp.estado == 1) {
                navigator.notification.alert(
                    'Dispositivo Registrado',  // message
                    ()=>{ 
                        if (resp.requiere_activacion) {
                            enviarCorreoValidarEquipo();
                        }
                        vista('login','fade');
                        $('#modalRegistroDevice').modal('show'); 
                    },         // callback
                    'Estado Dispositivo',            // title
                    'Cerrar'                  // buttonName
                );
                
            } else {                
                navigator.notification.confirm(
                    'Problemas al Registrar, Quiere volver a registrar el dispositivo', // message
                     optionDevice,            // callback to invoke with index of button pressed
                    'Registrar Dispositivo',           // title
                    ['Registrar','Cancelar']     // buttonLabels
                );
                
            }
            cargando(0); 

        },
        function (resp) { 
            cargando(0); 
            msg('Check Device', 'Error en el registro', 'error');

            navigator.notification.confirm(
                'Problemas al Registrar, Quiere volver a registrar el dispositivo', // message
                 optionDevice,            // callback to invoke with index of button pressed
                'Registrar Dispositivo',           // title
                ['Registrar','Cancelar']     // buttonLabels
            );
        },
        "POST");
}

const list_document_user = ()=>{
    list_recetas_paciente();
}

const escaparTextoConsentimiento = (valor) => {
    return $('<div>').text(valor == null ? '' : String(valor)).html();
};

const abrirDocumentoClinico = (url, tipo) => {
    if (!url) {
        return;
    }

    const esAndroid = (
        (typeof device !== 'undefined' && String(device.platform || '').toLowerCase() === 'android') ||
        /Android/i.test(navigator.userAgent || '')
    );

    /*
     * Android WebView / cordova-plugin-inappbrowser no ofrece un visor PDF
     * nativo fiable. Cuando el servidor devuelve un PDF, el WebView puede
     * quedar negro mientras intenta interpretarlo.
     *
     * En Android abrimos documentos clínicos en el visor del sistema
     * (Chrome/visor PDF instalado), que es mucho más rápido y estable.
     * En iOS/browser mantenemos el InAppBrowser habitual.
     */
    if (window.cordova && cordova.InAppBrowser) {
        if (esAndroid) {
            try {
                cordova.InAppBrowser.open(url, '_system', 'location=yes');
            } catch (error) {
                console.error('[MED-SDI] No fue posible abrir el documento con el visor del sistema:', error);
                cordova.InAppBrowser.open(url, '_blank', 'location=yes');
            }
            return;
        }

        cargando(1);

        const navegador = cordova.InAppBrowser.open(
            url,
            '_blank',
            'location=yes,hidden=yes,clearcache=no,clearsessioncache=no'
        );

        let cerrado = false;

        const terminarCarga = () => {
            if (cerrado) return;
            cargando(0);
            try {
                navegador.show();
            } catch (error) {
                console.log('[MED-SDI] Documento abierto.', error);
            }
        };

        navegador.addEventListener('loadstop', terminarCarga);
        navegador.addEventListener('loaderror', function(event) {
            if (cerrado) return;
            cargando(0);
            console.error('[MED-SDI] Error cargando documento clínico:', event);
            msg('Documento', 'No fue posible abrir el documento.', 'error');
        });
        navegador.addEventListener('exit', function() {
            cerrado = true;
            cargando(0);
        });

        // Seguridad: no dejar el loader bloqueado si WebView no emite loadstop.
        setTimeout(function() {
            if (!cerrado) {
                terminarCarga();
            }
        }, 8000);

        return;
    }

    window.open(url, '_blank');
};

// Compatibilidad con recetas, consentimientos y llamadas existentes.
const abrirConsentimiento = (url) => {
    abrirDocumentoClinico(url, 'documento');
};

// Tarjeta común de Mis exámenes, Mis recetas y Mis consentimientos.
// Todos los textos de "o" deben venir ya escapados.
const tarjetaDocumentoClinico = (o) =>
    '<article class="examen-card">' +
        '<div class="examen-card-cabecera">' +
            '<h3 class="examen-card-nombre">' + o.titulo + '</h3>' +
            (o.estado ? '<span class="examen-estado ' + (o.estadoClase || 'examen-estado-pendiente') + '">' + o.estado + '</span>' : '') +
        '</div>' +
        '<dl class="examen-card-datos">' +
            (o.datos || []).map(function(d) {
                return '<div><dt>' + d[0] + '</dt><dd>' + (d[1] || '—') + '</dd></div>';
            }).join('') +
        '</dl>' +
        (o.boton ? '<div class="examen-card-acciones">' + o.boton + '</div>' : '') +
    '</article>';

// Color de la etiqueta según el texto del estado.
const claseEstadoDocumento = (estado) => {
    var t = String(estado || '').toLowerCase();
    if (/(disponible|firmado|aceptado|autorizado|aprobado|vigente)/.test(t)) return 'examen-estado-ok';
    if (/(rechaz|revoc|cancel|anulad)/.test(t)) return 'examen-estado-rechazado';
    if (t.indexOf('revisado') !== -1) return 'examen-estado-revisado';
    return 'examen-estado-pendiente';
};

const mensajeDocumentoClinico = (texto) =>
    '<p class="examen-vacio">' + escaparTextoConsentimiento(texto) + '</p>';

const list_consentimientos = () => {
    var $contenedor = $('#list_consentimientos');
    $contenedor.html('<p class="text-center color-azul">Cargando consentimientos...</p>');
    cargando(1);

    var api = new Api('paciente', 'mis_consentimientos');
    api.request(
        {},
        function(resp) {
            var registros = Array.isArray(resp.registros) ? resp.registros : [];

            if (resp.estado != 1 || registros.length === 0) {
                $contenedor.html(mensajeDocumentoClinico('No hay registro'));
                cargando(0);
                return;
            }

            var html = '';
            registros.forEach(function(registro) {
                var tipo = escaparTextoConsentimiento(registro.tipo || 'Consentimiento informado');
                var profesional = escaparTextoConsentimiento(registro.profesional || 'No informado');
                var estado = escaparTextoConsentimiento(registro.estado_consentimiento || 'Pendiente');
                var fecha = registro.fecha_emision
                    ? escaparTextoConsentimiento(fechaEsp(registro.fecha_emision))
                    : 'Sin fecha';
                var pdfUrl = escaparTextoConsentimiento(registro.pdf_url || '');

                html += tarjetaDocumentoClinico({
                    titulo: tipo,
                    estado: estado,
                    estadoClase: claseEstadoDocumento(registro.estado_consentimiento),
                    datos: [['Fecha emisión', fecha], ['Profesional', profesional]],
                    boton: pdfUrl
                        ? '<button type="button" data-role="none" class="examen-btn js-ver-consentimiento" ' +
                            'data-consentimiento-url="' + pdfUrl + '">Ver consentimiento</button>'
                        : ''
                });
            });

            $contenedor.html(html);
            cargando(0);
        },
        function(xhr) {
            var mensaje = xhr && xhr.status === 401
                ? 'Tu sesión expiró. Ingresa nuevamente.'
                : 'No fue posible cargar tus consentimientos.';

            $contenedor.html(mensajeDocumentoClinico(mensaje));
            cargando(0);
        },
        'GET'
    );
};

const list_recetas_paciente = () => {
    var $contenedor = $('#list_recetas');
    $contenedor.html('<p class="text-center color-azul">Cargando recetas...</p>');
    cargando(1);

    var api = new Api('paciente', 'mis_recetas');
    api.request(
        {},
        function(resp) {
            var registros = Array.isArray(resp.registros) ? resp.registros : [];

            if (resp.estado != 1 || registros.length === 0) {
                $contenedor.html(mensajeDocumentoClinico('No hay registro'));
                cargando(0);
                return;
            }

            var html = '';
            registros.forEach(function(receta) {
                var fecha = receta.fecha_emision
                    ? escaparTextoConsentimiento(fechaEsp(receta.fecha_emision))
                    : 'Sin fecha';
                var tipo = escaparTextoConsentimiento(receta.tipo || 'Receta médica');
                var diagnostico = escaparTextoConsentimiento(
                    receta.diagnostico || 'No informado'
                );
                var profesional = escaparTextoConsentimiento(
                    receta.profesional || 'No informado'
                );
                var cantidad = Number(receta.cantidad_medicamentos || 0);
                var pdfUrl = escaparTextoConsentimiento(receta.pdf_url || '');

                html += tarjetaDocumentoClinico({
                    titulo: tipo,
                    estado: cantidad + (cantidad === 1 ? ' medicamento' : ' medicamentos'),
                    estadoClase: 'examen-estado-revisado',
                    datos: [['Fecha emisión', fecha], ['Diagnóstico', diagnostico], ['Profesional', profesional]],
                    boton: pdfUrl
                        ? '<button type="button" data-role="none" class="examen-btn js-ver-receta" ' +
                            'data-receta-url="' + pdfUrl + '">Ver receta</button>'
                        : ''
                });
            });

            $contenedor.html(html);
            cargando(0);
        },
        function(xhr) {
            var mensaje = xhr && xhr.status === 401
                ? 'Tu sesión expiró. Ingresa nuevamente.'
                : 'No fue posible cargar tus recetas.';

            $contenedor.html(mensajeDocumentoClinico(mensaje));
            cargando(0);
        },
        'GET'
    );
};

const list_examenes_paciente = () => {
    var $contenedor = $('#list_examenes');
    $contenedor.html('<p class="text-center color-azul">Cargando exámenes...</p>');
    cargando(1);

    var api = new Api('paciente', 'mis_examenes');
    api.request(
        {},
        function(resp) {
            var registros = Array.isArray(resp.registros) ? resp.registros : [];

            if (resp.estado != 1 || registros.length === 0) {
                $contenedor.html(
                    '<p class="examen-vacio">No hay registro</p>'
                );
                cargando(0);
                return;
            }

            var html = '';
            registros.forEach(function(examen) {
                var fecha = examen.fecha
                    ? escaparTextoConsentimiento(fechaHoraEsp(examen.fecha))
                    : 'Sin fecha';
                var nombre = escaparTextoConsentimiento(
                    examen.nombre || 'Examen sin nombre'
                );
                var profesional = escaparTextoConsentimiento(
                    examen.profesional || 'No informado'
                );
                var estado = escaparTextoConsentimiento(
                    examen.estado_examen || 'Orden emitida'
                );
                var numeroOrden = escaparTextoConsentimiento(
                    examen.numero_orden || ''
                );
                var archivos = Array.isArray(examen.archivos)
                    ? examen.archivos
                    : [];
                var botones = '';

                archivos.forEach(function(archivo) {
                    var url = escaparTextoConsentimiento(archivo.url || '');
                    var etiqueta = examen.tipo_registro === 'resultado'
                        ? 'Ver resultado'
                        : 'Ver orden';

                    if (url) {
                        botones +=
                            '<button type="button" data-role="none" class="examen-btn js-ver-examen" ' +
                                'data-examen-url="' + url + '">' +
                                escaparTextoConsentimiento(etiqueta) +
                            '</button>';
                    }
                });

                // Color del estado: disponible (verde agua), revisado (gris azulado), resto (pendiente, ámbar).
                var estadoTexto = String(examen.estado_examen || '').toLowerCase();
                var estadoClase = estadoTexto.indexOf('disponible') !== -1
                    ? 'examen-estado-ok'
                    : (estadoTexto.indexOf('revisado') !== -1 ? 'examen-estado-revisado' : 'examen-estado-pendiente');

                html +=
                    '<article class="examen-card">' +
                        '<div class="examen-card-cabecera">' +
                            '<h3 class="examen-card-nombre">' + nombre + '</h3>' +
                            '<span class="examen-estado ' + estadoClase + '">' + estado + '</span>' +
                        '</div>' +
                        '<dl class="examen-card-datos">' +
                            '<div><dt>Fecha</dt><dd>' + fecha + '</dd></div>' +
                            '<div><dt>Nº registro</dt><dd>' + (numeroOrden || '—') + '</dd></div>' +
                            '<div><dt>Profesional</dt><dd>' + profesional + '</dd></div>' +
                        '</dl>' +
                        (botones ? '<div class="examen-card-acciones">' + botones + '</div>' : '') +
                    '</article>';
            });

            $contenedor.html(html);
            cargando(0);
        },
        function(xhr) {
            var mensaje = xhr && xhr.status === 401
                ? 'Tu sesión expiró. Ingresa nuevamente.'
                : 'No fue posible cargar tus exámenes.';

            $contenedor.html(mensajeDocumentoClinico(mensaje));
            cargando(0);
        },
        'GET'
    );
};

// Texto único para cualquier dato vacío de la Ficha Médica Única.
const FMU_SIN_REGISTRO = 'Sin Registro';
const FMU_SIN_REGISTRO_HTML = '<li class="fmu-sin-registro">' + FMU_SIN_REGISTRO + '</li>';

const limpiarFmuAntesDeCargar = () => {
    const $paginaFmu = $('#fmu_paciente');
    const $tarjetas = $paginaFmu.find('.cards-grid .card-button');

    $paginaFmu.find('.cards-grid').addClass('fmu-datos-pendientes');

    // Nunca dejamos visibles datos del paciente anterior ni datos demo.
    $tarjetas.removeClass('fmu-card-sin-datos');
    $tarjetas.eq(0).find('h2').text('').removeClass('fmu-valor-vacio');
    $tarjetas.find('.card-list').empty();

    // Contacto de emergencia.
    $paginaFmu.find('.ui-content > .row.mb90 .card-button .fecha-small').text('');

    // Odontograma e historial.
    $('#odontograma_fmu_superior, #odontograma_fmu_inferior, #odontograma_fmu_historial').empty();
    $('#odontograma_fmu_historial').hide();
};

const solicitarFmu = (forzar) => {
    limpiarFmuAntesDeCargar();

    // La FMU abierta por el propio paciente se obtiene directamente con el
    // token de sesión. No debe crear ni esperar una autorización de Medichile.
    // El backend obtiene el usuario desde X-Auth-Token, por lo que no enviamos
    // IDs ni tokens ficticios en la URL.
    var datos = {};
    if (forzar && typeof medsdiClearGetCache === 'function') {
        medsdiClearGetCache();
    }

    var api = new Api("paciente", "mi_ficha_medica");
    api.request(
        datos,
        function (resp) {
            try {
                LOG('fmu_user estado:' + resp.estado);
                console.log(resp);

                if (resp && Number(resp.estado) === 1) {
                    actualizarTarjetasFMU(resp);
                } else {
                    mostrarSinDatos();
                    msg('Formulario FMU', (resp && resp.mensaje) || 'No hay datos de ficha disponibles.', 'warning');
                }
            } catch (error) {
                console.error('[MED-SDI] Error mostrando la FMU:', error, resp);
                mostrarSinDatos();
                msg('Formulario FMU', 'No fue posible mostrar los datos recibidos.', 'error');
            } finally {
                $('#fmu_paciente .cards-grid').removeClass('fmu-datos-pendientes');
            }
        },
        function (xhr) {
            console.error('[MED-SDI] Error cargando la FMU:', xhr);
            mostrarSinDatos();
            $('#fmu_paciente .cards-grid').removeClass('fmu-datos-pendientes');

            var mensaje = xhr && xhr.status === 401
                ? 'Tu sesión expiró. Ingresa nuevamente.'
                : (xhr && xhr.status === 0
                    ? 'La consulta tardó demasiado. Revisa tu conexión e intenta nuevamente.'
                    : 'Error al cargar datos de FMU.');
            msg('Formulario FMU', mensaje, 'error');
        },
        "GET",
        false,
        45000
    );
}

const textoDatoProfesional = (valor) => {
    if (valor == null) return '';
    if (typeof valor === 'object') {
        return valor.nombre || valor.descripcion || valor.valor || '';
    }
    return String(valor);
};

// Primera letra en mayúscula sin alterar el resto (respeta siglas como "UCI").
const primeraMayuscula = (texto) => {
    const valor = String(texto || '').trim();
    return valor ? valor.charAt(0).toLocaleUpperCase('es') + valor.slice(1) : valor;
};

const solicitarMedicos = () => {
    var datos = {};
    datos.id_paciente = _SESSION('id_usuario');
    cargando(1);

    var api = new Api("paciente", "mis_profesionales");
    api.request(
        datos,
        function (resp) {
            LOG('medicos estado:'+resp.estado);
            console.log(resp);

            if (resp.estado == 1 && resp.medicos && resp.medicos.length > 0) {
                let htmlMedicos = '';
                resp.medicos.forEach(medico => {
                    let imagenMedico;
                    if(medico.foto_perfil && medico.foto_perfil !== '') {
                        imagenMedico = MEDSDI_WEB_URL + '/storage/'+medico.foto_perfil;
                    } else {
                        imagenMedico = medico.sexo === "M" ? 'src/images/ejemplo_dr.jpg' : 'src/images/ejemplo_dra.jpg';
                    }

                    const nombreCompleto = [
                        medico.nombre,
                        medico.apellido_uno,
                        medico.apellido_dos
                    ].filter(Boolean).join(' ').trim() || 'Profesional';
                    const nombreCompletoProp = nombrePropio(nombreCompleto);
                    const especialidadCompleta = [
                        textoDatoProfesional(medico.especialidad) || medico.nombre_especialidad,
                        textoDatoProfesional(medico.tipo_especialidad) || medico.nombre_tipo_especialidad,
                        textoDatoProfesional(medico.sub_tipo_especialidad) || medico.nombre_sub_tipo_especialidad
                    ].filter(Boolean).filter(function (valor, indice, lista) {
                        return lista.indexOf(valor) === indice;
                    }).join(' - ') || 'Especialidad no informada';
                    const lugarAtencion = medico.nombre_lugar_atencion
                        || medico.lugar_atencion
                        || medico.direccion
                        || 'Lugar de atención por confirmar';

                    // Escapar comillas para evitar errores de sintaxis
                    const nombreEscapado = nombreCompleto.replace(/'/g, "&apos;");
                    const especialidadEscapada = especialidadCompleta.replace(/'/g, "&apos;");
                    // En la card solo se ve la especialidad (la más específica), en un pill.
                    const especialidadPill = escaparTextoConsentimiento(nombrePropio(especialidadCompleta.split(' - ').pop()));

                    htmlMedicos += `
                        <div class="card-button-dos mb20">
                            <div class="row">
                                <div class="col-xs-3 text-center">
                                    <a href="javascript:void(0)" onclick="damePerfilMedico(${medico.id})"> <img class="img-circulo" width="70" src="${imagenMedico}" alt="Foto perfil"> </a>
                                </div>
                                <div class="col-xs-9">
                                    <p class="size16 color-azul mb5 text-uppercase">${escaparTextoConsentimiento(nombreCompletoProp)}</p>
                                    <p class="mb5"><span class="especialidad-pill">${especialidadPill}</span></p>
                                    <p class="letra-small mb5"><img class="mr10" width="15" src="src/images/ubicacion-morado.svg"><span class="text-uppercase">${lugarAtencion}</span></p>
                                    <button type="button" data-role="none" class="btn-agendar-hora" onclick="agendarHora(${medico.id}, '${nombreEscapado}', '${especialidadEscapada}')">Agendar hora</button>
                                </div>
                            </div>
                        </div>
                        `;
                    });

                $('#lista-medicos').html(htmlMedicos);
            } else {
                $('#lista-medicos').html(`
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12 text-center pt20 pb20">
                                <p class="size18 color-azul">No hay registro</p>
                            </div>
                        </div>
                    </div>
                `);
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando médicos:', resp);
            cargando(0);
            msg('Médicos', 'Error al cargar datos de médicos', 'error');

            $('#lista-medicos').html(`
                <div class="card-button-dos mb20">
                    <div class="row">
                        <div class="col-xs-12 text-center pt20 pb20">
                            <p class="size18 color-rojo">Error al cargar profesionales</p>
                            <div class="btn-app4 mt10" onclick="solicitarMedicos()">Reintentar</div>
                        </div>
                    </div>
                </div>
            `);
        },
        "GET");
}

const abrirMisProfesionales = () => {
    setSession('origen_seleccion_profesional', 'mis_medicos');
    vista('mis_medicos', 'fade');
    solicitarMedicos();
};

const volverDesdePerfilProfesional = () => {
    const origen = getSession('origen_seleccion_profesional') || 'mis_medicos';
    vista(origen === 'mis_medicos_buscados' ? 'mis_medicos_buscados' : 'mis_medicos', 'fade');
};

const damePerfilMedico = (idMedico) => {
    console.log('Ver perfil médico ID:', idMedico);

    var datos = {
        id_profesional: idMedico
    };

    cargando(1);

    var api = new Api("profesionales", "perfil_profesional");
    api.request(
        datos,
        function (resp) {
            LOG('perfil medico estado:' + resp.estado);
            console.log(resp);

            if (resp.estado == 1 && resp.profesional) {
                const prof = resp.profesional;

                // Determinar imagen del médico
                let imagenMedico;
                if(prof.foto_perfil && prof.foto_perfil !== '') {
                    imagenMedico = MEDSDI_WEB_URL + '/storage/' + prof.foto_perfil;
                } else {
                    imagenMedico = prof.sexo === "M" ? 'src/images/ejemplo_dr.jpg' : 'src/images/ejemplo_dra.jpg';
                }

                // Generar HTML de lugares de atención
                if(prof.lugares_atencion && prof.lugares_atencion.length > 0) {
                    let lugares = '';
                    prof.lugares_atencion.forEach(lugar => {
                        lugares += `<li>${lugar.nombre} - ${lugar.direccion}</li>`;
                    });
                    prof.lugares_atencion_html = `<ul>${lugares}</ul>`;
                } else {
                    prof.lugares_atencion_html = '<p>No hay registro</p>';
                }

                // Escapar datos antes de usarlos en HTML
                const nombreCompleto = nombrePropio(`${prof.nombre} ${prof.apellido_uno} ${prof.apellido_dos || ''}`.trim());
                const especialidadCompleta = `${prof.especialidad?.nombre || 'No especificada'} - ${prof.tipo_especialidad?.nombre || 'No especificado'}`;

                // Escapar comillas para prevenir XSS
                const nombreEscapado = nombreCompleto.replace(/'/g, "&apos;");
                const especialidadEscapada = especialidadCompleta.replace(/'/g, "&apos;");

                $('#perfil-medico-content').html(`
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12 text-center mb20">
                                <img class="img-circulo" width="100" src="${imagenMedico}" alt="Foto perfil">
                                <h3 class="color-azul mt10">${prof.nombre} ${prof.apellido_uno} ${prof.apellido_dos || ''}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12">
                                <p class="size16 color-azul mb10"><strong>Información Profesional</strong></p>
                                <p class="size14 mb5"><strong>Especialidad:</strong> ${prof.especialidad?.nombre || 'No especificada'}</p>
                                <p class="size14 mb5"><strong>Tipo:</strong> ${prof.tipo_especialidad?.nombre || 'No especificado'}</p>
                                <p class="size14 mb5"><strong>Sub-especialidad:</strong> ${prof.sub_tipo_especialidad?.nombre || 'No especificado'}</p>
                                ${prof.experiencia ? `<p class="size14 mb5"><strong>Experiencia:</strong> ${prof.experiencia}</p>` : ''}
                                ${prof.titulo ? `<p class="size14 mb5"><strong>Título:</strong> ${prof.titulo}</p>` : ''}
                                <p class="size14 mb5"><strong>Lugares de Atención:</strong></p>
                                <div class="size14 mb5">${prof.lugares_atencion_html}</div>
                            </div>
                        </div>
                    </div>
                    ${prof.biografia ? `
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12">
                                <p class="size16 color-azul mb10"><strong>Biografía</strong></p>
                                <p class="size14">${prof.biografia}</p>
                            </div>
                        </div>
                    </div>` : ''}
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12">
                                <button type="button" data-role="none" class="btn-agendar-hora" onclick="agendarHora(${prof.id},'${nombreEscapado}','${especialidadEscapada}')">Agendar hora</button>
                            </div>
                        </div>
                    </div>
                `);

                vista('perfil_medico', 'fade');
            } else {
                msg('Perfil Médico', 'No se pudo cargar la información del profesional', 'error');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando perfil médico:', resp);
            cargando(0);
            msg('Error', 'Error al cargar perfil del profesional', 'error');
        },
        "GET"
    );
}

const agendarHora = (idMedico, nombreMedico, especialidad) => {
    console.log('Agendar hora con médico ID:', idMedico);

    var datos = {
        id_profesional: idMedico
    };

    cargando(1);

    var api = new Api("profesionales", "mis_lugares_atencion");
    api.request(
        datos,
        function (resp) {
            LOG('lugares atencion estado:' + resp.estado);
            console.log(resp);

            if (resp.estado == 1 && resp.registros && resp.registros.length > 0) {
                // Guardar información del médico en sesión
                setSession('id_medico_seleccionado', idMedico);
                setSession('nombre_medico_seleccionado', nombreMedico);
                setSession('especialidad_medico_seleccionado', especialidad);

                // Actualizar el header con la información del médico y botón de retorno
                const origen = getSession('origen_seleccion_profesional') || 'mis_medicos';
                const vistaRetorno = origen === 'mis_medicos_buscados' ? 'mis_medicos_buscados' : 'mis_medicos';
                const textoRetorno = origen === 'mis_medicos_buscados'
                    ? 'Volver a resultados'
                    : 'Volver a mis profesionales';

                $('#lugares_atencion .top-titulos').html(`
                    ${htmlCardProfesionalAgenda(nombreMedico, especialidad)}
                    <div class="btn-app4 text-center size14 mb20" onclick="vista('${vistaRetorno}');">
                         ${textoRetorno}
                    </div>
                    <p class="size14 text-center mb10">Seleccione el lugar de atención</p>
                `);

                // Generar HTML de lugares de atención
                let htmlLugaresAtencion = '';
                resp.registros.forEach(lugar => {
                    htmlLugaresAtencion += `
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12 text-left mb20">
                                <div class="media">
                                    <img src="src/images/clinica.png" class="img-circulo text-center mr10" width="80" alt="Centro médico">
                                    <div class="media-body text-center">
                                        <p class="size14 color-azul text-uppercase">${lugar.nombre}</p>
                                        <p class="size13"><img class="mr10" width="20" src="src/images/ubicacion-morado.svg">  ${lugar.direccion} - ${lugar.ciudad}</p>

                                        <button type="button" data-role="none" class="btn-agendar-hora" onclick="seleccionarLugarAtencion(${lugar.id},${idMedico},'${lugar.nombre}')">Seleccionar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                });

                $('#lista-lugares').html(htmlLugaresAtencion);
                vista('lugares_atencion', 'fade');

            } else {
                msg('Agendar Hora', 'El profesional no tiene lugares de atención asignados.', 'warning');
            }

            cargando(0);
        },
        function (resp) {
            console.error('Error cargando lugares de atención:', resp);
            cargando(0);
            msg('Error', 'Error al cargar lugares de atención del profesional', 'error');
        },
        "GET"
    );
}

const actualizarTarjetasFMU = (fmu) => {
    const $paginaFmu = $('#fmu_paciente');
    const $tarjetas = $paginaFmu.find('.cards-grid .card-button');
    let antecedentes = Array.isArray(fmu.antecedentes) ? fmu.antecedentes : [];
    let alergias = [];
    let enfermedades = [];
    let medicamentos = [];
    let cirugias = [];
    const datoAntecedente = (antecedente, campo, valorPorDefecto) => {
        let datos = antecedente && antecedente.antecedente_data;

        if (typeof datos === 'string') {
            try {
                datos = JSON.parse(datos);
            } catch (error) {
                datos = {};
            }
        }

        datos = datos && typeof datos === 'object' ? datos : {};
        return datos[campo] || valorPorDefecto || '';
    };

    antecedentes.forEach(antecedente => {
        const tipoAntecedente = Number(antecedente.id_tipo_antecedente);
        if(tipoAntecedente === 6) { // Alergia
            alergias.push(antecedente);
        } else if (tipoAntecedente === 1) { // Patología crónica
            enfermedades.push(antecedente);
        }else if (tipoAntecedente === 3) { // Cirugía
            cirugias.push(antecedente);
        } else if (tipoAntecedente === 4) { // Medicamento Crónico
            medicamentos.push(antecedente);
        }
    });

    // Grupo Sanguíneo
    const grupoSanguineo = fmu.grupo_sanguineo && fmu.grupo_sanguineo.nombre_gs ? fmu.grupo_sanguineo.nombre_gs : '';
    $tarjetas.eq(0).find('h2').text(grupoSanguineo || FMU_SIN_REGISTRO).toggleClass('fmu-valor-vacio', !grupoSanguineo);

    let ultima_alergia = alergias.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    fmu.ultima_alergia = ultima_alergia || null;
    // Alergias
    if(fmu.ultima_alergia) {
        const fecha = fechaEsp(fmu.ultima_alergia.created_at);
        $tarjetas.eq(1).find('.card-list').html(
            `<li>${datoAntecedente(fmu.ultima_alergia, 'nombre', 'Alergia sin detalle')}<br><span class="fecha-small">${fecha}</span></li>`
        );
    } else {
        $tarjetas.eq(1).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    if(enfermedades.length > 0) {
        let htmlEnfermedades = '';
        enfermedades.forEach(enfermedad => {
            htmlEnfermedades += `<li>${datoAntecedente(enfermedad, 'nombre', 'Sin detalle')}</li>`;
        });
        $tarjetas.eq(2).find('.card-list').html(htmlEnfermedades);
    } else {
        $tarjetas.eq(2).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    // Medicamentos Crónicos
    if (fmu.medicamentos_cronicos && fmu.medicamentos_cronicos.length > 0) {
        let htmlMedicamentosCronicos = '';
        fmu.medicamentos_cronicos.forEach(medicamento => {
            htmlMedicamentosCronicos += `<li>${medicamento.nombre}</li>`;
        });
        $tarjetas.eq(3).find('.card-list').html(htmlMedicamentosCronicos);
    } else {
        $tarjetas.eq(3).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    // Últimos Medicamentos
    if (fmu.ultimos_medicamentos && fmu.ultimos_medicamentos.length > 0) {
        let htmlUltimosMeds = '';
        fmu.ultimos_medicamentos.forEach(medicamento => {
            const fecha = fechaEsp(medicamento.fecha);
            htmlUltimosMeds += `<li>${medicamento.nombre}<br><span class="fecha-small">${fecha}</span></li>`;
        });
        $tarjetas.eq(4).find('.card-list').html(htmlUltimosMeds);
    } else {
        $tarjetas.eq(4).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    // Último Diagnóstico
    if (fmu.fichas && fmu.fichas.length > 0) {
        // Ordenar por fecha descendente y tomar el primero
        const ultimaFicha = fmu.fichas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const fecha = fechaEsp(ultimaFicha.created_at);
        const diagnostico = `<li>${ultimaFicha.hipotesis_diagnostico}<br><span class="fecha-small">${fecha}</span></li>`;
        $tarjetas.eq(5).find('.card-list').html(diagnostico);
    } else {
        $tarjetas.eq(5).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    let ultima_cirugia = cirugias.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    fmu.ultima_cirugia = ultima_cirugia || null;

    // Última Cirugía
    if (fmu.ultima_cirugia) {
        const fecha = fechaEsp(fmu.ultima_cirugia.created_at);
        $tarjetas.eq(6).find('.card-list').html(
            `<li>${datoAntecedente(fmu.ultima_cirugia, 'procedimiento', 'Cirugía sin detalle')} - ${fmu.ultima_cirugia.comentario || ''}<br><span class="fecha-small">${fecha}</span></li><br><span class="letra-small">${datoAntecedente(fmu.ultima_cirugia, 'profesional', '')}</span>`
        );
    } else {
        $tarjetas.eq(6).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    // Prótesis y Ortesis
    if (fmu.protesis_ortesis && fmu.protesis_ortesis.length > 0) {
        let htmlProtesis = '';
        fmu.protesis_ortesis.forEach(item => {
            htmlProtesis += `<li>${item.nombre}</li>`;
        });
        $tarjetas.eq(7).find('.card-list').html(htmlProtesis);
    } else {
        $tarjetas.eq(7).find('.card-list').html(FMU_SIN_REGISTRO_HTML);
    }

    // Contacto de Emergencia
    const $contacto = $paginaFmu.find('.ui-content > .row.mb90 .card-button');
    if (fmu.contacto_emergencia) {
        $contacto.find('.col-xs-4').eq(0).find('.fecha-small').text(fmu.contacto_emergencia.nombre || 'No registrado');
        $contacto.find('.col-xs-4').eq(1).find('.fecha-small').text(fmu.contacto_emergencia.parentezco || 'No registrado');
        $contacto.find('.col-xs-4').eq(2).find('.fecha-small').text(fmu.contacto_emergencia.telefono || 'No registrado');
    } else {
        $contacto.find('.fecha-small').text('');
    }

    renderizarOdontogramaFMU(fmu.odontograma || []);
}

let odontogramaFmuActual = {};

const piezasOdontogramaSuperior = ['1.8','1.7','1.6','1.5','1.4','1.3','1.2','1.1','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8'];
const piezasOdontogramaInferior = ['4.8','4.7','4.6','4.5','4.4','4.3','4.2','4.1','3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8'];

const estadoPiezaOdontograma = (historial) => {
    let estado = 'normal';
    historial.forEach(function(registro) {
        const diagnostico = String(registro.diagnostico || '').toLowerCase();
        const tratamiento = String(registro.tratamiento || '').toLowerCase();
        if (diagnostico.indexOf('carie') !== -1) estado = 'carie';
        if (tratamiento.indexOf('implante') !== -1) {
            estado = String(registro.estado) === '0' ? 'ausente' : 'implante';
        }
        if (tratamiento.indexOf('endodoncia') !== -1 || tratamiento.indexOf('pulpotomia') !== -1 || tratamiento.indexOf('pulpectomia') !== -1) {
            estado = 'endodoncia';
        }
    });
    return estado;
};

const renderizarFilaOdontogramaFMU = (piezas) => piezas.map(function(pieza) {
    const historial = odontogramaFmuActual[pieza] || [];
    const estado = estadoPiezaOdontograma(historial);
    const codigoImagen = pieza.replace('.', '');
    let carpeta = '';
    let prefijo = 'd';
    if (estado === 'carie') { carpeta = 'carie/'; prefijo = 'carie'; }
    if (estado === 'endodoncia') { carpeta = 'endodoncia/'; prefijo = 'endo'; }
    if (estado === 'implante') { carpeta = 'implante/'; prefijo = 'impl'; }
    if (estado === 'ausente') { carpeta = 'diente-ausente/'; prefijo = 'dau'; }
    const imagen = MEDSDI_WEB_URL + '/images/dental/dientes/' + carpeta + prefijo + codigoImagen + '.png';
    const indicador = historial.length ? '<span class="odontograma-pieza-cantidad">' + historial.length + '</span>' : '';
    return '<button type="button" class="odontograma-pieza estado-' + estado + '" onclick="mostrarHistorialDental(\'' + pieza + '\')">' +
        indicador + '<img src="' + imagen + '" alt="Pieza ' + pieza + '" onerror="this.style.visibility=\'hidden\'">' +
        '<strong>' + pieza + '</strong></button>';
}).join('');

const renderizarOdontogramaFMU = (registros) => {
    odontogramaFmuActual = {};
    (Array.isArray(registros) ? registros : []).forEach(function(registro) {
        const pieza = String(registro.pieza || '').trim();
        if (!pieza) return;
        if (!odontogramaFmuActual[pieza]) odontogramaFmuActual[pieza] = [];
        odontogramaFmuActual[pieza].push(registro);
    });
    $('#odontograma_fmu_superior').html(renderizarFilaOdontogramaFMU(piezasOdontogramaSuperior));
    $('#odontograma_fmu_inferior').html(renderizarFilaOdontogramaFMU(piezasOdontogramaInferior));
    $('#odontograma_fmu_historial').hide().empty();
};

const mostrarHistorialDental = (pieza) => {
    const historial = (odontogramaFmuActual[pieza] || []).slice().sort(function(a, b) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    let contenido = '<div class="odontograma-historial-titulo"><strong>Pieza ' + pieza + '</strong><button type="button" onclick="cerrarHistorialDental()">×</button></div>';
    if (!historial.length) {
        contenido += '<p class="odontograma-sin-registros">No hay registro</p>';
    } else {
        historial.forEach(function(registro) {
            const fecha = registro.created_at ? fechaEsp(registro.created_at) : 'Fecha no informada';
            const diagnostico = escaparTextoConsentimiento(registro.diagnostico || 'Sin diagnóstico informado');
            const tratamiento = escaparTextoConsentimiento(registro.tratamiento || registro.descripcion || 'Sin tratamiento informado');
            contenido += '<div class="odontograma-historial-item"><span>' + escaparTextoConsentimiento(fecha) + '</span>' +
                '<b>' + diagnostico + '</b><p>' + tratamiento + '</p></div>';
        });
    }
    $('#odontograma_fmu_historial').html(contenido).slideDown(180);
};

const cerrarHistorialDental = () => $('#odontograma_fmu_historial').slideUp(150);
const alternarLeyendaOdontograma = () => $('#odontograma_fmu_leyenda').slideToggle(150);

const mostrarSinDatos = () => {
    // Mostrar mensajes por defecto cuando no hay datos
    const $paginaFmu = $('#fmu_paciente');
    $paginaFmu.find('.cards-grid .card-button').eq(0).find('h2').text(FMU_SIN_REGISTRO).addClass('fmu-valor-vacio');
    // Las tarjetas sin datos se siguen mostrando, con "Sin Registro".
    $paginaFmu.find('.cards-grid .card-button .card-list').html(FMU_SIN_REGISTRO_HTML);
    renderizarOdontogramaFMU([]);
}

var citasPacienteRegistros = [];
var citasPacienteFiltro = 'todas';

// Estados de una hora, con los mismos nombres y colores de la agenda de VeterChile
// (colores en estilos.css: #citas .cita-estado.<clave>).
// Solo se muestran estos 4 estados; "Por confirmar" = hora agendada/reservada (incluye pre reservada).
const ESTADOS_CITA = [
    { clave: 'reservada', filtro: 'reservadas', nombre: 'Por confirmar' },
    { clave: 'confirmada', filtro: 'confirmadas', nombre: 'Confirmada' },
    { clave: 'espera', filtro: 'espera', nombre: 'En espera' },
    { clave: 'realizando', filtro: 'realizando', nombre: 'Realizando' }
];
const FILTROS_CITAS = ['todas'].concat(ESTADOS_CITA.map(function(e) { return e.filtro; }));

// Clave del estado: 1 = reservada y 2 = confirmada (API actual); el resto se reconoce por el texto del estado.
const claveEstadoCita = (hora) => {
    if (esHoraAnulada(hora)) return 'otra';
    var id = Number(hora && hora.id_estado);
    if (id === 1) return 'reservada';
    if (id === 2) return 'confirmada';
    var t = String((hora && (hora.estado || hora.estado_agenda)) || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/pre.?reserv|agendad/.test(t)) return 'reservada';
    if (/espera/.test(t)) return 'espera';
    if (/realizando|en curso/.test(t)) return 'realizando';
    if (/realizada|finaliz|atendid/.test(t)) return 'realizada';
    if (/confirm/.test(t)) return 'confirmada';
    if (/reserv|por confirmar/.test(t)) return 'reservada';
    return 'otra';
};

const estadoCitaInfo = (hora) => {
    var clave = claveEstadoCita(hora);
    return ESTADOS_CITA.filter(function(e) { return e.clave === clave; })[0] || null;
};

const estadoFiltroCita = (hora) => {
    var info = estadoCitaInfo(hora);
    return info ? info.filtro : 'otras';
};

// Citas con uno de los 4 estados visibles (las realizadas, anuladas, etc. no se listan).
const citasPacienteVisibles = () => citasPacienteRegistros.filter(function(hora) { return !!estadoCitaInfo(hora); });

const actualizarContadoresCitas = () => {
    var visibles = citasPacienteVisibles();
    var contadores = { todas: visibles.length };
    FILTROS_CITAS.forEach(function(f) { if (f !== 'todas') contadores[f] = 0; });

    visibles.forEach(function(hora) {
        var grupo = estadoFiltroCita(hora);
        contadores[grupo] = (contadores[grupo] || 0) + 1;
    });

    FILTROS_CITAS.forEach(function(f) { $('#citas-contador-' + f).text(contadores[f]); });

    return contadores;
};

const cambiarFiltroCitas = (filtro) => {
    citasPacienteFiltro = FILTROS_CITAS.includes(filtro)
        ? filtro
        : 'todas';

    $('#citas .citas-filtro')
        .removeClass('active')
        .attr('aria-selected', 'false');

    $('#citas .citas-filtro[data-filtro="' + citasPacienteFiltro + '"]')
        .addClass('active')
        .attr('aria-selected', 'true');

    $('#citas_btn_filtro').toggleClass('con-filtro', citasPacienteFiltro !== 'todas');
    cerrarFiltroCitas();

    renderizarCitasPaciente();
};

// Botón de filtro + hoja inferior (Mis citas agendadas). Al entrar a la vista siempre se muestran todas.
const abrirFiltroCitas = () => { $('#citas_filtro_sheet').addClass('sheet-abierta'); };
const cerrarFiltroCitas = () => { $('#citas_filtro_sheet').removeClass('sheet-abierta'); };
$(document).on('pagebeforeshow', '#citas', function() { cambiarFiltroCitas('todas'); });

const renderizarCitasPaciente = () => {
    var registros = citasPacienteVisibles().filter(function(hora) {
        return citasPacienteFiltro === 'todas' || estadoFiltroCita(hora) === citasPacienteFiltro;
    });

    // Vista minimalista: sin línea de resumen.
    $('#citas-filtro-resumen').text('');

    if (!registros.length) {
        $('#lista-horas').html(`
            <div class="citas-vacio">
                <strong>No hay registro</strong>
            </div>
        `);
        return;
    }

    let htmlHoras = '';

    registros.forEach(hora => {
        const fecha = fechaEsp(hora.fecha_consulta);
        const soloHoraMinutos = (valor) => {
            const coincide = String(valor || '').match(/(\d{1,2}):(\d{2})/);
            return coincide ? coincide[1].padStart(2, '0') + ':' + coincide[2] : '';
        };
        const horaInicio = soloHoraMinutos(hora.hora_inicio) || 'No especificada';
        const horaTermino = soloHoraMinutos(hora.hora_termino) || 'No especificada';
        const medico = hora ? nombrePropio(`${hora.nombre_profesional} ${hora.apellido_uno_profesional}`) : 'No asignado';
        const especialidad = hora && hora.nombre_especialidad ? hora.nombre_especialidad : 'No especificada';
        const tipo_especialidad = hora && hora.nombre_tipo_especialidad ? hora.nombre_tipo_especialidad : 'No especificada';
        const sub_tipo_especialidad = hora && hora.nombre_sub_tipo_especialidad ? hora.nombre_sub_tipo_especialidad : '';
        const estado = Number(hora.id_estado);
        const infoEstado = estadoCitaInfo(hora);
        const estadoHora = infoEstado ? infoEstado.nombre : (hora.estado || 'Rechazada');
        const estadoClase = infoEstado ? infoEstado.clave : 'otra';
        const direccionLugar = [hora.direccion_lugar_atencion, hora.numero_dir_lugar_atencion].filter(Boolean).join(' ');

        const botonesHtml = estado === 1 ? `
            <div class="cita-acciones">
                <button type="button" data-role="none" class="cita-btn confirmar"
                        onclick="confirmarHoraMedicaAgendada(${hora.id})">
                    <span>✓</span> Confirmar hora
                </button>
                <button type="button" data-role="none" class="cita-btn anular"
                        onclick="cancelarHoraMedica(${hora.id})">
                    <span>✕</span> Anular hora
                </button>
            </div>
        ` : '';

        const botonAnularHtml = estado === 2 ? `
            <div class="cita-acciones una">
                <button type="button" data-role="none" class="cita-btn anular"
                        onclick="cancelarHoraMedica(${hora.id})">
                    <span>✕</span> Anular hora
                </button>
            </div>
        ` : '';

        const botonVideoHtml = hora.es_telemedicina ? (
            hora.puede_conectarse && hora.video_url ? `
                <button type="button" data-role="none" class="cita-btn videollamada"
                        onclick="abrirVideollamadaApp('${hora.video_url}')">
                    Iniciar videollamada
                </button>
            ` : `
                <div class="cita-telemedicina-estado">Telemedicina: ${hora.estado || estadoHora}</div>
            `
        ) : '';

        let imagenMedico = '';
        if (hora.foto_perfil && hora.foto_perfil !== '') {
            imagenMedico = MEDSDI_WEB_URL + '/storage/' + hora.foto_perfil;
        } else {
            imagenMedico = hora.sexo === "M"
                ? 'src/images/ejemplo_dr.jpg'
                : 'src/images/ejemplo_dra.jpg';
        }

        const guardada = mascotaDeCita(hora.id) || {};
        const nombreMascota = hora.nombre_mascota || hora.mascota_nombre || (hora.mascota && hora.mascota.nombre) || guardada.nombre || '';
        const especieMascota = hora.especie_mascota || (hora.mascota && hora.mascota.especie) || guardada.especie || '';
        const razaMascota = hora.raza_mascota || (hora.mascota && hora.mascota.raza) || guardada.raza || '';
        const detalleMascota = [especieMascota, razaMascota].filter(Boolean).join(' · ');
        const mascotaHtml = nombreMascota ? `
                <div class="cita-mascota ancho">
                    <svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>
                    <span><b>Mascota:</b> ${escaparTextoConsentimiento(nombreMascota)}${detalleMascota ? ' · ' + escaparTextoConsentimiento(detalleMascota) : ''}</span>
                </div>` : '';

        htmlHoras += `
            <article class="cita-paciente-card">
                <div class="cita-paciente-header">
                    <img class="cita-paciente-avatar" src="${imagenMedico}" alt="Foto perfil">
                    <div>
                        <h3 class="text-uppercase">${escaparTextoConsentimiento(medico)}</h3>
                        <p>${escaparTextoConsentimiento(especialidad)}${tipo_especialidad ? ' · ' + escaparTextoConsentimiento(tipo_especialidad) : ''}</p>
                        ${sub_tipo_especialidad ? `<small>${escaparTextoConsentimiento(sub_tipo_especialidad)}</small>` : ''}
                    </div>
                    <span class="cita-estado ${estadoClase}">${escaparTextoConsentimiento(estadoHora)}</span>
                </div>

                <div class="cita-paciente-datos">
                    ${mascotaHtml}
                    <div><img src="src/images/calendario-morado.svg" alt=""><span>${fecha}</span></div>
                    <div><img src="src/images/hora-morado.svg" alt=""><span>${horaInicio} - ${horaTermino}</span></div>
                    <div class="ancho"><img src="src/images/ubicacion-morado.svg" alt=""><span class="cita-lugar"><span class="text-uppercase">${escaparTextoConsentimiento(hora.nombre_lugar_atencion || 'Sin lugar')}</span>${direccionLugar ? `<small>${escaparTextoConsentimiento(direccionLugar)}</small>` : ''}</span></div>
                </div>

                ${botonesHtml}
                ${botonAnularHtml}
                ${botonVideoHtml}
            </article>
        `;
    });

    $('#lista-horas').html(htmlHoras);
};

// Citas de ejemplo (solo con MODO_DEMO_MASCOTAS) para ver todos los estados de la agenda.
const citasDemo = () => {
    var fecha = function(dias) {
        var d = new Date();
        d.setDate(d.getDate() + dias);
        return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    };
    var base = { nombre_lugar_atencion: 'Clínica Veterinaria Huellitas', direccion_lugar_atencion: 'Av. Providencia', numero_dir_lugar_atencion: '1234', sexo: 'F' };
    var cita = function(id, idEstado, estado, dias, ini, fin, profesional, apellido, especialidad, sexo, mascota, especie, raza) {
        return Object.assign({}, base, {
            id: 'demo-' + id, id_estado: idEstado, estado: estado, fecha_consulta: fecha(dias),
            hora_inicio: ini, hora_termino: fin, nombre_profesional: profesional, apellido_uno_profesional: apellido,
            nombre_especialidad: especialidad, sexo: sexo, nombre_mascota: mascota, especie_mascota: especie, raza_mascota: raza
        });
    };
    return [
        cita(2, 1, 'Hora reservada', 6, '11:30', '12:00', 'Andrés', 'Soto', 'Dermatología', 'M', 'Max', 'Perro', 'Labrador'),
        cita(3, 2, 'Hora confirmada', 3, '16:00', '16:30', 'Valentina', 'Muñoz', 'Vacunación', 'F', 'Luna', 'Perro', 'Poodle'),
        cita(4, 0, 'En espera de atención', 0, '09:30', '10:00', 'Felipe', 'Araya', 'Cardiología', 'M', 'Rocky', 'Perro', 'Bulldog'),
        cita(5, 0, 'Realizando atención', 0, '09:00', '09:30', 'Daniela', 'Pérez', 'Medicina general', 'F', 'Michi', 'Gato', 'Siamés')
    ];
};

const solicitarMisHorasMedicas = (forzar) => {
    var datos = {};
    datos.id_paciente = _SESSION('id_usuario');

    cargando(1);

    var api = new Api("paciente", "agenda");
    api.request(
        datos,
        function (resp) {
            LOG('mis horas estado:' + resp.estado);

            citasPacienteRegistros = resp.estado == 1 && Array.isArray(resp.horas)
                ? resp.horas
                : [];
            // En modo demo se suman citas de ejemplo a las reales para ver todos los estados.
            if (MODO_DEMO_MASCOTAS) citasPacienteRegistros = citasPacienteRegistros.concat(citasDemo());

            actualizarContadoresCitas();
            renderizarCitasPaciente();
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando horas médicas:', resp);
            cargando(0);
            if (MODO_DEMO_MASCOTAS) {
                citasPacienteRegistros = citasDemo();
                actualizarContadoresCitas();
                renderizarCitasPaciente();
                return;
            }
            msg('Horas Médicas', 'Error al cargar horas médicas', 'error');
            $('#lista-horas').html(`
                <div class="citas-vacio error">
                    <strong>No fue posible cargar tus citas</strong>
                    <button type="button" data-role="none" onclick="solicitarMisHorasMedicas(true)">Reintentar</button>
                </div>
            `);
        },
        "GET",
        null,
        forzar === true ? {cacheTtl: 0} : undefined
    );
}

const guardarAtencion = () => {
    // Recopilar datos del formulario
    const datos = {
        id_paciente: _SESSION('id_usuario'),
        rut_profesional: $.trim($('#rut_profesional').val()),
        nombre_profesional: $.trim($('#nombre_profesional').val()),
        correo_profesional: $.trim($('#correo_profesional').val()),
        telefono_profesional: $.trim($('#telefono_profesional').val()),
        especialidad: $.trim($('#esp_profesional').val()),
        tipo_especialidad: $.trim($('#tipo_esp_profesional').val()),
        sub_tipo_especialidad: $.trim($('#sub_tipo_esp_profesional').val()),
        diagnosticos: $.trim($('#diagnosticos').val()),
        examenes: $.trim($('#examenes').val()),
        medicamentos: $.trim($('#medicamentos').val()),
        rut_dependiente: $.trim($('#rut_dependiente').val()), // Por si es un dependiente
        token: "mobile-original-" + Date.now()
    };

    // Validaciones básicas
    if (!datos.rut_profesional || !datos.nombre_profesional || !datos.correo_profesional) {
        msg('Atención Médica', 'Debe completar RUT, nombre y correo del profesional', 'warning');
        return;
    }

    if (!datos.diagnosticos && !datos.examenes && !datos.medicamentos) {
        msg('Atención Médica', 'Debe completar al menos un campo: diagnósticos, exámenes o medicamentos', 'warning');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.correo_profesional)) {
        msg('Atención Médica', 'Ingrese un correo electrónico válido', 'warning');
        return;
    }

    cargando(1);

    var api = new Api("paciente", "ficha-atencion-app");
    api.request(
        datos,
        function (resp) {
            console.log('Respuesta guardar atención:', resp);

            if (resp.estado == 1) {
                msg('Atención Médica', 'Atención guardada correctamente', 'success');
                limpiarFormularioAtencion();
            } else {
                msg('Atención Médica', resp.mensaje || 'Error al guardar la atención', 'error');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error guardando atención:', resp);
            cargando(0);
            msg('Atención Médica', 'Error de conexión al guardar la atención', 'error');
        },
        "POST");
}

const solicitarEspecialidades = (select) => {
    var datos = {};
    cargando(1);
    var api = new Api("profesionales", "especialidades");
    api.request(
        datos,
        function (resp) {
            LOG('especialidades estado:' + resp.estado);
            if (resp.estado == 1 && resp.especialidades) {
                let opciones = '<option value="">Seleccione especialidad</option>';
                resp.especialidades.forEach(esp => {
                    opciones += `<option value="${esp.id}">${esp.nombre}</option>`;
                });
                $(`#${select}`).html(opciones);
            } else {
                $(`#${select}`).html('<option value="">No hay especialidades</option>');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando especialidades:', resp);
            cargando(0);
            msg('Especialidades', 'Error al cargar especialidades', 'error');
            $(`#${select}`).html('<option value="">Error al cargar especialidades</option>');
        },
        "GET");
}

const cargarTipoEspecialidad = (select, selectIdEspecialidad) => {
    const idEspecialidad = $(`#${selectIdEspecialidad}`).val();
    if (!idEspecialidad) {
        $(`#${select}`).html('<option value="">Seleccione especialidad primero</option>');
        return;
    }

    var datos = { id_especialidad: idEspecialidad };
    cargando(1);
    var api = new Api("profesionales", "tipo_especialidades");
    api.request(
        datos,
        function (resp) {
            LOG(resp);
            LOG('tipo especialidades estado:' + resp.estado);
            if (resp.estado == 1 && resp.tipo_especialidades) {
                let opciones = '<option value="">Seleccione tipo de especialidad</option>';
                resp.tipo_especialidades.forEach(tipo => {
                    opciones += `<option value="${tipo.id}">${tipo.nombre}</option>`;
                });
                $(`#${select}`).html(opciones);
            } else {
                $(`#${select}`).html('<option value="">No hay tipos de especialidades</option>');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando tipo-especialidades:', resp);
            cargando(0);
            msg('Tipo-Especialidades', 'Error al cargar tipo-especialidades', 'error');
            $(`#${select}`).html('<option value="">Error al cargar tipo-especialidades</option>');
        },
        "GET"
    );
}

const cargarSubTipoEspecialidad = (select,selectIdTipoEspecialidad) => {
    const idTipoEspecialidad = $(`#${selectIdTipoEspecialidad}`).val();

    if (!idTipoEspecialidad) {
        $(`#${select}`).html('<option value="">Seleccione tipo-especialidad primero</option>');
        return; // Salir temprano de la función
    }

    var datos = { id_tipo_especialidad: idTipoEspecialidad };
    cargando(1);

    var api = new Api("profesionales", "sub_tipo_especialidades");
    api.request(
        datos,
        function (resp) {
            LOG('sub tipo especialidades estado:' + resp.estado);
            if (resp.estado == 1 && resp.sub_tipo_especialidades && resp.sub_tipo_especialidades.length > 0) {
                let opciones = '<option value="">Seleccione sub-tipo especialidad</option>';
                resp.sub_tipo_especialidades.forEach(subtipo => {
                    opciones += `<option value="${subtipo.id}">${subtipo.nombre}</option>`;
                });
                $(`#${select}`).html(opciones);
            } else {
                $(`#${select}`).html('<option value="">No hay sub-tipo especialidades disponibles</option>');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando sub-tipo especialidades:', resp);
            cargando(0);
            msg('Sub-Tipo Especialidades', 'Error al cargar sub-tipo especialidades', 'error');
            $(`#${select}`).html('<option value="">Error al cargar datos</option>');
        },
        "GET"
    );
}

var modalidadesAgendaContexto = null;
var prestacionesAgendaContexto = null;

const seleccionarLugarAtencion = (idLugar, idProfesional, nombreLugar) => {
    setSession('id_lugar_seleccionado', idLugar);
    setSession('id_profesional_seleccionado', idProfesional);
    setSession('nombre_lugar_seleccionado', nombreLugar);
    setSession('tipo_agenda_seleccionado', '');
    setSession('tipo_hora_medica_seleccionado', '');
    setSession('id_procedimiento_seleccionado', '');
    setSession('nombre_procedimiento_seleccionado', '');

    cargando(1);
    var api = new Api('profesionales', 'tipos_agenda_lugar_atencion');
    api.request(
        {id_profesional: idProfesional, id_lugar: idLugar},
        function(resp) {
            var modalidades = resp.registros || [];
            cargando(0);

            if (!modalidades.length) {
                mostrarSinFechasDisponibles();
                return;
            }

            if (modalidades.length === 1) {
                if (modalidades[0].tipo_hora_medica === 'E') {
                    modalidadesAgendaContexto = {
                        modalidades: modalidades,
                        idLugar: idLugar,
                        idProfesional: idProfesional,
                        nombreLugar: nombreLugar
                    };
                    cargarPrestacionesAgenda(
                        modalidades[0],
                        idLugar,
                        idProfesional,
                        nombreLugar
                    );
                    vista('seleccionar_fecha_hora', 'fade');
                    return;
                }
                seleccionarTipoAgenda(
                    modalidades[0].id,
                    modalidades[0].tipo_hora_medica,
                    modalidades[0].nombre,
                    idLugar,
                    idProfesional,
                    nombreLugar
                );
                return;
            }

            mostrarTiposAgendaDisponibles(modalidades, idLugar, idProfesional, nombreLugar);
        },
        function() {
            cargando(0);
            msg('Modalidad de atención', 'No fue posible cargar las modalidades disponibles.', 'error');
        },
        'GET'
    );
};

// Íconos de modalidad: cruz de salud (presencial) y filmadora (telemedicina).
const iconoModalidadPresencial = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 3.5h6V9h5.5v6H15v5.5H9V15H3.5V9H9z"/></svg>';
const iconoModalidadVideo = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.2l5-3v9.6l-5-3z"/></svg>';

const mostrarTiposAgendaDisponibles = (modalidades, idLugar, idProfesional, nombreLugar) => {
    const nombreMedico = getSession('nombre_medico_seleccionado');
    const especialidadMedico = getSession('especialidad_medico_seleccionado');
    modalidadesAgendaContexto = {
        modalidades: modalidades,
        idLugar: idLugar,
        idProfesional: idProfesional,
        nombreLugar: nombreLugar
    };
    const tarjetas = modalidades.map(function(modalidad, indice) {
        const esTelemedicina = Number(modalidad.id) === 3;
        return `
            <button type="button" class="modalidad-agenda-card"
                onclick="seleccionarModalidadAgendaPorIndice(${indice})">
                <span class="modalidad-agenda-icono">${esTelemedicina ? iconoModalidadVideo : iconoModalidadPresencial}</span>
                <span class="modalidad-agenda-texto">
                    <strong>${escaparTextoAgenda(modalidad.nombre)}</strong>
                    <small>${escaparTextoAgenda(modalidad.descripcion)}</small>
                </span>
                <span class="modalidad-agenda-flecha">›</span>
            </button>`;
    }).join('');

    $('#seleccionar_fecha_hora .top-titulos').html(`
        <p class="letra-bold color-azul-oscuro size20 text-center">¿Cómo quieres atenderte?</p>
        ${htmlCardProfesionalAgenda(nombreMedico, especialidadMedico, nombreLugar)}
        <div class="btn-app4 text-center size14 mb20" onclick="vista('lugares_atencion');">Volver a lugares</div>
    `);
    $('#lista-fechas').html(`
        <div class="modalidades-agenda-contenedor">
            <p>Selecciona una modalidad de atención</p>
            ${tarjetas}
        </div>
    `);
    vista('seleccionar_fecha_hora', 'fade');
};

const seleccionarModalidadAgendaPorIndice = (indice) => {
    if (!modalidadesAgendaContexto || !modalidadesAgendaContexto.modalidades[indice]) return;
    const modalidad = modalidadesAgendaContexto.modalidades[indice];

    if (modalidad.tipo_hora_medica === 'E') {
        cargarPrestacionesAgenda(
            modalidad,
            modalidadesAgendaContexto.idLugar,
            modalidadesAgendaContexto.idProfesional,
            modalidadesAgendaContexto.nombreLugar
        );
        return;
    }

    seleccionarTipoAgenda(
        modalidad.id,
        modalidad.tipo_hora_medica,
        modalidad.nombre,
        modalidadesAgendaContexto.idLugar,
        modalidadesAgendaContexto.idProfesional,
        modalidadesAgendaContexto.nombreLugar
    );
};

const cargarPrestacionesAgenda = (modalidad, idLugar, idProfesional, nombreLugar) => {
    cargando(1);
    var api = new Api('profesionales', 'prestaciones_lugar_atencion');
    api.request(
        {id_profesional: idProfesional, id_lugar: idLugar},
        function(resp) {
            cargando(0);
            const prestaciones = Array.isArray(resp.registros) ? resp.registros : [];
            if (!prestaciones.length) {
                msg(
                    'Exámenes y procedimientos',
                    'Este profesional todavía no tiene prestaciones activas configuradas en este lugar.',
                    'warning'
                );
                return;
            }

            prestacionesAgendaContexto = {
                prestaciones: prestaciones,
                modalidad: modalidad,
                idLugar: idLugar,
                idProfesional: idProfesional,
                nombreLugar: nombreLugar
            };

            const tarjetas = prestaciones.map(function(prestacion, indice) {
                const codigo = prestacion.codigo
                    ? `<small>Código: ${escaparTextoAgenda(prestacion.codigo)}</small>`
                    : '';
                const valor = prestacion.valor !== null
                    ? `<small>Valor: $${Number(prestacion.valor).toLocaleString('es-CL')}</small>`
                    : '';

                return `
                    <button type="button" class="modalidad-agenda-card"
                        onclick="seleccionarPrestacionAgendaPorIndice(${indice})">
                        <span class="modalidad-agenda-icono">+</span>
                        <span class="modalidad-agenda-texto">
                            <strong>${escaparTextoAgenda(prestacion.nombre)}</strong>
                            <small>${escaparTextoAgenda(prestacion.tipo_nombre)}</small>
                            ${codigo}
                            ${valor}
                        </span>
                        <span class="modalidad-agenda-flecha">›</span>
                    </button>`;
            }).join('');

            $('#lista-fechas').html(`
                <div class="modalidades-agenda-contenedor">
                    <p>Selecciona el examen o procedimiento</p>
                    ${tarjetas}
                    <button type="button" class="btn-app4 text-center size14 mt20"
                        onclick="mostrarTiposAgendaDisponibles(
                            modalidadesAgendaContexto.modalidades,
                            modalidadesAgendaContexto.idLugar,
                            modalidadesAgendaContexto.idProfesional,
                            modalidadesAgendaContexto.nombreLugar
                        )">
                        Volver a modalidades
                    </button>
                </div>
            `);
        },
        function() {
            cargando(0);
            msg('Exámenes y procedimientos', 'No fue posible cargar las prestaciones.', 'error');
        },
        'GET'
    );
};

const seleccionarPrestacionAgendaPorIndice = (indice) => {
    if (!prestacionesAgendaContexto || !prestacionesAgendaContexto.prestaciones[indice]) return;
    const prestacion = prestacionesAgendaContexto.prestaciones[indice];
    const modalidad = prestacionesAgendaContexto.modalidad;

    setSession('id_procedimiento_seleccionado', prestacion.id_procedimiento);
    setSession('nombre_procedimiento_seleccionado', prestacion.nombre);

    seleccionarTipoAgenda(
        modalidad.id,
        modalidad.tipo_hora_medica,
        modalidad.nombre,
        prestacionesAgendaContexto.idLugar,
        prestacionesAgendaContexto.idProfesional,
        prestacionesAgendaContexto.nombreLugar
    );
};

const seleccionarTipoAgenda = (tipoAgenda, tipoHoraMedica, nombreModalidad, idLugar, idProfesional, nombreLugar) => {
    setSession('tipo_agenda_seleccionado', tipoAgenda);
    setSession('tipo_hora_medica_seleccionado', tipoHoraMedica);
    setSession('nombre_modalidad_seleccionada', nombreModalidad);
    cargarFechasAgendaSeleccionada(idLugar, idProfesional, nombreLugar);
};

const volverDesdeFechasAgenda = () => {
    if (
        getSession('tipo_hora_medica_seleccionado') === 'E'
        && prestacionesAgendaContexto
    ) {
        cargarPrestacionesAgenda(
            prestacionesAgendaContexto.modalidad,
            prestacionesAgendaContexto.idLugar,
            prestacionesAgendaContexto.idProfesional,
            prestacionesAgendaContexto.nombreLugar
        );
        return;
    }

    vista('lugares_atencion');
};

const escaparTextoAgenda = (valor) => $('<div>').text(valor == null ? '' : String(valor)).html();

// Card del profesional usada en todos los pasos de Agendar hora (lugar y badges son opcionales).
const htmlCardProfesionalAgenda = (nombre, especialidad, lugar, badges) => {
    const listaBadges = (badges || []).filter(Boolean);
    return `
        <div class="agenda-profesional-card">
            <strong class="agenda-profesional-nombre text-uppercase">${escaparTextoAgenda(nombre)}</strong>
            <span class="agenda-profesional-especialidad">${escaparTextoAgenda(especialidad)}</span>
            ${lugar ? `<span class="agenda-profesional-lugar text-uppercase"><img width="12" src="src/images/ubicacion-morado.svg" alt="">${escaparTextoAgenda(lugar)}</span>` : ''}
            ${listaBadges.length ? `<div class="agenda-profesional-badges">${listaBadges.map(b => `<span class="agenda-modalidad-seleccionada">${escaparTextoAgenda(b)}</span>`).join('')}</div>` : ''}
        </div>`;
};

const cargarFechasAgendaSeleccionada = (idLugar, idProfesional, nombreLugar) => {
    console.log('Lugar de atención seleccionado ID:', idLugar);

    // Obtener datos del médico desde la sesión
    const nombreMedico = getSession('nombre_medico_seleccionado');
    const especialidadMedico = getSession('especialidad_medico_seleccionado');

    // Guardar en sesión el ID del lugar seleccionado y su nombre
    setSession('id_lugar_seleccionado', idLugar);
    setSession('id_profesional_seleccionado', idProfesional);
    setSession('nombre_lugar_seleccionado', nombreLugar);

    var datos = {
        id_profesional: idProfesional,
        id_lugar: idLugar,
        tipo_agenda: getSession('tipo_agenda_seleccionado')
    };

    cargando(1);

    var api = new Api("profesionales", "dias_laborales_lugar_atencion");
    api.request(
        datos,
        function (resp) {
            LOG('dias laborales estado:' + resp.estado);
            console.log(resp);

            if (resp.estado == 1 && resp.registros) {
                // Procesar días laborales
                const diasLaborales = resp.registros.horario_agenda_laboral.split(',').map(d => parseInt(d));

                // Generar fechas disponibles para los próximos 30 días
                const fechasDisponibles = generarFechasDisponibles(diasLaborales, 30);

                if (fechasDisponibles.length > 0) {
                    // Card del profesional con la modalidad (y prestación, si aplica) como badges centrados.
                    const nombreProcedimiento = getSession('nombre_procedimiento_seleccionado');
                    $('#seleccionar_fecha_hora .top-titulos').html(`
                        ${htmlCardProfesionalAgenda(nombreMedico, especialidadMedico, nombreLugar,
                            [getSession('nombre_modalidad_seleccionada'), nombreProcedimiento])}
                        <div class="btn-app4 text-center size14 mb20" onclick="volverDesdeFechasAgenda();">
                            ${getSession('tipo_hora_medica_seleccionado') === 'E'
                                ? 'Volver a prestaciones'
                                : 'Volver a lugares'}
                        </div>
                    `);

                    let htmlHoras = `
                    <div class="agenda-paso-card">
                        <p class="agenda-paso-titulo"><span>1</span> Selecciona una fecha disponible</p>
                        <input type="hidden" id="fecha_seleccionada" value="">
                        <div id="agenda-calendario" class="agenda-calendario"></div>
                        <p id="agenda-fecha-elegida" class="agenda-fecha-elegida">Toca un día destacado para ver sus horarios.</p>
                    </div>
                    <div id="horarios-disponibles"></div>
                    `;

                    $('#lista-fechas').html(htmlHoras);
                    iniciarCalendarioAgenda(fechasDisponibles);

                    vista('seleccionar_fecha_hora', 'fade');
                } else {
                    mostrarSinFechasDisponibles();
                }
            } else {
                mostrarSinFechasDisponibles();
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando días laborales:', resp);
            cargando(0);
            msg('Error', 'Error al cargar días laborales', 'error');
        },
        "GET"
    );
}

const generarFechasDisponibles = (diasLaborales, cantidadDias) => {
    const fechasDisponibles = [];
    const hoy = new Date();
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (let i = 1; i <= cantidadDias; i++) { // Empezar desde mañana
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);

        const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, etc.

        // Verificar si el día está en los días laborales
        if (diasLaborales.includes(diaSemana)) {
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const año = fecha.getFullYear();

            fechasDisponibles.push({
                valor: `${año}-${mes}-${dia}`,
                texto: `${nombresDias[diaSemana]} ${dia} de ${nombresMeses[fecha.getMonth()]} ${año}`
            });
        }
    }

    return fechasDisponibles;
}

// ===== Calendario de fechas disponibles (reemplaza al select) =====
let agendaCalendario = { disponibles: {}, meses: [], indiceMes: 0 };
let agendaHoraSeleccionada = null;

const iniciarCalendarioAgenda = (fechasDisponibles) => {
    const disponibles = {};
    const meses = [];
    fechasDisponibles.forEach(fecha => {
        disponibles[fecha.valor] = fecha.texto;
        const mes = fecha.valor.slice(0, 7);
        if (meses.indexOf(mes) === -1) meses.push(mes);
    });
    agendaCalendario = { disponibles: disponibles, meses: meses, indiceMes: 0 };
    agendaHoraSeleccionada = null;
    renderizarCalendarioAgenda();
};

const cambiarMesCalendarioAgenda = (paso) => {
    const nuevo = agendaCalendario.indiceMes + paso;
    if (nuevo < 0 || nuevo >= agendaCalendario.meses.length) return;
    agendaCalendario.indiceMes = nuevo;
    renderizarCalendarioAgenda();
};

const renderizarCalendarioAgenda = () => {
    const mesClave = agendaCalendario.meses[agendaCalendario.indiceMes];
    if (!mesClave) return;
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [anio, mes] = mesClave.split('-').map(Number);
    const primerDia = new Date(anio, mes - 1, 1);
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const desfase = (primerDia.getDay() + 6) % 7; // Semana comienza el lunes
    const seleccionada = $('#fecha_seleccionada').val();
    const hoy = new Date();
    const claveHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    let celdas = '';
    for (let i = 0; i < desfase; i++) celdas += '<span class="agenda-cal-vacio"></span>';
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const clave = `${mesClave}-${String(dia).padStart(2, '0')}`;
        const disponible = Object.prototype.hasOwnProperty.call(agendaCalendario.disponibles, clave);
        const clases = ['agenda-cal-dia'];
        if (disponible) clases.push('disponible');
        if (clave === seleccionada) clases.push('seleccionado');
        if (clave === claveHoy) clases.push('hoy');
        celdas += disponible
            ? `<button type="button" data-role="none" class="${clases.join(' ')}" onclick="seleccionarFechaCalendarioAgenda('${clave}')" aria-label="${escaparTextoAgenda(agendaCalendario.disponibles[clave])}">${dia}</button>`
            : `<span class="${clases.join(' ')}" aria-disabled="true">${dia}</span>`;
    }

    const total = agendaCalendario.meses.length;
    const indice = agendaCalendario.indiceMes;
    $('#agenda-calendario').html(`
        <div class="agenda-cal-cabecera">
            <button type="button" data-role="none" class="agenda-cal-nav" onclick="cambiarMesCalendarioAgenda(-1)" ${indice === 0 ? 'disabled' : ''} aria-label="Mes anterior">‹</button>
            <strong>${nombresMeses[mes - 1]} ${anio}</strong>
            <button type="button" data-role="none" class="agenda-cal-nav" onclick="cambiarMesCalendarioAgenda(1)" ${indice >= total - 1 ? 'disabled' : ''} aria-label="Mes siguiente">›</button>
        </div>
        <div class="agenda-cal-semana"><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span></div>
        <div class="agenda-cal-grid">${celdas}</div>
        <div class="agenda-cal-leyenda"><span><i class="disponible"></i>Disponible</span><span><i class="seleccionado"></i>Seleccionado</span></div>
    `);
};

const seleccionarFechaCalendarioAgenda = (clave) => {
    $('#fecha_seleccionada').val(clave);
    agendaHoraSeleccionada = null;
    renderizarCalendarioAgenda();
    $('#agenda-fecha-elegida').html(`Fecha elegida: <strong>${escaparTextoAgenda(agendaCalendario.disponibles[clave] || fechaEsp(clave))}</strong>`);
    cargarHorasDisponibles();
};

const seleccionarHoraAgenda = (boton) => {
    $('#horarios-disponibles .btn-hora-disponible').removeClass('seleccionada').attr('aria-pressed', 'false');
    $(boton).addClass('seleccionada').attr('aria-pressed', 'true');
    agendaHoraSeleccionada = { id: boton.getAttribute('data-id'), hora: boton.getAttribute('data-hora') };
    $('#btn-reservar-hora').prop('disabled', false).text(`Reservar hora de las ${agendaHoraSeleccionada.hora}`);
};

const reservarHoraSeleccionada = () => {
    const fecha = $('#fecha_seleccionada').val();
    if (!agendaHoraSeleccionada || !fecha) {
        msg('Horario', 'Debe seleccionar un horario', 'warning');
        return;
    }
    confirmarHoraMedica(agendaHoraSeleccionada.id, fecha, agendaHoraSeleccionada.hora);
};

const cargarHorasDisponibles = () => {
    const fechaSeleccionada = $('#fecha_seleccionada').val();

    if (!fechaSeleccionada) {
        msg('Fecha', 'Debe seleccionar una fecha', 'warning');
        return;
    }

    const datos = {
        id_profesional: getSession('id_profesional_seleccionado'),
        id_lugar: getSession('id_lugar_seleccionado'),
        fecha: fechaSeleccionada,
        tipo_agenda: getSession('tipo_agenda_seleccionado')
    };

    cargando(1);

    var api = new Api("profesionales", "horas_disponibles_profesional_lugar_atencion");
    api.request(
        datos,
        function (resp) {
            if (resp.estado == 1 && resp.horarios && resp.horarios.length > 0) {
                agendaHoraSeleccionada = null;
                const botones = resp.horarios.map((horario, indice) => {
                    const horaTexto = horaSinSegundos(horario.hora);
                    return `<button type="button" data-role="none" class="btn-hora-disponible"
                        data-id="${escaparTextoAgenda(horario.id)}" data-hora="${escaparTextoAgenda(horaTexto)}"
                        onclick="seleccionarHoraAgenda(this)">${escaparTextoAgenda(horaTexto)}</button>`;
                }).join('');

                $('#horarios-disponibles').html(`
                    <div class="agenda-paso-card">
                        <p class="agenda-paso-titulo"><span>2</span> Elige un horario</p>
                        <div class="agenda-horas-grid">${botones}</div>
                        <button type="button" data-role="none" id="btn-reservar-hora" class="agenda-reservar-btn" disabled
                            onclick="reservarHoraSeleccionada()">Selecciona un horario</button>
                    </div>
                `);
                const tarjetaHoras = document.getElementById('horarios-disponibles');
                if (tarjetaHoras && tarjetaHoras.scrollIntoView) {
                    tarjetaHoras.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            } else {
                $('#horarios-disponibles').html(`
                    <div class="agenda-paso-card text-center">
                        <p class="size16 color-azul mb0">No hay horarios disponibles para esta fecha</p>
                        <p class="agenda-fecha-elegida">Prueba con otro día del calendario.</p>
                    </div>
                `);
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando horarios:', resp);
            cargando(0);
            msg('Error', 'Error al cargar horarios disponibles', 'error');
        },
        "GET"
    );
}

const mostrarSinFechasDisponibles = () => {
    $('#lista-fechas').html(`
        <div class="card-button-dos mb20">
            <div class="row">
                <div class="col-xs-12 text-center pt20 pb20">
                    <p class="size18 color-azul">No hay fechas disponibles</p>
                    <p class="size14">Este profesional no tiene días laborales asignados</p>
                </div>
            </div>
        </div>
    `);
    msg('Días Laborales', 'No hay días laborales disponibles para este lugar de atención', 'warning');
}

// Función auxiliar para limpiar el formulario después de guardar
const limpiarFormularioAtencion = () => {
    $('#rut_profesional').val('');
    $('#nombre_profesional').val('');
    $('#correo_profesional').val('');
    $('#telefono_profesional').val('');
    $('#esp_profesional').val('');
    $('#tipo_esp_profesional').html('<option value="">Seleccione especialidad primero</option>');
    $('#sub_tipo_esp_profesional').html('<option value="">Seleccione tipo-especialidad primero</option>');
    $('#diagnosticos').val('');
    $('#examenes').val('');
    $('#medicamentos').val('');
    $('#rut_dependiente').val('');

    // Ocultar el div del dependiente si estaba visible
    $('#div_paciente_dependiente').addClass('hidden');
}

const limpiarFormularioBusquedaMedico = () => {
    $('#especialidad').val(0);
    $('#tipoespecialidad').html('<option value="">Seleccione especialidad primero</option>');
    $('#subtipoespecialidad').html('<option value="">Seleccione tipo-especialidad primero</option>');
    $('#region').val(0);
    $('#ciudad').html('<option value="">Seleccione región primero</option>');
}

// "2026-05-14", "2026-05-14T20:26:38" o "2026-05-14 20:26:38" → "14-05-2026".
const fechaEsp = (fecha) =>{
    var fecha_ = String(fecha).trim().split(/[T ]/);
    fecha_ = fecha_[0].split('-');
    return fecha_[2]+'-'+fecha_[1]+'-'+fecha_[0];
}

// Igual que fechaEsp, pero agrega la hora sin segundos: "14-05-2026 20:26".
const fechaHoraEsp = (fecha) => {
    var partes = String(fecha).trim().split(/[T ]/);
    var hora = (partes[1] || '').match(/^(\d{1,2}):(\d{2})/);
    return fechaEsp(fecha) + (hora ? ' ' + ('0' + hora[1]).slice(-2) + ':' + hora[2] : '');
}

// Quita los segundos de cualquier hora "HH:MM:SS" dentro de un texto → "HH:MM".
const horaSinSegundos = (texto) => String(texto).replace(/\b(\d{1,2}:\d{2}):\d{2}\b/g, '$1');

const enviarCorreoValidarEquipo = () => {

    var datos = {};

    datos.id_user = _SESSION('id_usuario');
    datos.uuid = $('#uuid').val();
        
    var api = new Api("mobile-authorization", "device/activation-request");
    api.request(
        datos,
        function (resp) {
            LOG('correo de registro de equipo:'+resp.envio_correo);
            if (resp.envio_correo.estado == 1) {
                msg('Correo de activación', 'Correo Enviado', 'success');  
            }else{
                msg('Correo de activación', 'Problemas al enviar el correo', 'error');
            }            

        },
        function (resp) {             
            msg('Correo de activación', 'Problemas al enviar el correo', 'error');
        },
        "POST");

}
const openReceta = (url) => {
    console.log("Click detectado. URL:", url);
    if (!cordova.InAppBrowser) {
        console.log("InAppBrowser no disponible");
    } else {
        // cordova.InAppBrowser.open(url, '_blank', 'location=yes');
        // console.log("Intento de abrir InAppBrowser");
          const gviewUrl = "https://docs.google.com/gview?embedded=true&url=" + encodeURIComponent(url);
        cordova.InAppBrowser.open(gviewUrl, '_blank', 'location=yes');
    }
}

const formatearRut = (rut) => {
    // Eliminar puntos, guiones y espacios
    rut = rut.replace(/[^0-9kK]/g, '');

    if (rut.length < 2) return rut;

    // Separar número del dígito verificador
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    // Formatear el cuerpo con puntos
    let cuerpoFormateado = '';
    for (let i = cuerpo.length; i > 0; i -= 3) {
        const inicio = Math.max(0, i - 3);
        const grupo = cuerpo.slice(inicio, i);
        cuerpoFormateado = grupo + (cuerpoFormateado ? '.' + cuerpoFormateado : '');
    }

    return cuerpoFormateado + (dv ? '-' + dv : '');
}

const calcularDV = (rut) => {
    let suma = 0;
    let multiplicador = 2;

    // Calcular suma
    for (let i = rut.length - 1; i >= 0; i--) {
        suma += parseInt(rut.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dv = 11 - resto;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

const validarRut = (rutCompleto) => {
    if (!rutCompleto || rutCompleto.length < 3) return false;

    const rutLimpio = rutCompleto.replace(/[^0-9kK]/g, '');
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();

    if (cuerpo.length < 1 || !/^\d+$/.test(cuerpo)) return false;

    return calcularDV(cuerpo) === dv;
}

// Aplicar formato al campo RUT
const aplicarFormatoRut = () => {
    const campoRut = $('#rut_profesional');

    campoRut.on('input', function() {
        const valorActual = $(this).val();
        const rutFormateado = formatearRut(valorActual);
        $(this).val(rutFormateado);
    });

    campoRut.on('blur', function() {
        const rutCompleto = $(this).val();
        const rutLimpio = rutCompleto.replace(/[^0-9kK]/g, '');

        if (rutLimpio.length >= 2) {
            const cuerpo = rutLimpio.slice(0, -1);
            const dvCalculado = calcularDV(cuerpo);
            const rutConDV = formatearRut(cuerpo + dvCalculado);
            $(this).val(rutConDV);

            // Validar RUT
            if (!validarRut(rutConDV)) {
                $(this).addClass('error');
                msg('RUT Inválido', 'El RUT ingresado no es válido', 'warning');
            } else {
                $(this).removeClass('error');
            }
        }
    });
}

const cancelarHoraMedica = async (idHora) => {
    if (!idHora) {
        msg('Anular Hora', 'ID de hora inválido', 'warning');
        return;
    }

    const confirmado = await confirmarMedsdi(
        '¿Anular esta hora?',
        'La cita será anulada y dejará de aparecer como una hora activa.',
        {
            icon: 'warning',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#c94755'
        }
    );

    if (!confirmado) {
        return;
    }

    if (typeof confirmarBiometriaAccionApp !== 'function') {
        await swalMedsdi(
            'Confirmación biométrica',
            'No fue posible iniciar la validación biométrica.',
            'error'
        );
        return;
    }

    const validacionBiometrica = await confirmarBiometriaAccionApp(
        'Confirma tu huella para anular esta hora médica.'
    );

    if (!validacionBiometrica.ok) {
        const mensaje = validacionBiometrica.motivo === 'no_habilitada'
            ? 'Activa primero la huella desde Mi perfil → Seguridad.'
            : (validacionBiometrica.mensaje || 'No fue posible validar tu identidad.');

        await swalMedsdi(
            'Hora no anulada',
            mensaje,
            validacionBiometrica.motivo === 'cancelada' ? 'info' : 'warning'
        );
        return;
    }

    const datos = {
        id_hora: idHora,
        token: "mobile-original-" + Date.now()
    };

    cargando(1);

    var api = new Api("paciente", "anular_hora_medica");
    api.request(
        datos,
        function (resp) {
            if (resp.estado == 1) {
                swalMedsdi(
                    'Hora anulada',
                    'La hora médica fue anulada correctamente.',
                    'success'
                );
                solicitarMisHorasMedicas(true);
            } else {
                msg('Error', resp.msj || 'Error al anular la hora', 'error');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error anulando hora:', resp);
            cargando(0);
            msg('Error', 'Error de conexión al anular la hora', 'error');
        },
        "POST"
    );
}

const confirmarHoraMedica = async (idHora, fecha, hora) => {

    const confirmado = await confirmarMedsdi(
        'Confirmar reserva',
        `¿Deseas agendar esta hora médica para el ${fecha} a las ${hora}?`,
        {
            icon: 'question',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Elegir otra hora',
            confirmButtonColor: '#6f42c1'
        }
    );

    if (!confirmado) {
        return;
    }

    // Segundo factor antes de enviar la reserva al servidor.
    if (typeof confirmarBiometriaAccionApp !== 'function') {
        await swalMedsdi(
            'Confirmación biométrica',
            'No fue posible iniciar la validación biométrica. Actualiza la aplicación e inténtalo nuevamente.',
            'error'
        );
        return;
    }

    const validacionBiometrica = await confirmarBiometriaAccionApp(
        `Confirma tu huella para reservar la hora del ${fecha} a las ${hora}.`
    );

    if (!validacionBiometrica.ok) {
        const mensaje = validacionBiometrica.motivo === 'no_habilitada'
            ? 'Activa primero la huella desde Mi perfil → Seguridad para poder confirmar reservas.'
            : (validacionBiometrica.mensaje || 'No fue posible validar tu identidad.');

        await swalMedsdi(
            'Reserva no confirmada',
            mensaje,
            validacionBiometrica.motivo === 'cancelada' ? 'info' : 'warning'
        );
        return;
    }

    const datos = {
        id_profesional: getSession('id_profesional_seleccionado'),
        id_lugar: getSession('id_lugar_seleccionado'),
        tipo_agenda: getSession('tipo_agenda_seleccionado'),
        tipo_hora_medica: getSession('tipo_hora_medica_seleccionado') || 'C',
        id_procedimiento: getSession('id_procedimiento_seleccionado') || null,
        examen: getSession('nombre_procedimiento_seleccionado') || '',
        id_hora: idHora,
        id_mascota: window.mascotaAgenda || null,
        fecha: fecha,
        hora: hora,
        token: "mobile-original-" + Date.now()
    };

    cargando(1);

    var api = new Api("paciente", "agendar_hora_medica");
    api.request(
        datos,
        function (resp) {
            console.log('Respuesta confirmar hora:', resp);

            if (resp.estado == 1) {
                guardarMascotaDeCita(idHora);
                msg('Hora Confirmada', 'La hora ha sido confirmada correctamente', 'success');
            } else {
                msg('Error', resp.msj || 'Error al confirmar la hora', 'error');
            }

            cargando(0);
            solicitarMisHorasMedicas();
        },
        function (resp) {
            console.error('Error confirmando hora:', resp);
            cargando(0);
            var mensaje = resp && resp.responseJSON && resp.responseJSON.msj
                ? resp.responseJSON.msj
                : 'No fue posible confirmar la hora.';
            msg('Confirmar Hora', mensaje, 'error');
        },
        "POST");
}

const confirmarHoraMedicaAgendada = async (idHora) => {
    if (!idHora) {
        msg('Confirmar Hora', 'ID de hora inválido', 'warning');
        return;
    }

    const confirmado = await confirmarMedsdi(
        'Confirmar asistencia',
        '¿Deseas confirmar esta hora médica?',
        {
            icon: 'question',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Ahora no',
            confirmButtonColor: '#18a36f'
        }
    );

    if (!confirmado) {
        return;
    }

    if (typeof confirmarBiometriaAccionApp !== 'function') {
        await swalMedsdi(
            'Confirmación biométrica',
            'No fue posible iniciar la validación biométrica.',
            'error'
        );
        return;
    }

    const validacionBiometrica = await confirmarBiometriaAccionApp(
        'Confirma tu huella para confirmar esta hora médica.'
    );

    if (!validacionBiometrica.ok) {
        const mensaje = validacionBiometrica.motivo === 'no_habilitada'
            ? 'Activa primero la huella desde Mi perfil → Seguridad.'
            : (validacionBiometrica.mensaje || 'No fue posible validar tu identidad.');

        await swalMedsdi(
            'Hora no confirmada',
            mensaje,
            validacionBiometrica.motivo === 'cancelada' ? 'info' : 'warning'
        );
        return;
    }

    const datos = {
        id_hora: idHora,
        token: "mobile-original-" + Date.now()
    };

    cargando(1);

    var api = new Api("paciente", "confirmar_hora_medica");
    api.request(
        datos,
        function (resp) {
            if (resp.estado == 1) {
                swalMedsdi(
                    'Hora confirmada',
                    'Tu asistencia quedó confirmada correctamente.',
                    'success'
                );
                solicitarMisHorasMedicas(true);
            } else {
                msg('Error', resp.msj || 'Error al confirmar la hora', 'error');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error confirmando hora:', resp);
            cargando(0);
            msg('Error', 'Error de conexión al confirmar la hora', 'error');
        },
        "POST"
    );
}

const dameRegiones = (select) => {
    var datos = {};
    cargando(1);
    var api = new Api("paciente", "dame_regiones");
    api.request(
        datos,
        function (resp) {
            LOG('regiones estado:' + resp.estado);
            if (resp.estado == 1 && resp.regiones) {
                let opciones = '<option value="">Seleccione región</option>';
                resp.regiones.forEach(region => {
                    opciones += `<option value="${region.id}">${region.nombre}</option>`;
                });
                $('#region').html(opciones);
            } else {
                $('#region').html('<option value="">No hay regiones</option>');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando regiones:', resp);
            cargando(0);
            msg('Regiones', 'Error al cargar regiones', 'error');
            $('#region').html('<option value="">Error al cargar regiones</option>');
        },
        "GET");
}

const dameCiudades = (select, selectIdRegion) => {
    const idRegion = $(`#${selectIdRegion}`).val();
    if (!idRegion) {
        $(`#${select}`).html('<option value="">Seleccione región primero</option>');
        return;
    }

    var datos = { id_region: idRegion };
    cargando(1);
    var api = new Api("paciente", "dame_ciudades");
    api.request(
        datos,
        function (resp) {
            LOG('provincias estado:' + resp.estado);
            if (resp.estado == 1 && resp.ciudades) {
                let opciones = '<option value="">Seleccione provincia</option>';
                resp.ciudades.forEach(ciudad => {
                    opciones += `<option value="${ciudad.id}">${ciudad.nombre}</option>`;
                });
                $(`#${select}`).html(opciones);
            } else {
                $(`#${select}`).html('<option value="">No hay ciudades</option>');
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error cargando provincias:', resp);
            cargando(0);
            msg('Provincias', 'Error al cargar provincias', 'error');
            $(`#${select}`).html('<option value="">Error al cargar provincias</option>');
        },
        "GET");
}

var profesionalesBusquedaCache = [];

const agendarProfesionalDesdeBusqueda = (indice) => {
    const prof = profesionalesBusquedaCache[indice];
    if (!prof) return;
    const nombre = [prof.nombre, prof.apellido_uno, prof.apellido_dos]
        .filter(Boolean).join(' ').trim() || 'Profesional';
    const especialidad = [
        textoDatoProfesional(prof.especialidad) || prof.nombre_especialidad,
        textoDatoProfesional(prof.tipo_especialidad) || prof.nombre_tipo_especialidad,
        textoDatoProfesional(prof.sub_tipo_especialidad) || prof.nombre_sub_tipo_especialidad
    ].filter(Boolean).filter(function(valor, posicion, lista) {
        return lista.indexOf(valor) === posicion;
    }).join(' - ') || 'Especialidad no informada';
    agendarHora(prof.id, nombre, especialidad);
};

const buscarProfesionales = () => {

    // validar que se haya seleccionado una especialidad
    if (!$('#especialidad').val()) {
        msg('Búsqueda', 'Debe seleccionar una especialidad para buscar profesionales', 'warning');
        return;
    }
    // validar que se haya seleccionado una región
    if (!$('#region').val()) {
        msg('Búsqueda', 'Debe seleccionar una región para buscar profesionales', 'warning');
        return;
    }


    const datos = {
        id_especialidad: $('#especialidad').val(),
        id_tipo_especialidad: $('#tipoespecialidad').val(),
        id_sub_tipo_especialidad: $('#subtipoespecialidad').val(),
        id_region: $('#region').val(),
        id_ciudad: $('#ciudad').val(),
        nombre_profesional: $.trim($('#nombre_profesional_busqueda').val()),
        token: "mobile-original-" + Date.now()
    };
    setSession('origen_seleccion_profesional', 'mis_medicos_buscados');
    cargando(1);
    var api = new Api("profesionales", "buscar_profesionales");
    api.request(
        datos,
        function (resp) {
            LOG('buscar profesionales estado:' + resp.estado);
            console.log(resp.profesionales);
            vista('mis_medicos_buscados', 'fade');
            $('#resumen-profesionales-encontrados').text(
                resp.total_resultados === 1
                    ? 'Encontramos 1 profesional'
                    : 'Encontramos ' + Number(resp.total_resultados || 0) + ' profesionales'
            );
            if (resp.estado == 1 && resp.profesionales && resp.profesionales.length > 0) {
                profesionalesBusquedaCache = resp.profesionales;
                let htmlProfesionales = '';
                resp.profesionales.forEach((prof, indiceProfesional) => {
                    if (prof.img_profesional) {
                        var fotoPerfil = prof.img_profesional;
                    } else if(prof.foto_perfil && prof.foto_perfil!=''){
                        var fotoPerfil = MEDSDI_WEB_URL + '/storage/'+prof.foto_perfil;
                    }else{
                        if(prof.sexo && prof.sexo=='F'){
                            var fotoPerfil = 'src/images/ejemplo_dra.jpg';
                        }else{
                            var fotoPerfil = 'src/images/ejemplo_dr.jpg';
                        }
                    }
                    const nombreCompleto = [
                        prof.nombre,
                        prof.apellido_uno,
                        prof.apellido_dos
                    ].filter(Boolean).join(' ').trim() || 'Profesional';
                    const especialidadCompleta = [
                        textoDatoProfesional(prof.especialidad) || prof.nombre_especialidad,
                        textoDatoProfesional(prof.tipo_especialidad) || prof.nombre_tipo_especialidad,
                        textoDatoProfesional(prof.sub_tipo_especialidad) || prof.nombre_sub_tipo_especialidad
                    ].filter(Boolean).filter(function (valor, indice, lista) {
                        return lista.indexOf(valor) === indice;
                    }).join(' - ') || 'Especialidad no informada';
                    const lugarAtencion = textoDatoProfesional(prof.nombre_lugar_atencion)
                        || textoDatoProfesional(prof.lugar_atencion)
                        || textoDatoProfesional(prof.direccion)
                        || 'Lugar de atención por confirmar';
                    // Todo lo que aparece en la card comienza con mayúscula (nombre y apellidos por palabra).
                    const nombreCard = escaparTextoConsentimiento(
                        nombreCompleto.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, letra) => sep + letra.toUpperCase())
                    );
                    // En la card solo se ve la especialidad (la más específica), en un pill.
                    const especialidadCard = escaparTextoConsentimiento(
                        nombrePropio(especialidadCompleta.split(' - ').pop())
                    );
                    const lugarCard = escaparTextoConsentimiento(primeraMayuscula(lugarAtencion));

                    htmlProfesionales += `
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-3 text-center">
                                <a href="javascript:void(0)" onclick="damePerfilMedico(${prof.id})"> <img class="img-circulo" width="70" src="${fotoPerfil}" alt="Foto perfil"> </a>
                            </div>
                            <div class="col-xs-9">
                                <p class="size16 color-azul mb5 text-uppercase">${nombreCard}</p>
                                <p class="mb5"><span class="especialidad-pill">${especialidadCard}</span></p>
                                <p class="letra-small mb5"><img class="mr10" width="15" src="src/images/ubicacion-morado.svg"><span class="text-uppercase">${lugarCard}</span></p>
                                <button type="button" data-role="none" class="btn-agendar-hora" onclick="agendarProfesionalDesdeBusqueda(${indiceProfesional})">Agendar hora</button>
                            </div>
                        </div>
                    </div>
                    `;
                });
                $('#lista-medicos-buscados').html(htmlProfesionales);
            } else {
                $('#lista-medicos-buscados').html(`
                    <div class="card-button-dos mb20">
                        <div class="row">
                            <div class="col-xs-12 text-center pt20 pb20">
                                <p class="size18 color-azul">No hay registro</p>
                            </div>
                        </div>
                    </div>
                `);
            }
            cargando(0);
        },
        function (resp) {
            console.error('Error buscando profesionales:', resp);
            cargando(0);
            msg('Error', 'Error al buscar profesionales', 'error');
            $('#lista-medicos-buscados').html(`
                <div class="card-button-dos mb20">
                    <div class="row">
                        <div class="col-xs-12 text-center pt20 pb20">
                            <p class="size18 color-rojo">Error al buscar profesionales</p>
                            <div class="btn-app4 mt10" onclick="buscarProfesionales()">Reintentar</div>
                        </div>
                    </div>
                </div>
            `);
        },
        "POST");
}

var listLogDeviceRequestId = 0;
var autorizacionesRegistros = [];
var autorizacionesFiltroActivo = 'pendientes';

const textoEstadoAutorizacion = (reg) => {
    if (!reg) {
        return '';
    }

    const candidatos = [
        reg.estado_texto,
        reg.estado_nombre,
        reg.nombre_estado,
        reg.status,
        reg.decision,
        reg.resultado,
        reg.respuesta
    ];

    // Si "estado" ya viene como texto descriptivo, también lo consideramos.
    if (typeof reg.estado === 'string') {
        candidatos.push(reg.estado);
    }

    candidatos.push(
        $('<div>').html(reg.msg_html || '').text()
    );

    return candidatos
        .filter(function(valor) {
            return valor !== null && typeof valor !== 'undefined' && String(valor).trim() !== '';
        })
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const obtenerEstadoAutorizacion = (reg) => {
    const estadoNumerico = Number(reg && reg.estado);

    // El backend usa: 0 pendiente, 1 autorizada, 2 rechazada,
    // 3 cancelada y 4 expirada. Esta fuente es más confiable que inferir el
    // estado desde el texto HTML de la tarjeta.
    if (estadoNumerico === 0) {
        return 'pendientes';
    }

    if (estadoNumerico === 1) {
        return 'aprobadas';
    }

    if ([2, 3, 4].indexOf(estadoNumerico) !== -1) {
        return 'rechazadas';
    }

    const texto = textoEstadoAutorizacion(reg);

    // Primero detectar estados definitivos.
    if (
        texto.indexOf('rechazad') !== -1 ||
        texto.indexOf('denegad') !== -1 ||
        texto.indexOf('rechazo') !== -1 ||
        texto.indexOf('cancelad') !== -1 ||
        texto.indexOf('expirad') !== -1
    ) {
        return 'rechazadas';
    }

    if (
        texto.indexOf('aprobada') !== -1 ||
        texto.indexOf('aprobado') !== -1 ||
        texto.indexOf('aceptada') !== -1 ||
        texto.indexOf('aceptado') !== -1 ||
        texto.indexOf('autorizada') !== -1 ||
        texto.indexOf('autorizado') !== -1
    ) {
        return 'aprobadas';
    }

    if (
        texto.indexOf('pendiente') !== -1 ||
        texto.indexOf('por responder') !== -1 ||
        texto.indexOf('esperando respuesta') !== -1
    ) {
        return 'pendientes';
    }

    /*
     * Compatibilidad con registros antiguos:
     * si el backend no entrega un nombre de estado explícito, estas entradas
     * corresponden a solicitudes que todavía requieren acción del usuario.
     */
    return 'pendientes';
};

const actualizarContadoresAutorizaciones = () => {
    const contadores = {
        todas: autorizacionesRegistros.length,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0
    };

    autorizacionesRegistros.forEach(function(reg) {
        const estado = obtenerEstadoAutorizacion(reg);
        if (Object.prototype.hasOwnProperty.call(contadores, estado)) {
            contadores[estado]++;
        }
    });

    $('#autorizaciones_count_todas').text(contadores.todas);
    $('#autorizaciones_count_pendientes').text(contadores.pendientes);
    $('#autorizaciones_count_aprobadas').text(contadores.aprobadas);
    $('#autorizaciones_count_rechazadas').text(contadores.rechazadas);

    return contadores;
};

const renderizarAutorizaciones = () => {
    const $lista = $('#list_log_reg');
    const filtro = autorizacionesFiltroActivo || 'pendientes';

    const registrosFiltrados = autorizacionesRegistros.filter(function(reg) {
        return filtro === 'todas' || obtenerEstadoAutorizacion(reg) === filtro;
    });

    // Construimos un solo bloque HTML. Evita múltiples append/reflows en Android WebView.
    var html = registrosFiltrados.map(function(reg) {
        var estado = obtenerEstadoAutorizacion(reg);
        // Las horas se muestran como HH:MM, sin segundos.
        var contenido = horaSinSegundos(String(reg.msg_html || '').trim());
        if (!contenido) return '';

        // El backend ya entrega el HTML de cada tarjeta. Envolvemos una sola vez
        // para conservar el estado requerido por los filtros sin crear objetos jQuery.
        return '<div class="autorizacion-render-item" data-estado-autorizacion="' +
            escaparTextoConsentimiento(estado) + '">' + contenido + '</div>';
    }).join('');

    if (!html) {
        const etiquetasVacias = {
            todas: 'todas las autorizaciones',
            pendientes: 'autorizaciones pendientes',
            aprobadas: 'autorizaciones aprobadas',
            rechazadas: 'autorizaciones rechazadas'
        };
        html = '<li class="autorizaciones-vacio">No hay registro</li>';
    }

    $lista.html(html);

    // Vista minimalista: sin línea de resumen ("N registros · ..."); solo se usa para avisos de carga o error.
    $('#autorizaciones_filtro_resumen').text('');
};

const filtrarAutorizaciones = (filtro) => {
    const filtrosPermitidos = ['todas', 'pendientes', 'aprobadas', 'rechazadas'];

    if (filtrosPermitidos.indexOf(filtro) === -1) {
        filtro = 'pendientes';
    }

    autorizacionesFiltroActivo = filtro;

    $('#autorizaciones_sdi .autorizaciones-filtro')
        .removeClass('active')
        .filter('[data-filtro="' + filtro + '"]')
        .addClass('active');

    $('#autorizaciones_btn_filtro').toggleClass('con-filtro', filtro !== 'todas');
    cerrarFiltroAutorizaciones();

    renderizarAutorizaciones();
};

// Botón de filtro + hoja inferior con los estados (vista Mis autorizaciones)
const abrirFiltroAutorizaciones = () => { $('#autorizaciones_filtro_sheet').addClass('sheet-abierta'); };
const cerrarFiltroAutorizaciones = () => { $('#autorizaciones_filtro_sheet').removeClass('sheet-abierta'); };

var listLogDeviceEnCurso = false;
var listLogDeviceUltimaCarga = 0;
var listLogDeviceCacheMs = 10000;

const list_log_device = (forzar) => {

    var ahora = Date.now();
    forzar = forzar === true;

    // Evitar solicitudes simultáneas.
    if (listLogDeviceEnCurso) {
        console.log('[MED-SDI] list_log_device ya está en ejecución.');
        return;
    }

    // Evitar recargas repetidas durante navegación normal.
    if (
        !forzar &&
        listLogDeviceUltimaCarga &&
        (ahora - listLogDeviceUltimaCarga) < listLogDeviceCacheMs
    ) {
        console.log('[MED-SDI] Se omite recarga repetida de autorizaciones.');
        renderizarAutorizaciones();
        return;
    }

    listLogDeviceEnCurso = true;
    var requestId = ++listLogDeviceRequestId;

    $('#list_log_reg').html(
        '<p class="text-center color-gris mt20">Cargando autorizaciones...</p>'
    );
    $('#autorizaciones_filtro_resumen').text('Actualizando autorizaciones...');

    var api = new Api("mobile-authorization", "requests");

    api.request(
        {},
        function (resp) {
            listLogDeviceEnCurso = false;

            if (requestId !== listLogDeviceRequestId) {
                return;
            }

            listLogDeviceUltimaCarga = Date.now();

            LOG('list log device:' + resp.estado);
            console.log('[MED-SDI] Autorizaciones respuesta:', resp);

            autorizacionesRegistros = (
                resp.estado == 1 && Array.isArray(resp.registros)
            ) ? resp.registros : [];

            actualizarContadoresAutorizaciones();
            filtrarAutorizaciones(autorizacionesFiltroActivo);
        },
        function (xhr, status, error) {
            listLogDeviceEnCurso = false;

            if (requestId !== listLogDeviceRequestId) {
                return;
            }

            console.error('[MED-SDI] AUTORIZACIONES ERROR', {
                status: xhr ? xhr.status : null,
                responseText: xhr ? xhr.responseText : null,
                responseJSON: xhr ? xhr.responseJSON : null,
                ajaxStatus: status,
                error: error,
                api: typeof MEDSDI_API_URL !== 'undefined' ? MEDSDI_API_URL : ''
            });

            var mensaje = 'No fue posible cargar las autorizaciones.';

            if (xhr && xhr.status === 429) {
                listLogDeviceUltimaCarga = Date.now();
                mensaje = 'Se realizaron demasiadas solicitudes. Espera unos segundos antes de volver a actualizar.';
            } else if (xhr && xhr.status === 401) {
                mensaje = 'Tu sesión expiró. Inicia sesión nuevamente.';
            } else if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
                mensaje = xhr.responseJSON.message;
            } else if (xhr && xhr.status) {
                mensaje += ' HTTP ' + xhr.status;
            } else {
                mensaje += ' El servidor no respondió.';
            }

            // No borramos autorizaciones ya cargadas por un error temporal.
            if (!autorizacionesRegistros.length) {
                actualizarContadoresAutorizaciones();

                $('#autorizaciones_filtro_resumen').text('');
                $('#list_log_reg').html(
                    '<li class="autorizaciones-vacio color-rojo">' +
                        escaparTextoConsentimiento(mensaje) +
                    '</li>'
                );
            } else {
                renderizarAutorizaciones();
                $('#autorizaciones_filtro_resumen').text(
                    'No se pudo actualizar. Mostrando la última información disponible.'
                );
            }

            msg(
                'Mis autorizaciones',
                mensaje,
                xhr && xhr.status === 429 ? 'warning' : 'error'
            );
        },
        "GET"
    );
};


const getSession = (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
}
var accion_log_actual = null;

function abrir_autorizacion_log(id_log, accion, btn) {

    accion_log_actual = accion;

    let msg = $(btn)
        .closest('.log-card')
        .find('.msg_estado_log')
        .html() || '';

    // El detalle, el ID y el PIN pertenecen exclusivamente a #autorizacion.
    // Antes se reutilizaban IDs presentes en otras páginas y el .html(msg)
    // podía eliminar el input del PIN por la estructura HTML mal cerrada.
    $('#autorizacion #id_log_autorizacion').val(id_log);
    $('#autorizacion #log_reg_autorizacion_detalle').html(msg);
    $('#autorizacion #password_').val('');

    vista('autorizacion', 'fade');

    setTimeout(function () {
        $('#autorizacion #password_').trigger('focus');
    }, 250);
}

document.addEventListener('error', function(ev) {
    var img = ev.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.avatarRespaldo) return;
    if (!img.matches('.dashboard-user img, #perfil_menu_foto, #perfil_app_foto_preview')) return;
    img.dataset.avatarRespaldo = '1';
    img.src = 'src/images/avatar-generico.svg';
}, true);


// Mis mascotas (tutor)
// MODO DEMO: mientras el backend no entregue mascotas, se muestra una de ejemplo ("Michi") con
// datos inventados para ver las pantallas cargadas. Poner en false (o borrar) para producción.
const MODO_DEMO_MASCOTAS = true;
const MASCOTA_DEMO = {
    mascota: {
        id: 'demo', nombre: 'Michi', especie: 'Felina', raza: 'Doméstico pelo corto', sexo: 'Femenino',
        tamano: 'Mediana', color: 'Atigrado naranjo', fecha_nacimiento: '2024-01-01', peso: '4.2',
        microchip: '981020000123456', esterilizado: 'Sí', vacunacion_al_dia: 'Sí',
        comportamiento: 'Tranquila y sociable', convive_con_otros_animales: 'No'
    },
    resumen: {
        ultima_atencion: '2026-11-03',
        vacunas: [{}, {}, {}], alergias: [{ nombre: 'Pollo' }], desparasitaciones: [{}, {}],
        condicion_cronica: [], tratamientos: [{ nombre: 'Antibiótico por 7 días' }], cirugias: [],
        documentos: [{}, {}],
        atenciones: [
            { fecha: '2026-11-03', profesional: 'Dra. Camila Pérez', diagnostico: 'Control general, sin hallazgos' },
            { fecha: '2026-08-14', profesional: 'Dr. Andrés Rojas', diagnostico: 'Otitis leve' },
            { fecha: '2026-03-10', profesional: 'Dra. Camila Pérez', diagnostico: 'Vacunación anual' }
        ],
        tutor: { rut: '12.345.678-5', nombre: 'Tutor de ejemplo', direccion: 'Av. Siempre Viva 123, Santiago', telefono: '+56 9 1234 5678', email: 'tutor@ejemplo.cl' },
        cotutores: [{ rut: '15.678.901-2', nombre: 'María González', direccion: 'Los Aromos 456, Ñuñoa', telefono: '+56 9 8765 4321', email: 'maria@ejemplo.cl' }]
    },
    vacunas: [
        { edad: '2 meses', fecha: '2024-03-01', dosis: '1ª dosis', nombre: 'Triple felina', num_lote: 'TF-2231', observaciones: 'Sin reacciones' },
        { edad: '3 meses', fecha: '2024-04-01', dosis: '2ª dosis', nombre: 'Triple felina', num_lote: 'TF-2290' },
        { edad: '4 meses', fecha: '2024-05-02', dosis: 'Única', nombre: 'Antirrábica' },
        { edad: '1 año y 11 meses', fecha: '2025-12-01', dosis: 'Refuerzo anual', nombre: 'Triple felina', proxima_dosis: '2026-12-01' }
    ],
    desparasitaciones: [
        { peso: '4.2 kg', ultima_desparasitacion: '2026-05-20', fecha_aplicacion: '2026-11-03', producto: 'Drontal Gatos', tipo: 'Interna', dosis: '1 comprimido', proxima_desparasitacion: '2027-02-03', realizado_por: 'Dra. Camila Pérez' },
        { peso: '4.0 kg', ultima_desparasitacion: '2026-02-10', fecha_aplicacion: '2026-05-20', producto: 'Bravecto Spot-on', tipo: 'Externa', dosis: '0,4 ml', proxima_desparasitacion: '2026-08-20', realizado_por: 'Dr. Andrés Rojas' }
    ]
};

// Íconos de línea de las acciones de cada mascota (Mis mascotas).
const ICONOS_ACCION_MASCOTA = {
    fvu: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9.5 4V2.8h5V4"/><path d="M8.5 13h2l1.4-2.8 2 5.6 1.4-2.8h.2"/>',
    documentos: '<path d="M7 3h7l5 5v12.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5z"/><path d="M14 3v5h5M10 13h5M10 16.5h5"/>',
    carne: '<path d="M18 2l4 4M20 4l-3 3M14 8l-9 9v3h3l9-9M12 6l6 6M7 15l2 2"/>',
    perdida: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><circle cx="10.5" cy="11.6" r="1.6"/><path d="M8.3 8.6v.01M10.5 7.6v.01M12.7 8.6v.01"/>',
    traspasar: '<path d="M4 8h14M14.5 4.5L18 8l-3.5 3.5"/><path d="M20 16H6M9.5 12.5L6 16l3.5 3.5"/>',
    fallecimiento: '<path d="M8 21h8M10 21v-9.5h4V21"/><path d="M12 8.5c-1.6-1.3-1.5-3 0-5 1.5 2 1.6 3.7 0 5z"/>'
};

const botonAccionMascota = (accion, texto, clase) =>
    '<button type="button" data-role="none"' + (clase ? ' class="' + clase + '"' : '') + ' onclick="accionMascota(\'' + accion + '\',this)">' +
        '<span class="mascota-accion-icono"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS_ACCION_MASCOTA[accion] + '</svg></span>' +
        '<span class="mascota-accion-texto">' + texto + '</span>' +
    '</button>';

const cargarMisMascotas = () => {
    var $lista = $('#lista-mis-mascotas');
    $lista.html('<div class="mis-pacientes-vacio">Cargando mascotas...</div>');
    var api = new Api('paciente', 'mis_mascotas_app');
    var alExito = function(resp) {
        var mascotas = resp && Array.isArray(resp.mascotas) ? resp.mascotas : [];
        if (!mascotas.length && MODO_DEMO_MASCOTAS) mascotas = [MASCOTA_DEMO.mascota];
        if (!mascotas.length) {
            $lista.html('<div class="mis-pacientes-vacio">No hay registro</div>');
            return;
        }
        var html = '';
        mascotas.forEach(function(mascota, i) {
            var nombre = escaparTextoConsentimiento(mascota.nombre || 'Mascota');
            var especie = escaparTextoConsentimiento(mascota.especie || 'Sin especie');
            var detalle = mascota.sexo ? 'Sexo: ' + escaparTextoConsentimiento(String(mascota.sexo).charAt(0).toUpperCase()) : '';
            var foto = mascota.foto || mascota.foto_url || '';
            var avatar = foto
                ? '<img src="' + escaparTextoConsentimiento(foto) + '" alt="" onerror="this.remove()">'
                : '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
            var idm = escaparTextoConsentimiento(String(mascota.id || mascota.id_paciente || i));
            mascotasPorId[idm] = mascota;
            html += '<article class="mascota-card" data-id="' + idm + '">' +
                '<div class="mascota-card-cabecera">' +
                    '<div class="mascota-card-avatar">' + avatar + '</div>' +
                    '<div class="mascota-card-datos"><h3>' + nombre + '</h3>' +
                    '<span class="mascota-card-especie">Especie: ' + especie + '</span>' +
                    (detalle ? '<small>' + detalle + '</small>' : '') + '</div>' +
                    '<button type="button" data-role="none" class="mascota-card-toggle" aria-expanded="false" onclick="alternarAccionesMascota(this)">' +
                        'Acciones<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
                '</div>' +
                '<div class="mascota-card-acciones">' +
                    botonAccionMascota('fvu', 'FVU') +
                    botonAccionMascota('documentos', 'Mis documentos') +
                    botonAccionMascota('carne', 'Vacunas y desparasitación') +
                    botonAccionMascota('perdida', 'Mascota perdida', 'mascota-btn-perdida') +
                    botonAccionMascota('traspasar', 'Traspasar', 'mascota-btn-traspasar') +
                    botonAccionMascota('fallecimiento', 'Registrar fallecimiento', 'mascota-btn-fallecimiento') +
                '</div></article>';
        });
        $lista.html(html);
    };
    api.request({}, alExito, function() {
        if (MODO_DEMO_MASCOTAS) { alExito({ mascotas: [] }); return; }
        $lista.html('<div class="mis-pacientes-vacio mis-pacientes-error">No fue posible cargar tus mascotas.</div>');
    });
};

$(document).on('pageshow', '#mis-mascotas', cargarMisMascotas);

// Agendar hora: select "¿Para quién es la hora?" con las mascotas del tutor.
const cargarMascotasAgenda = () => {
    var $sel = $('#agendar_mascota');
    window.mascotaAgenda = '';
    $sel.html('<option value="">Cargando mascotas...</option>');
    var api = new Api('paciente', 'mis_mascotas_app');
    var alExito = function(resp) {
        var mascotas = resp && Array.isArray(resp.mascotas) ? resp.mascotas : [];
        if (!mascotas.length && MODO_DEMO_MASCOTAS) mascotas = [MASCOTA_DEMO.mascota];
        if (!mascotas.length) {
            $sel.html('<option value="">No tienes mascotas registradas</option>');
            return;
        }
        var opts = '<option value="">Seleccione mascota</option>';
        mascotas.forEach(function(m, i) {
            var id = escaparTextoConsentimiento(String(m.id || m.id_paciente || i));
            opts += '<option value="' + id + '" data-especie="' + escaparTextoConsentimiento(m.especie || '') + '" data-raza="' + escaparTextoConsentimiento(m.raza || '') + '">' + escaparTextoConsentimiento(m.nombre || 'Mascota') + '</option>';
        });
        $sel.html(opts);
    };
    api.request({}, alExito, function() {
        if (MODO_DEMO_MASCOTAS) { alExito({ mascotas: [] }); return; }
        $sel.html('<option value="">No fue posible cargar tus mascotas</option>');
    });
};

$(document).on('pageshow', '#pedirhora', cargarMascotasAgenda);

// La cita es para una mascota: se recuerda localmente (por id de hora) para
// mostrarla en la card mientras el backend no la devuelva en la respuesta.
const mascotaDeCita = (idHora) => {
    try { return JSON.parse(localStorage.getItem('cita_mascota_' + idHora) || 'null'); } catch (e) { return null; }
};

const guardarMascotaDeCita = (idHora) => {
    var $op = $('#agendar_mascota option:selected');
    if (!idHora || !$op.length || !$op.val()) return;
    try {
        localStorage.setItem('cita_mascota_' + idHora, JSON.stringify({
            id: $op.val(), nombre: $op.text(), especie: $op.data('especie') || '', raza: $op.data('raza') || ''
        }));
    } catch (e) {}
};

const validarMascotaAgenda = () => {
    if (window.mascotaAgenda) return true;
    msg('Agendar hora', 'Selecciona para qué mascota agendarás la hora.', 'warning');
    return false;
};

// ===== Registrar fallecimiento de la mascota =====
// Mismos campos que el modal de vetsdi_laravel13 (fallecimiento_mascota): fecha*, causa, mensaje,
// incluir fotos de la ficha y fotos extra para el álbum memorial.
var fotosFallecimiento = [];

const abrirFallecimientoMascota = (idMascota) => {
    var m = mascotasPorId[String(idMascota)] || {};
    var foto = m.foto || m.foto_url || '';
    var pata = '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
    $('#form-fallecimiento')[0].reset();
    $('#fallecimiento_mascota_id').val(idMascota);
    $('#fallecimiento_nombre').text(m.nombre || 'Mascota');
    $('#fallecimiento_foto').html(foto ? '<img src="' + escaparTextoConsentimiento(foto) + '" alt="" onerror="this.remove()">' : pata);
    var hoy = hoyIsoHome();
    $('#fallecimiento_fecha').attr('max', hoy);
    fotosFallecimiento = [];
    pintarMiniaturasFallecimiento();
};

const pintarMiniaturasFallecimiento = () => {
    $('#fallecimiento_fotos_texto').text(fotosFallecimiento.length ? 'Agregar más fotos' : 'Agregar fotos');
    $('#fallecimiento_miniaturas').html(fotosFallecimiento.map(function(f, i) {
        return '<div class="fallecimiento-mini"><img src="' + f.url + '" alt="">' +
            '<button type="button" data-role="none" aria-label="Quitar foto" onclick="quitarFotoFallecimiento(' + i + ')">×</button></div>';
    }).join(''));
};

const quitarFotoFallecimiento = (i) => {
    var f = fotosFallecimiento.splice(i, 1)[0];
    if (f) URL.revokeObjectURL(f.url);
    pintarMiniaturasFallecimiento();
};

// El servicio para registrar el fallecimiento desde la app aún no existe en el backend.
// Cuando esté disponible, enviar `datos` (con `fotos` como archivos) en lugar del aviso.
const confirmarFallecimientoMascota = (evento) => {
    if (evento) evento.preventDefault();
    var datos = {
        id_mascota: $('#fallecimiento_mascota_id').val(),
        fecha_fallecimiento: $('#fallecimiento_fecha').val(),
        causa: $.trim($('#fallecimiento_causa').val()),
        mensaje_despedida: $.trim($('#fallecimiento_mensaje').val()),
        incluir_fotos_actuales: $('#fallecimiento_incluir_fotos').prop('checked'),
        fotos: fotosFallecimiento.map(function(f) { return f.archivo; })
    };
    if (!datos.fecha_fallecimiento) { msg('Registrar fallecimiento', 'Indica la fecha de fallecimiento.', 'warning'); return false; }
    if (datos.fecha_fallecimiento > hoyIsoHome()) { msg('Registrar fallecimiento', 'La fecha no puede ser futura.', 'warning'); return false; }
    msg('Registrar fallecimiento', 'El registro de fallecimiento desde la app aún no está habilitado.', 'warning');
    return false;
};

// ===== Mascotas perdidas (basado en vetsdi_laravel13: Paciente/Mascotas_Perdidas) =====
// Respuesta esperada de GET paciente/mascotas_perdidas_app:
// { avisos: [{ id, estado:'perdida'|'encontrada', nombre, especie, raza, foto, fotos[], recompensa,
//              region_id, comuna_id, comuna, fecha, direccion, detalle, tutor, propio }],
//   mis_avisos: [{ id, estado, nombre, especie, raza, foto, direccion, fecha, cerrado_en,
//                  respuestas: [{ id, tipo:'la_vio'|'la_tiene'|'es_mia', tutor, fecha, lugar, mensaje,
//                                 mascota_nombre, sena, telefono, contacto_compartido_en }] }] }
var avisosPerdidas = [];
var misAvisosPerdidas = [];
var avisoContactoActual = null;
var mascotaPerdidaElegida = null;
var modoPublicarPerdida = 'perdida';
var galeriaPerdida = { fotos: [], i: 0 };

const MASCOTAS_PERDIDAS_DEMO = {
    avisos: [
        { id: 'd1', estado: 'perdida', nombre: 'Rocky', especie: 'Perro', raza: 'Mestizo', foto: '', fotos: [], recompensa: 50000,
          region_id: '13', comuna_id: '1', comuna: 'Providencia', fecha: '08-11-2026', direccion: 'Av. Providencia 1234, Santiago',
          detalle: 'Collar rojo con chapita. Muy cariñoso, responde a su nombre. Se escapó al abrir el portón.', tutor: 'Camila R.', propio: false },
        { id: 'd2', estado: 'encontrada', nombre: 'Sin nombre', especie: 'Gato', raza: 'Doméstico', foto: '', fotos: [], recompensa: 0,
          region_id: '13', comuna_id: '2', comuna: 'Ñuñoa', fecha: '09-11-2026', direccion: 'Plaza Ñuñoa, Santiago',
          detalle: 'Gato atigrado encontrado cerca de la plaza, sin collar. Está bien y con comida.', tutor: 'Andrés P.', propio: false },
        { id: 'd3', estado: 'perdida', nombre: 'Michi', especie: 'Gato', raza: 'Doméstico pelo corto', foto: '', fotos: [], recompensa: 0,
          region_id: '13', comuna_id: '1', comuna: 'Providencia', fecha: '10-11-2026', direccion: 'Calle Los Leones 55, Providencia',
          detalle: 'Gata atigrada naranja, esterilizada, con microchip.', tutor: 'Tutor de ejemplo', propio: true }
    ],
    mis_avisos: [
        { id: 'd3', estado: 'perdida', nombre: 'Michi', especie: 'Gato', raza: 'Doméstico pelo corto', foto: '', direccion: 'Calle Los Leones 55, Providencia',
          fecha: '10-11-2026', cerrado_en: null,
          respuestas: [
              { id: 'r1', tipo: 'la_vio', tutor: 'Marcela T.', fecha: '10-11-2026 18:20', lugar: 'Pasaje Los Olmos, Providencia',
                mensaje: 'La vi hace un rato cerca de la panadería, iba hacia la plaza.', mascota_nombre: '', sena: '', telefono: '', contacto_compartido_en: null }
          ] }
    ],
    regiones: [{ id: '13', nombre: 'Región Metropolitana' }],
    comunas: [{ id: '1', nombre: 'Providencia' }, { id: '2', nombre: 'Ñuñoa' }]
};

const iconoPataPerdida = '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
const fotoOPataPerdida = (foto) => foto ? '<img src="' + escaparTextoConsentimiento(foto) + '" alt="" onerror="this.remove()">' : iconoPataPerdida;

// Regiones y comunas (mismos servicios que el buscador de profesionales, sin loader global).
const cargarRegionesSelect = (idSelect, primera, alTerminar) => {
    var api = new Api('paciente', 'dame_regiones');
    var pintar = function(regiones) {
        $('#' + idSelect).html('<option value="">' + primera + '</option>' + regiones.map(function(r) {
            return '<option value="' + escaparTextoConsentimiento(String(r.id)) + '">' + escaparTextoConsentimiento(r.nombre) + '</option>';
        }).join(''));
        if (alTerminar) alTerminar();
    };
    api.request({}, function(resp) {
        var regiones = resp && resp.estado == 1 && Array.isArray(resp.regiones) ? resp.regiones : [];
        if (!regiones.length && MODO_DEMO_MASCOTAS) regiones = MASCOTAS_PERDIDAS_DEMO.regiones;
        pintar(regiones);
    }, function() { pintar(MODO_DEMO_MASCOTAS ? MASCOTAS_PERDIDAS_DEMO.regiones : []); }, 'GET');
};

const cargarComunasSelect = (idComuna, idRegion, primera, alTerminar) => {
    var region = $('#' + idRegion).val();
    var $sel = $('#' + idComuna);
    $sel.html('<option value="">' + primera + '</option>');
    if (!region) { if (alTerminar) alTerminar(); return; }
    var pintar = function(ciudades) {
        $sel.html('<option value="">' + primera + '</option>' + ciudades.map(function(c) {
            return '<option value="' + escaparTextoConsentimiento(String(c.id)) + '">' + escaparTextoConsentimiento(c.nombre) + '</option>';
        }).join(''));
        if (alTerminar) alTerminar();
    };
    var api = new Api('paciente', 'dame_ciudades');
    api.request({ id_region: region }, function(resp) {
        var ciudades = resp && resp.estado == 1 && Array.isArray(resp.ciudades) ? resp.ciudades : [];
        if (!ciudades.length && MODO_DEMO_MASCOTAS) ciudades = MASCOTAS_PERDIDAS_DEMO.comunas;
        pintar(ciudades);
    }, function() { pintar(MODO_DEMO_MASCOTAS ? MASCOTAS_PERDIDAS_DEMO.comunas : []); }, 'GET');
};

// Carga las mascotas del tutor en `mascotasPorId` (con la mascota de ejemplo en modo demo).
const asegurarMascotasTutor = (alTerminar) => {
    if (Object.keys(mascotasPorId).length) { alTerminar(); return; }
    var api = new Api('paciente', 'mis_mascotas_app');
    var fin = function(lista) {
        if (!lista.length && MODO_DEMO_MASCOTAS) lista = [MASCOTA_DEMO.mascota];
        lista.forEach(function(m, i) { mascotasPorId[String(m.id || m.id_paciente || i)] = m; });
        alTerminar();
    };
    api.request({}, function(resp) { fin(resp && Array.isArray(resp.mascotas) ? resp.mascotas : []); }, function() { fin([]); });
};

// ----- Lista de avisos -----
const abrirMascotasPerdidas = () => {
    vista('mascotas-perdidas');
    mostrarPanelPerdidas('red');
    cargarRegionesSelect('filtro_region', 'Todas');
    $('#filtro_comuna').html('<option value="">Todas</option>');
    $('#filtro_estado').val('');
    $('#perdidas_ubicacion').hide();
    alternarFiltrosPerdidas(false);
    $('#perdidas_lista').html('<div class="mis-pacientes-vacio">Cargando avisos...</div>');
    var api = new Api('paciente', 'mascotas_perdidas_app');
    var fin = function(resp) {
        avisosPerdidas = resp && Array.isArray(resp.avisos) ? resp.avisos : [];
        misAvisosPerdidas = resp && Array.isArray(resp.mis_avisos) ? resp.mis_avisos : [];
        if (!avisosPerdidas.length && !misAvisosPerdidas.length && MODO_DEMO_MASCOTAS) {
            avisosPerdidas = MASCOTAS_PERDIDAS_DEMO.avisos;
            misAvisosPerdidas = MASCOTAS_PERDIDAS_DEMO.mis_avisos;
        }
        var especies = avisosPerdidas.map(function(a) { return a.especie; }).filter(function(e, i, arr) { return e && arr.indexOf(e) === i; }).sort();
        $('#filtro_especie').html('<option value="">Todas</option>' + especies.map(function(e) {
            return '<option value="' + escaparTextoConsentimiento(e) + '">' + escaparTextoConsentimiento(e) + '</option>';
        }).join(''));
        pintarMisAvisosPerdidas();
        filtrarAvisosPerdidas();
    };
    api.request({}, fin, function() { fin(null); });
};

const alCambiarRegionFiltroPerdidas = () => {
    cargarComunasSelect('filtro_comuna', 'filtro_region', 'Todas', filtrarAvisosPerdidas);
    filtrarAvisosPerdidas();
};

const filtrarAvisosPerdidas = () => {
    var estado = $('#filtro_estado').val(), especie = $('#filtro_especie').val();
    var region = $('#filtro_region').val(), comuna = $('#filtro_comuna').val();
    var activos = [estado, especie, region, comuna].filter(Boolean).length;
    $('#perdidas_filtros_num').text(activos).toggle(activos > 0);
    var esc = escaparTextoConsentimiento;
    var visibles = avisosPerdidas.map(function(a, i) { return { a: a, i: i }; }).filter(function(x) {
        var a = x.a;
        return (!estado || a.estado === estado) && (!especie || a.especie === especie) &&
            (!region || String(a.region_id) === String(region)) && (!comuna || String(a.comuna_id) === String(comuna));
    });
    $('#perdidas_vacio').toggle(visibles.length === 0);
    $('#perdidas_total').text(visibles.length === 1 ? '1 aviso' : visibles.length + ' avisos');
    $('#perdidas_lista').html(visibles.map(function(x) {
        var a = x.a, perdida = a.estado === 'perdida';
        var fotos = Array.isArray(a.fotos) ? a.fotos : [];
        return '<article class="aviso-perdida ' + esc(a.estado) + '">' +
            cabeceraAvisoPerdida(a, perdida ? 'perdida' : 'encontrada', perdida ? 'Perdida' : 'Encontrada') +
            '<ul class="aviso-perdida-meta">' +
                filaMetaPerdida(ICONOS_PERDIDA.pin, a.comuna || a.direccion || 'Sin ubicación', a.comuna ? a.direccion : '') +
                filaMetaPerdida(ICONOS_PERDIDA.fecha, a.fecha || '-', perdida ? 'Fecha en que se perdió' : 'Fecha en que se encontró') +
            '</ul>' +
            (a.detalle ? '<p class="aviso-perdida-detalle">' + esc(a.detalle) + '</p>' : '') +
            '<div class="aviso-perdida-pie">' +
                (a.recompensa ? '<span class="aviso-perdida-recompensa">' + ICONOS_PERDIDA.premio + 'Recompensa $' + esc(Number(a.recompensa).toLocaleString('es-CL')) + '</span>' : '') +
                (fotos.length ? '<button type="button" data-role="none" class="aviso-perdida-fotos" onclick="abrirGaleriaPerdida(' + x.i + ')">' + ICONOS_PERDIDA.camara + fotos.length + (fotos.length === 1 ? ' foto' : ' fotos') + '</button>' : '') +
                (a.propio ? '<span class="aviso-perdida-propio">Tu aviso</span>'
                          : '<button type="button" data-role="none" class="aviso-perdida-accion" onclick="abrirContactoAviso(' + x.i + ')">' + (perdida ? 'La he visto' : 'Es mi mascota') + '</button>') +
            '</div></article>';
    }).join(''));
};

// Íconos de línea (heredan el color del texto)
const ICONOS_PERDIDA = (function() {
    var svg = function(d) { return '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
    return {
        pin: svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
        fecha: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
        camara: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
        premio: svg('<circle cx="12" cy="9" r="5"/><path d="M8.5 13L7 21l5-3 5 3-1.5-8"/>'),
        check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
        compartir: svg('<path d="M6.6 3.5h2.6l1.3 4.2-1.8 1.4a12 12 0 0 0 6.2 6.2l1.4-1.8 4.2 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>'),
        chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
        mapa: svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
        pata: svg('<circle cx="7" cy="10" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="16" cy="7.5" r="1.8"/><circle cx="18" cy="12" r="1.8"/><path d="M8.5 17.5c0-2.5 2-4.5 4-4.5s3.5 1.5 3.5 3.5-1.5 2.5-3.5 2.5-4 .5-4-1.5z"/>')
    };
})();

const filaMetaPerdida = (icono, titulo, detalle) => {
    var esc = escaparTextoConsentimiento;
    return '<li><span class="aviso-meta-ico">' + icono + '</span><span class="aviso-meta-txt"><b>' + esc(titulo) + '</b>' +
        (detalle ? '<small>' + esc(detalle) + '</small>' : '') + '</span></li>';
};

const cabeceraAvisoPerdida = (a, claseEstado, textoEstado) => {
    var esc = escaparTextoConsentimiento;
    return '<div class="aviso-perdida-cab ' + claseEstado + '">' +
        '<div class="aviso-perdida-avatar">' + fotoOPataPerdida(a.foto) + '</div>' +
        '<div class="aviso-perdida-titulo"><h3>' + esc(a.nombre || 'Sin nombre') + '</h3><small>' + esc([a.especie, a.raza].filter(Boolean).join(' · ')) + '</small></div>' +
        '<span class="aviso-perdida-estado ' + claseEstado + '">' + textoEstado + '</span>' +
    '</div>';
};

// ----- Galería de fotos del aviso -----
const abrirGaleriaPerdida = (i) => {
    var a = avisosPerdidas[i]; if (!a || !(a.fotos || []).length) return;
    galeriaPerdida = { fotos: a.fotos, i: 0 };
    moverGaleriaPerdida(0);
    $('#perdidas_galeria').css('display', 'flex');
};
const moverGaleriaPerdida = (d, ev) => {
    if (ev) ev.stopPropagation();
    var g = galeriaPerdida;
    g.i = (g.i + d + g.fotos.length) % g.fotos.length;
    $('#perdidas_galeria_img').attr('src', g.fotos[g.i]);
    $('#perdidas_galeria_pos').text((g.i + 1) + ' / ' + g.fotos.length);
};
const cerrarGaleriaPerdida = () => { $('#perdidas_galeria').hide(); };

// ----- Pestañas -----
const alternarFiltrosPerdidas = (abrir) => {
    var $f = $('#perdidas_filtros');
    var mostrar = typeof abrir === 'boolean' ? abrir : !$f.is(':visible');
    $f.toggle(mostrar);
    $('#perdidas_btn_filtros').toggleClass('activo', mostrar).attr('aria-expanded', mostrar ? 'true' : 'false');
};

const mostrarPanelPerdidas = (panel) => {
    $('#perdidas_pill_red').toggleClass('activo', panel === 'red');
    $('#perdidas_pill_mis').toggleClass('activo', panel === 'mis');
    $('#perdidas_panel_red').toggle(panel === 'red');
    $('#perdidas_panel_mis').toggle(panel === 'mis');
};

// ----- Mis avisos y respuestas recibidas -----
const TIPOS_RESPUESTA_PERDIDA = { la_tiene: 'La tiene con él/ella', la_vio: 'La vio', es_mia: 'Es mi mascota' };

const pintarMisAvisosPerdidas = () => {
    var esc = escaparTextoConsentimiento;
    var sinCompartir = 0;
    misAvisosPerdidas.forEach(function(m) { (m.respuestas || []).forEach(function(r) { if (!r.contacto_compartido_en) sinCompartir++; }); });
    $('#perdidas_badge').text(sinCompartir).toggle(sinCompartir > 0);
    if (!misAvisosPerdidas.length) { $('#perdidas_mis_avisos').html('<div class="mis-pacientes-vacio">No hay registro</div>'); return; }
    $('#perdidas_mis_avisos').html(misAvisosPerdidas.map(function(m) {
        var perdida = m.estado === 'perdida', resp = m.respuestas || [];
        return '<section class="mi-aviso">' +
            cabeceraAvisoPerdida(m, m.cerrado_en ? 'cerrado' : (perdida ? 'perdida' : 'encontrada'), m.cerrado_en ? 'Cerrado' : (perdida ? 'Perdida' : 'Encontrada')) +
            '<ul class="aviso-perdida-meta">' +
                filaMetaPerdida(ICONOS_PERDIDA.pin, m.comuna || m.direccion || 'Sin ubicación', m.comuna ? m.direccion : '') +
                filaMetaPerdida(ICONOS_PERDIDA.fecha, m.fecha || '-', perdida ? 'Fecha en que se perdió' : 'Fecha en que se encontró') +
            '</ul>' +
            (!m.cerrado_en ? '<button type="button" data-role="none" class="perdidas-boton mi-aviso-cerrar" onclick="cerrarAvisoPerdida(\'' + esc(String(m.id)) + '\')">' + ICONOS_PERDIDA.check + (perdida ? 'Ya la encontré' : 'Ya encontró su familia') + '</button>' : '') +
            '<button type="button" data-role="none" class="mi-aviso-sub" aria-expanded="false" onclick="alternarRespuestasPerdida(this)">' +
                'Respuestas recibidas <span class="mi-aviso-num' + (resp.length ? ' hay' : '') + '">' + resp.length + '</span>' +
                '<svg class="pi mi-aviso-flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="mi-aviso-respuestas" style="display:none">' +
            (resp.length ? resp.map(function(r) {
                return '<article class="respuesta-aviso"><div class="respuesta-cab">' +
                    '<div class="respuesta-quien"><strong>' + esc(r.tutor) + '</strong><small>' + esc(r.fecha) + '</small></div><span class="respuesta-tipo">' + esc(TIPOS_RESPUESTA_PERDIDA[r.tipo] || '') + '</span></div>' +
                    (r.mensaje ? '<p class="respuesta-mensaje">' + esc(r.mensaje) + '</p>' : '') +
                    (r.lugar ? '<p class="respuesta-dato">' + ICONOS_PERDIDA.pin + '<span>' + esc(r.lugar) + '</span></p>' : '') +
                    (r.mascota_nombre ? '<p class="respuesta-dato">' + ICONOS_PERDIDA.pata + '<span>Mascota registrada: ' + esc(r.mascota_nombre) + '</span></p>' : '') +
                    (r.sena ? '<p class="respuesta-dato">' + ICONOS_PERDIDA.chat + '<span>Seña particular: ' + esc(r.sena) + '</span></p>' : '') +
                    '<div class="respuesta-acciones">' +
                    (r.lugar ? '<a class="perdidas-boton" target="_system" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.lugar) + '">' + ICONOS_PERDIDA.mapa + 'Ver mapa</a>' : '') +
                    (r.telefono ? '<a class="perdidas-boton primario" target="_system" href="https://wa.me/' + esc(String(r.telefono).replace(/\D/g, '')) + '">' + ICONOS_PERDIDA.chat + 'Contactar</a>' : '') +
                    (!r.contacto_compartido_en ? '<button type="button" data-role="none" class="perdidas-boton primario" onclick="compartirContactoPerdida(\'' + esc(String(r.id)) + '\')">' + ICONOS_PERDIDA.compartir + 'Compartir contacto</button>'
                                              : '<span class="respuesta-ok">' + ICONOS_PERDIDA.check + 'Contacto compartido</span>') +
                    '</div></article>';
            }).join('') : '<div class="perdidas-sin-respuestas">No hay registro</div>') +
            '</div>' +
            '</section>';
    }).join(''));
};

const alternarRespuestasPerdida = (boton) => {
    var $b = $(boton), abrir = $b.attr('aria-expanded') !== 'true';
    $b.attr('aria-expanded', abrir ? 'true' : 'false').toggleClass('abierto', abrir);
    $b.next('.mi-aviso-respuestas').toggle(abrir);
};

// Cerrar aviso y compartir contacto: servicios aún no disponibles en el backend.
const cerrarAvisoPerdida = () => msg('Cerrar aviso', 'Esta acción desde la app aún no está habilitada.', 'warning');
const compartirContactoPerdida = () => msg('Compartir contacto', 'Esta acción desde la app aún no está habilitada.', 'warning');

// ----- Cerca de mí (ubicación → región y comuna) -----
const normalizarTextoPerdida = (t) => (t || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\bregion\b|\bde\b|\bdel\b|\bla\b/g, '').replace(/[^a-z0-9]/g, '');

const buscarOpcionPerdida = (idSelect, candidatos) => {
    var encontrada = null;
    [true, false].forEach(function(exacto) {
        if (encontrada) return;
        candidatos.forEach(function(c) {
            var buscado = normalizarTextoPerdida(c);
            if (!buscado || encontrada) return;
            $('#' + idSelect + ' option').each(function() {
                var nombre = normalizarTextoPerdida($(this).text());
                if (!this.value || !nombre) return;
                if (nombre === buscado || (!exacto && (nombre.indexOf(buscado) !== -1 || buscado.indexOf(nombre) !== -1))) { encontrada = this.value; return false; }
            });
        });
    });
    return encontrada;
};

const estadoUbicacionPerdidas = (texto, error) => $('#perdidas_ubicacion').toggleClass('error', !!error).text(texto).show();

const cercaDeMiPerdidas = () => {
    var $btn = $('#perdidas_cerca');
    if (!navigator.geolocation) { estadoUbicacionPerdidas('Tu dispositivo no permite obtener la ubicación. Elige la región y comuna a mano.', true); return; }
    $btn.prop('disabled', true);
    estadoUbicacionPerdidas('Buscando tu ubicación...');
    navigator.geolocation.getCurrentPosition(function(pos) {
        $.getJSON('https://nominatim.openstreetmap.org/reverse', { format: 'json', lat: pos.coords.latitude, lon: pos.coords.longitude, 'accept-language': 'es', zoom: 14 })
            .done(function(datos) {
                var d = (datos && datos.address) || {};
                var region = buscarOpcionPerdida('filtro_region', [d.state, d.region]);
                if (!region) { $btn.prop('disabled', false); estadoUbicacionPerdidas('No pudimos reconocer tu región. Elígela a mano.', true); return; }
                $('#filtro_region').val(region);
                cargarComunasSelect('filtro_comuna', 'filtro_region', 'Todas', function() {
                    var comuna = buscarOpcionPerdida('filtro_comuna', [d.municipality, d.city, d.town, d.village, d.city_district, d.suburb, d.county]);
                    $btn.prop('disabled', false);
                    if (comuna) { $('#filtro_comuna').val(comuna); estadoUbicacionPerdidas('Mostrando avisos cerca de ti.'); }
                    else estadoUbicacionPerdidas('Encontramos tu región, pero no la comuna. Elígela en la lista.', true);
                    filtrarAvisosPerdidas();
                });
            }).fail(function() { $btn.prop('disabled', false); estadoUbicacionPerdidas('No pudimos consultar tu ubicación en este momento.', true); });
    }, function(e) {
        $btn.prop('disabled', false);
        estadoUbicacionPerdidas(e && e.code === 1 ? 'El permiso de ubicación está bloqueado. Elige la región y comuna a mano.' : 'No fue posible obtener tu ubicación.', true);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
};

// Dirección desde la ubicación actual (para publicar y para responder).
const usarUbicacionPerdida = (idDireccion, idLat, idLng) => {
    if (!navigator.geolocation) { msg('Ubicación', 'Tu dispositivo no permite obtener la ubicación. Escribe el lugar.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        $('#' + idLat).val(lat); $('#' + idLng).val(lng);
        $.getJSON('https://nominatim.openstreetmap.org/reverse', { format: 'json', lat: lat, lon: lng, 'accept-language': 'es' })
            .done(function(d) { if (d && d.display_name) $('#' + idDireccion).val(d.display_name); });
    }, function() { msg('Ubicación', 'No pudimos obtener tu ubicación. Escribe el lugar.', 'warning'); }, { enableHighAccuracy: true, timeout: 10000 });
};

// ----- Publicar mascota perdida / encontrada -----
// `idMascota`: si viene (desde Mis mascotas) se salta la selección de mascota.
const abrirPublicarPerdida = (modo, idMascota) => {
    modoPublicarPerdida = modo || 'perdida';
    var encontrada = modoPublicarPerdida === 'encontrada';
    $('#form-perdida')[0].reset();
    limpiarFotosPerdida();
    mascotaPerdidaElegida = null;
    $('#perdida_titulo').text(encontrada ? 'Publicar mascota encontrada' : 'Publicar mascota perdida');
    $('#perdida_direccion_texto').text(encontrada ? 'Dirección donde se encontró' : 'Dirección donde se perdió');
    $('#perdida_datos_encontrada').toggle(encontrada);
    $('#perdida_bloque_recompensa').toggle(!encontrada);
    $('#perdida_recompensa_detalle').hide();
    $('#perdida_fecha').attr('max', hoyIsoHome());
    vista('perdida-publicar');
    cargarRegionesSelect('perdida_region', 'Seleccione');
    $('#perdida_comuna').html('<option value="">Seleccione</option>');
    if (encontrada) { mostrarFormularioPerdida(); return; }
    asegurarMascotasTutor(function() {
        var ops = Object.keys(mascotasPorId).map(function(id) {
            return '<option value="' + escaparTextoConsentimiento(id) + '">' + escaparTextoConsentimiento(mascotasPorId[id].nombre || 'Mascota') + '</option>';
        }).join('');
        $('#perdida_mascota_id').html('<option value="">Seleccione una mascota</option>' + ops);
        if (idMascota != null && mascotasPorId[String(idMascota)]) { $('#perdida_mascota_id').val(String(idMascota)); elegirMascotaPerdida(String(idMascota)); }
        else { $('#perdida_vista_seleccion').show(); $('#perdida_vista_formulario').hide(); }
    });
};

const mostrarFormularioPerdida = () => {
    $('#perdida_vista_seleccion').hide();
    $('#perdida_vista_formulario').show();
    $('#perdida_resumen').toggle(modoPublicarPerdida !== 'encontrada');
};

const elegirMascotaPerdida = (id) => {
    var m = mascotasPorId[String(id)];
    if (!m) return;
    mascotaPerdidaElegida = id;
    $('#perdida_mascota_nombre').text(m.nombre || 'Mascota');
    $('#perdida_mascota_foto').html(fotoOPataPerdida(m.foto || m.foto_url));
    mostrarFormularioPerdida();
};

const volverSeleccionMascotaPerdida = () => {
    mascotaPerdidaElegida = null;
    $('#perdida_mascota_id').val('');
    $('#perdida_vista_formulario').hide();
    $('#perdida_vista_seleccion').show();
};

// El servicio para publicar avisos desde la app aún no existe en el backend.
const publicarMascotaPerdida = (evento) => {
    if (evento) evento.preventDefault();
    var encontrada = modoPublicarPerdida === 'encontrada';
    var datos = {
        estado: modoPublicarPerdida,
        id_mascota: encontrada ? null : mascotaPerdidaElegida,
        nombre: $.trim($('#perdida_nombre').val()), especie: $('#perdida_especie').val(), raza: $.trim($('#perdida_raza').val()),
        id_region: $('#perdida_region').val(), id_comuna: $('#perdida_comuna').val(),
        direccion: $.trim($('#perdida_direccion').val()), latitud: $('#perdida_latitud').val(), longitud: $('#perdida_longitud').val(),
        fecha: $('#perdida_fecha').val(), hora: $('#perdida_hora').val(), descripcion: $.trim($('#perdida_descripcion').val()),
        recompensa: !encontrada && $('#perdida_recompensa').prop('checked') ? Number($('#perdida_recompensa_monto').val() || 0) : 0,
        fotos: fotosPerdida.map(function(f) { return f.archivo; })
    };
    var faltan = [];
    if (!encontrada && !datos.id_mascota) faltan.push('Mascota');
    if (!datos.id_region) faltan.push('Región');
    if (!datos.id_comuna) faltan.push('Comuna');
    if (!datos.direccion) faltan.push('Dirección');
    if (!datos.fecha) faltan.push('Fecha');
    if (!datos.descripcion) faltan.push('Descripción');
    if (faltan.length) { msg('Faltan datos', 'Completa: ' + faltan.join(', ') + '.', 'warning'); return false; }
    if (datos.fecha > hoyIsoHome()) { msg('Fecha', 'La fecha no puede ser futura.', 'warning'); return false; }
    msg('Publicar aviso', 'La publicación de avisos desde la app aún no está habilitada.', 'warning');
    return false;
};

// ----- Responder un aviso (la vi / la tengo / es mi mascota) -----
const abrirContactoAviso = (indice) => {
    var a = avisosPerdidas[indice]; if (!a) return;
    avisoContactoActual = a;
    var perdida = a.estado === 'perdida';
    $('#form-contacto-aviso')[0].reset();
    $('#contacto_foto').html(fotoOPataPerdida(a.foto));
    $('#contacto_tutor').text(a.tutor || 'el tutor');
    $('#contacto_titulo_pagina').text(perdida ? 'Avisar que la viste' : 'Es mi mascota');
    $('#contacto_titulo').text(perdida ? '¿Viste a ' + (a.nombre || 'esta mascota') + '?' : '¿Es tu mascota?');
    $('#contacto_bloque_perdida').toggle(perdida);
    $('#contacto_bloque_encontrada').toggle(!perdida);
    $('#contacto_grupo_lugar, #contacto_grupo_fecha').toggle(perdida);
    $('#contacto_lugar_texto').text('¿Dónde la viste?');
    $('#contacto_mensaje').attr('placeholder', perdida ? 'Cuéntale cómo estaba, hacia dónde iba o cómo puede ubicarte.' : 'Cuéntale por qué crees que es tuya y cuándo se perdió.');
    $('#contacto_fecha').attr('max', hoyIsoHome()).val(hoyIsoHome());
    vista('perdida-contacto');
    asegurarMascotasTutor(function() {
        $('#contacto_mi_mascota').html('<option value="">No la tengo registrada</option>' + Object.keys(mascotasPorId).map(function(id) {
            return '<option value="' + escaparTextoConsentimiento(id) + '">' + escaparTextoConsentimiento(mascotasPorId[id].nombre || 'Mascota') + '</option>';
        }).join(''));
    });
};

const alCambiarTipoContacto = () => {
    $('#contacto_lugar_texto').text($('input[name="contacto_tipo"]:checked').val() === 'la_tiene' ? '¿Dónde la encontraste?' : '¿Dónde la viste?');
};

const enviarContactoAviso = (evento) => {
    if (evento) evento.preventDefault();
    var perdida = avisoContactoActual && avisoContactoActual.estado === 'perdida';
    var faltan = [];
    if (perdida && !$.trim($('#contacto_lugar').val())) faltan.push($('#contacto_lugar_texto').text().replace(/[¿?]/g, ''));
    if (!perdida && !$.trim($('#contacto_sena').val())) faltan.push('Una seña que solo tú conozcas');
    if (!$.trim($('#contacto_mensaje').val())) faltan.push('Mensaje');
    if (faltan.length) { msg('Faltan datos', 'Completa: ' + faltan.join(', ') + '.', 'warning'); return false; }
    msg('Enviar aviso', 'El envío de respuestas desde la app aún no está habilitado.', 'warning');
    return false;
};

// ----- Álbum de fotos: mismo flujo que la foto de perfil -----
var fotosPerdida = [];
const limpiarFotosPerdida = () => { fotosPerdida.forEach(function(f) { URL.revokeObjectURL(f.url); }); fotosPerdida = []; pintarMiniaturasPerdida(); };
const pintarMiniaturasPerdida = () => {
    $('#perdida_fotos_texto').text(fotosPerdida.length ? 'Agregar más fotos' : 'Agregar fotos');
    $('#perdida_miniaturas').html(fotosPerdida.map(function(f, i) {
        return '<div class="fallecimiento-mini"><img src="' + f.url + '" alt="">' +
            '<button type="button" data-role="none" aria-label="Quitar foto" onclick="quitarFotoPerdida(' + i + ')">×</button></div>';
    }).join(''));
};

const quitarFotoPerdida = (i) => {
    var f = fotosPerdida.splice(i, 1)[0];
    if (f) URL.revokeObjectURL(f.url);
    pintarMiniaturasPerdida();
};


// ----- Álbum de fotos del fallecimiento: mismo flujo (origen, encuadre, guardar) -----
var encuadrePerdida = { x: 0, y: 0, escala: 1, minimo: 1, ancho: 0, alto: 0, marco: 0, url: null };

const abrirOpcionesFotoPerdida = () => { $('#perdida_foto_bloque').addClass('sheet-abierta'); };
const cerrarOpcionesFotoPerdida = () => { $('#perdida_foto_bloque').removeClass('sheet-abierta'); };

const elegirOrigenFotoPerdida = (idInput) => {
    cerrarOpcionesFotoPerdida();
    var input = document.getElementById(idInput);
    input.value = '';
    input.click();
};

const aplicarEncuadrePerdida = () => {
    var e = encuadrePerdida;
    var s = e.minimo * e.escala;
    e.x = Math.min(0, Math.max(e.marco - e.ancho * s, e.x));
    e.y = Math.min(0, Math.max(e.marco - e.alto * s, e.y));
    $('#perdida_foto_editor').css('transform', 'translate(' + e.x + 'px,' + e.y + 'px) scale(' + s + ')');
};

const iniciarEncuadreFotoPerdida = (archivo) => {
    if (encuadrePerdida.url) URL.revokeObjectURL(encuadrePerdida.url);
    encuadrePerdida.url = URL.createObjectURL(archivo);
    var editor = document.getElementById('perdida_foto_editor');
    editor.onload = function() {
        var e = encuadrePerdida;
        $('#perdida_foto_bloque').addClass('con-nueva-foto');
        e.marco = document.getElementById('perdida_foto_marco').clientWidth;
        e.ancho = editor.naturalWidth;
        e.alto = editor.naturalHeight;
        e.minimo = e.marco / Math.min(e.ancho, e.alto);
        e.escala = 1;
        e.x = (e.marco - e.ancho * e.minimo) / 2;
        e.y = (e.marco - e.alto * e.minimo) / 2;
        $('#perdida_foto_zoom').val(100);
        $(editor).css({ width: e.ancho + 'px', height: e.alto + 'px' });
        aplicarEncuadrePerdida();
    };
    editor.onerror = function() {
        cancelarFotoPerdidaAjustada();
        msg('Álbum de fotos', 'No fue posible leer la imagen. Prueba con otra.', 'error');
    };
    editor.src = encuadrePerdida.url;
};

$(document).on('change', '#perdida_foto_galeria, #perdida_foto_camara', function() {
    var archivo = this.files && this.files[0];
    if (!archivo) return;
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type) || archivo.size > 5 * 1024 * 1024) {
        this.value = '';
        msg('Álbum de fotos', 'Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.', 'error');
        return;
    }
    iniciarEncuadreFotoPerdida(archivo);
});

$(document).on('input', '#perdida_foto_zoom', function() {
    var e = encuadrePerdida;
    var anterior = e.minimo * e.escala;
    var centroX = (e.marco / 2 - e.x) / anterior;
    var centroY = (e.marco / 2 - e.y) / anterior;
    e.escala = this.value / 100;
    var nueva = e.minimo * e.escala;
    e.x = e.marco / 2 - centroX * nueva;
    e.y = e.marco / 2 - centroY * nueva;
    aplicarEncuadrePerdida();
});

(function() {
    var arrastre = null;
    $(document).on('pointerdown', '#perdida_foto_bloque.con-nueva-foto #perdida_foto_marco', function(ev) {
        arrastre = { px: ev.originalEvent.clientX, py: ev.originalEvent.clientY, x: encuadrePerdida.x, y: encuadrePerdida.y };
        try { this.setPointerCapture(ev.originalEvent.pointerId); } catch (err) {}
    });
    $(document).on('pointermove', '#perdida_foto_marco', function(ev) {
        if (!arrastre) return;
        encuadrePerdida.x = arrastre.x + (ev.originalEvent.clientX - arrastre.px);
        encuadrePerdida.y = arrastre.y + (ev.originalEvent.clientY - arrastre.py);
        aplicarEncuadrePerdida();
    });
    $(document).on('pointerup pointercancel', '#perdida_foto_marco', function() { arrastre = null; });
})();

const cancelarFotoPerdidaAjustada = () => {
    $('#perdida_foto_galeria, #perdida_foto_camara').val('');
    $('#perdida_foto_bloque').removeClass('con-nueva-foto sheet-abierta');
    if (encuadrePerdida.url) {
        URL.revokeObjectURL(encuadrePerdida.url);
        encuadrePerdida.url = null;
    }
};

// Recorta lo que se ve dentro del marco cuadrado y lo deja listo para enviar.
const guardarFotoPerdidaAjustada = () => {
    var e = encuadrePerdida;
    var editor = document.getElementById('perdida_foto_editor');
    if (!editor.naturalWidth) return;
    var s = e.minimo * e.escala;
    var lado = 512;
    var lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.drawImage(editor, -e.x / s, -e.y / s, e.marco / s, e.marco / s, 0, 0, lado, lado);
    lienzo.toBlob(function(blob) {
        if (!blob) {
            msg('Álbum de fotos', 'No fue posible preparar la foto.', 'error');
            return;
        }
        if (fotosPerdida.length >= 4) { msg('Fotos', 'Puedes subir hasta 4 fotos.', 'warning'); cancelarFotoPerdidaAjustada(); return; }
        var archivo = new File([blob], 'album-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        fotosPerdida.push({ archivo: archivo, url: URL.createObjectURL(blob) });
        pintarMiniaturasPerdida();
        cancelarFotoPerdidaAjustada();
    }, 'image/jpeg', 0.9);
};




// ===== FVU: Ficha Veterinaria Única de la mascota =====
// Datos base: objeto de `mis_mascotas_app` (nombre, especie, raza, foto, fecha_nacimiento, sexo,
// tamano, color, microchip, peso, esterilizado...). Resumen clínico opcional desde
// GET paciente/fvu_mascota_app { id_mascota } -> { ultima_atencion, vacunas[], alergias[],
// desparasitaciones[], condicion_cronica[], tratamientos[], cirugias[], documentos[],
// atenciones[{fecha, profesional, diagnostico}], tutor{nombre, telefono, contacto_emergencia} }
var fvuActual = { id: null, mascota: {}, resumen: {} };

const FVU_ICONOS = {
    vacuna: '<path d="M18 2l4 4M20 4l-3 3M14 8l-9 9v3h3l9-9M12 6l6 6M7 15l2 2"/>',
    alergia: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    parasito: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    corazon: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/>',
    sexo: '<circle cx="9" cy="14" r="5"/><path d="M13 10l7-7M15 3h5v5"/>',
    peso: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M9 11a3 3 0 016 0"/>',
    lista: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    bisturi: '<path d="M4 20L20 4M14 4l6 6M4 20l4-1-3-3z"/>',
    doc: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 13h6M10 17h6"/>'
};
const iconoFvu = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + FVU_ICONOS[k] + '</svg>';

const abrirFvuMascota = (idMascota) => {
    var m = mascotasPorId[String(idMascota)] || {};
    fvuActual = { id: idMascota, mascota: m, resumen: {}, vd: {} };
    $('#fvu_cuerpo').empty();
    pintarFvu();
    if (MODO_DEMO_MASCOTAS && String(idMascota) === 'demo') {
        fvuActual.resumen = MASCOTA_DEMO.resumen;
        fvuActual.vd = { vacunas: MASCOTA_DEMO.vacunas, desparasitaciones: MASCOTA_DEMO.desparasitaciones };
        pintarFvu();
        return;
    }
    // Registro de vacunas y desparasitación: se muestra dentro de la misma ficha.
    new Api('paciente', 'vacunas_desparasitacion_app').request({ id_mascota: idMascota }, function(resp) {
        if (String(fvuActual.id) !== String(idMascota)) return;
        fvuActual.vd = {
            vacunas: resp && Array.isArray(resp.vacunas) ? resp.vacunas : [],
            desparasitaciones: resp && Array.isArray(resp.desparasitaciones) ? resp.desparasitaciones : []
        };
        pintarFvu();
    }, function() { /* sin registro: los acordeones muestran "Sin ... registradas" */ });
    var api = new Api('paciente', 'fvu_mascota_app');
    api.request({ id_mascota: idMascota }, function(resp) {
        fvuActual.resumen = resp || {};
        pintarFvu();
    }, function() { /* sin resumen clínico: se muestran solo los datos de la mascota */ });
};

const valorFvu = (v) => $.trim(v == null ? '' : String(v));

// Tarjeta de "Estado de salud" / "Resumen clínico".
// lista: arreglo (vacío = "No hay registro", con datos = "SI" + Ver) o string (se muestra tal cual).
// Si tiene registro y acción, toda la tarjeta abre el detalle (modal).
// estado (opcional): 'al_dia' | 'atrasado' → badge dentro de la tarjeta.
const tarjetaFvu = (icono, color, titulo, dato, accion, estado) => {
    var tiene, texto;
    if (Array.isArray(dato)) { tiene = dato.length > 0; texto = tiene ? 'SI' : 'No hay registro'; }
    else { texto = valorFvu(dato) || 'No hay registro'; tiene = texto !== 'No hay registro'; }
    var clic = tiene && accion;
    var badge = estado === 'al_dia' ? '<span class="fvu-estado fvu-estado-ok">Al día</span>'
        : estado === 'atrasado' ? '<span class="fvu-estado fvu-estado-atrasado">Atrasado</span>' : '';
    return '<div class="fvu-tarjeta' + (clic ? ' clickeable' : '') + '"' +
        (clic ? ' role="button" tabindex="0" onclick="' + accion + '"' : '') + '>' +
        '<span class="fvu-tarjeta-icono ' + color + '">' + iconoFvu(icono) + '</span>' +
        '<div class="fvu-tarjeta-copia"><small>' + titulo + '</small><b class="' + (tiene ? 'tiene' : '') + '">' + escaparTextoConsentimiento(texto) + '</b>' + badge + '</div>' +
        (clic ? '<span class="fvu-ver">Ver ›</span>' : '') +
        '</div>';
};

// Estado según la próxima fecha del registro más reciente: vencida → atrasado; si no, al día.
const estadoProximaFvu = (lista, campoFecha, campoProxima, respaldo) => {
    var ultimo = ultimosPorFechaFvu(lista, campoFecha, 1)[0];
    var prox = ultimo && Date.parse(ultimo[campoProxima]);
    if (prox) {
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return prox < hoy.getTime() ? 'atrasado' : 'al_dia';
    }
    var r = String(respaldo || '').toLowerCase();
    if (/^s[ií]/.test(r)) return 'al_dia';
    if (/^no/.test(r)) return 'atrasado';
    return '';
};

const pintarFvu = () => {
    var m = fvuActual.mascota, r = fvuActual.resumen, id = fvuActual.id;
    var vd = fvuActual.vd || {};
    var vacFvu = ultimosPorFechaFvu(vd.vacunas, 'fecha', 10);
    var despFvu = ultimosPorFechaFvu(vd.desparasitaciones, 'fecha_aplicacion', 10);
    var abiertos = $('#fvu_cuerpo .fvu-acordeon').map(function(i) { return $(this).hasClass('abierto') ? i : null; }).get();
    var foto = m.foto || m.foto_url || '';
    var pata = '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
    var esc = escaparTextoConsentimiento;
    var edad = edadMascota(m);
    var nac = m.fecha_nacimiento ? fechaVD(m.fecha_nacimiento) : '';
    var dato = function(etq, v, extra) {
        v = valorFvu(v);
        return '<div class="fvu-dato"><small>' + etq + '</small><b>' + (v ? esc(v) : '-') + '</b>' + (extra ? '<em>' + esc(extra) + '</em>' : '') + '</div>';
    };
    var pesoTxt = valorFvu(m.peso || r.peso);
    if (pesoTxt && !/[a-z]/i.test(pesoTxt)) pesoTxt += ' kg';
    var esterilizado = valorFvu(m.esterilizado);
    var idq = esc(String(id));

    $('#fvu_cuerpo').html(
        '<section class="fvu-hero">' +
            '<div class="fvu-hero-top">' +
                '<div class="fvu-hero-foto">' + (foto ? '<img src="' + esc(foto) + '" alt="" onerror="this.remove()">' : pata) + '</div>' +
                '<div class="fvu-hero-id"><h2>' + esc(m.nombre || 'Mascota') + '</h2>' +
                    '<ul class="fvu-hero-lista">' +
                        '<li><span>Microchip:</span> ' + esc(valorFvu(m.microchip) || 'No hay registro') + '</li>' +
                        '<li><span>Especie:</span> ' + esc(valorFvu(m.especie) || 'No hay registro') + '</li>' +
                        '<li><span>Última atención:</span> ' + esc(r.ultima_atencion ? fechaVD(r.ultima_atencion) : 'No hay registro') + '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>' +
            '<div class="fvu-hero-botones">' +
                '<button type="button" data-role="none" class="fvu-btn-claro" onclick="mostrarTutorFvu()">Información del tutor y co-tutor</button>' +
            '</div>' +
        '</section>' +
        '<section id="fvu_mas_info" class="fvu-mas-info" style="display:none">' +
            filaVD('Fecha de nacimiento', nac) + filaVD('Esterilizado/a', esterilizado) +
            filaVD('Vacunación al día', m.vacunacion_al_dia) + filaVD('Comportamiento', m.comportamiento) +
            filaVD('Enfermedades', m.enfermedades) + filaVD('Convive con otros animales', m.convive_con_otros_animales) +
        '</section>' +
        '<section class="fvu-datos">' +
            dato('EDAD', edad, nac) + dato('SEXO', m.sexo) + dato('ESPECIE', m.especie) +
            dato('RAZA', m.raza) + dato('TAMAÑO', m.tamano) + dato('COLOR', m.color) +
        '</section>' +
        '<h3 class="fvu-titulo">Estado de salud</h3>' +
        '<section class="fvu-grid">' +
            tarjetaFvu('vacuna', 'rojo', 'Vacunas', r.vacunas || [], "detalleFvu('vacunas')",
                estadoProximaFvu(vd.vacunas, 'fecha', 'proxima_dosis', r.vacunas_estado || m.vacunacion_al_dia)) +
            tarjetaFvu('alergia', 'rojo-suave', 'Alergias', r.alergias || [], "detalleFvu('alergias')") +
            tarjetaFvu('parasito', 'rojo-suave', 'Desparasitaciones', r.desparasitaciones || [], "detalleFvu('desparasitaciones')",
                estadoProximaFvu(vd.desparasitaciones, 'fecha_aplicacion', 'proxima_desparasitacion', r.desparasitacion_estado)) +
            tarjetaFvu('corazon', 'rojo-suave', 'Condición crónica', r.condicion_cronica || [], "detalleFvu('condicion_cronica')") +
            tarjetaFvu('sexo', 'turquesa', 'Esterilizado/a', esterilizado) +
            tarjetaFvu('peso', 'turquesa', 'Peso', pesoTxt) +
        '</section>' +
        '<h3 class="fvu-titulo">Resumen clínico</h3>' +
        '<section class="fvu-grid">' +
            tarjetaFvu('lista', 'turquesa', 'Tratamientos en curso', r.tratamientos || [], "detalleFvu('tratamientos')") +
            tarjetaFvu('bisturi', 'turquesa', 'Cirugías recientes', r.cirugias || [], "detalleFvu('cirugias')") +
            tarjetaFvu('doc', 'turquesa', 'Documentos clínicos', r.documentos || [], "detalleFvu('documentos')") +
        '</section>' +
        '<h3 class="fvu-titulo">Historial veterinario</h3>' +
        '<p class="fvu-sub">Seleccione una sección para ver el detalle</p>' +
        acordeonFvu('Historial Veterinario', 'Últimas atenciones y diagnósticos', ultimasAtencionesFvu(r.atenciones).length, historialFvuHtml(ultimasAtencionesFvu(r.atenciones))) +
        acordeonFvu('Registro de vacunas', 'Últimas vacunas aplicadas', vacFvu.length,
            registrosFvuHtml(vacFvu, 'fecha', function(v) { return [v.nombre, v.dosis]; }, 'Sin vacunas registradas.')) +
        acordeonFvu('Registro de desparasitación', 'Últimos antiparasitarios aplicados', despFvu.length,
            registrosFvuHtml(despFvu, 'fecha_aplicacion', function(d) { return [d.producto, d.tipo]; }, 'Sin desparasitaciones registradas.'))
    );
    // Conserva abiertos los acordeones que el usuario tenía desplegados.
    abiertos.forEach(function(i) { $('#fvu_cuerpo .fvu-acordeon').eq(i).addClass('abierto'); });
};

// Las N más recientes según el campo de fecha indicado.
const ultimosPorFechaFvu = (lista, campo, n) => (lista || []).slice().sort(function(a, b) {
    return (Date.parse(b[campo]) || 0) - (Date.parse(a[campo]) || 0);
}).slice(0, n);

// Lista compacta: una línea por registro (fecha | nombre · detalle).
const registrosFvuHtml = (lista, campoFecha, textos, vacio) => lista.length ? lista.map(function(x) {
    var t = textos(x).map(function(v) { return $.trim(v == null ? '' : String(v)); }).filter(Boolean);
    return '<div class="fvu-registro"><span>' + escaparTextoConsentimiento(fechaVD(x[campoFecha]) || '—') + '</span>' +
        '<b>' + escaparTextoConsentimiento(t[0] || '—') + '</b>' +
        (t[1] ? '<small>' + escaparTextoConsentimiento(t[1]) + '</small>' : '') + '</div>';
}).join('') : '<p class="fvu-vacio">' + vacio + '</p>';

// Solo las 7 atenciones más recientes (de la más nueva a la más antigua).
const ultimasAtencionesFvu = (atenciones) => (atenciones || []).slice().sort(function(a, b) {
    return (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0);
}).slice(0, 7);

const historialFvuHtml = (atenciones) => atenciones.length ? atenciones.map(function(a) {
    return '<div class="fvu-atencion">' + filaVD('Fecha', fechaVD(a.fecha)) + filaVD('Diagnóstico', a.diagnostico) + '</div>';
}).join('') : '<p class="fvu-vacio">Sin atenciones registradas.</p>';

const acordeonFvu = (titulo, bajada, n, cuerpo) =>
    '<div class="fvu-acordeon"><button type="button" data-role="none" class="fvu-acordeon-cab" onclick="$(this).parent().toggleClass(\'abierto\')">' +
    '<div><b>' + titulo + '</b><small>' + bajada + '</small></div>' +
    (n ? '<span class="fvu-n">' + n + '</span>' : '') + '<span class="fvu-chevron">⌄</span></button>' +
    '<div class="fvu-acordeon-cuerpo">' + cuerpo + '</div></div>';

const abrirVdDesdeFvu = (seccion) => {
    vista('vacunas-desparasitacion');
    abrirVacunasDesparasitacion(fvuActual.id);
    mostrarSeccionVD(seccion);
};

// Modal genérico de la ficha (mismo estilo que Tutoría compartida).
const abrirModalFvu = (titulo, cuerpo, extraFooter) => {
    cerrarModalFvu();
    $('body').append(
        '<div id="fvu_modal" class="tc-overlay visible" role="dialog" aria-modal="true" aria-labelledby="fvu_modal_titulo" onclick="if(event.target===this)cerrarModalFvu()">' +
            '<div class="tc-modal">' +
                '<div class="tc-modal-header"><div><h5 id="fvu_modal_titulo">' + titulo + '</h5>' +
                    '<small>' + escaparTextoConsentimiento((fvuActual.mascota || {}).nombre || 'Mascota') + '</small></div>' +
                    '<button type="button" data-role="none" class="tc-modal-cerrar" onclick="cerrarModalFvu()" aria-label="Cerrar">×</button></div>' +
                '<div class="tc-modal-body">' + cuerpo + '</div>' +
                (extraFooter ? '<div class="tc-modal-footer">' + extraFooter + '</div>' : '') +
            '</div>' +
        '</div>'
    );
};

const cerrarModalFvu = () => { $('#fvu_modal').remove(); };

// Detalle de una tarjeta de Estado de salud / Resumen clínico.
const detalleFvu = (clave) => {
    var r = fvuActual.resumen || {}, vd = fvuActual.vd || {};
    var texto = function(x, campos) {
        if (typeof x === 'string') return x;
        for (var i = 0; i < campos.length; i++) { if (valorFvu(x[campos[i]])) return valorFvu(x[campos[i]]); }
        return '';
    };
    // Lista genérica: nombre/descripcion + detalle + fecha (si viene).
    var listaSimple = function(lista, vacio) {
        var html = (lista || []).map(function(x) {
            var nombre = texto(x, ['nombre', 'descripcion', 'tipo', 'titulo']) || 'Registro';
            var detalle = typeof x === 'string' ? '' : texto(x, ['detalle', 'observaciones', 'indicaciones', 'severidad', 'estado']);
            var fecha = typeof x === 'string' ? '' : (x.fecha || x.fecha_inicio || x.fecha_emision || '');
            return '<div class="fvu-registro"><span>' + escaparTextoConsentimiento(fecha ? fechaVD(fecha) : '—') + '</span>' +
                '<b>' + escaparTextoConsentimiento(nombre) + '</b>' +
                (detalle ? '<small>' + escaparTextoConsentimiento(detalle) + '</small>' : '') + '</div>';
        }).join('');
        return html || '<p class="fvu-vacio">' + vacio + '</p>';
    };
    var cfg = {
        vacunas: ['Vacunas', function() {
            return registrosFvuHtml(ultimosPorFechaFvu(vd.vacunas, 'fecha', 10), 'fecha',
                function(v) { return [v.nombre, [v.dosis, v.proxima_dosis ? 'Próxima: ' + fechaVD(v.proxima_dosis) : ''].filter(Boolean).join(' · ')]; },
                'Sin vacunas registradas.');
        }],
        desparasitaciones: ['Desparasitaciones', function() {
            return registrosFvuHtml(ultimosPorFechaFvu(vd.desparasitaciones, 'fecha_aplicacion', 10), 'fecha_aplicacion',
                function(d) { return [d.producto, [d.tipo, d.dosis, d.proxima_desparasitacion ? 'Próxima: ' + fechaVD(d.proxima_desparasitacion) : ''].filter(Boolean).join(' · ')]; },
                'Sin desparasitaciones registradas.');
        }],
        alergias: ['Alergias', function() { return listaSimple(r.alergias, 'Sin alergias registradas.'); }],
        condicion_cronica: ['Condición crónica', function() { return listaSimple(r.condicion_cronica, 'Sin condiciones crónicas registradas.'); }],
        tratamientos: ['Tratamientos en curso', function() { return listaSimple(r.tratamientos, 'Sin tratamientos en curso.'); }],
        cirugias: ['Cirugías recientes', function() { return listaSimple(r.cirugias, 'Sin cirugías registradas.'); }],
        documentos: ['Documentos clínicos', function() { return listaSimple(r.documentos, 'Sin documentos registrados.'); }]
    }[clave];
    if (!cfg) return;
    var footer = clave === 'documentos'
        ? '<button type="button" data-role="none" class="tc-btn tc-btn-secundario" onclick="cerrarModalFvu(); vista(\'recetaonline\')">Ir a Mis documentos</button>'
        : '';
    abrirModalFvu(cfg[0], cfg[1](), footer);
};

// Modal con la información del tutor y de los co-tutores de la mascota.
// Datos esperados en el resumen FVU: tutor { rut, nombre, direccion, telefono, email }
// y cotutores [{ rut, nombre, direccion, telefono, email }] (o co_tutor como objeto único).
const mostrarTutorFvu = () => {
    var r = fvuActual.resumen || {};
    var t = r.tutor || {};
    var cot = Array.isArray(r.cotutores) ? r.cotutores : (r.co_tutor ? [r.co_tutor] : []);
    var persona = function(p) {
        var tel = $.trim(p.telefono == null ? '' : String(p.telefono));
        var telLimpio = tel.replace(/[^\d+]/g, '');
        var filaTel = tel ? '<div class="vd-fila"><span>Teléfono</span><b><a class="fvu-tel" href="tel:' + telLimpio + '" ' +
            'onclick="return llamarTelefonoFvu(\'' + telLimpio + '\')">' + escaparTextoConsentimiento(tel) + '</a></b></div>' : '';
        var filas = filaVD('RUT', p.rut) + filaVD('Nombre', p.nombre) + filaVD('Dirección', p.direccion) +
            filaTel + filaVD('Email', p.email || p.correo);
        return filas ? '<div class="fvu-persona">' + filas + '</div>' : '';
    };
    var tutorHtml = persona(t) || '<p class="fvu-vacio">Aún no hay información registrada.</p>';
    var cotHtml = cot.map(persona).join('') || '<p class="fvu-vacio">Sin co-tutores asignados.</p>';

    $('#fvu_modal_tutor').remove();
    $('body').append(
        '<div id="fvu_modal_tutor" class="tc-overlay visible" role="dialog" aria-modal="true" aria-labelledby="fvu_modal_tutor_titulo" onclick="if(event.target===this)cerrarTutorFvu()">' +
            '<div class="tc-modal">' +
                '<div class="tc-modal-header"><div><h5 id="fvu_modal_tutor_titulo">Información del tutor y co-tutor</h5>' +
                    '<small>' + escaparTextoConsentimiento((fvuActual.mascota || {}).nombre || 'Mascota') + '</small></div>' +
                    '<button type="button" data-role="none" class="tc-modal-cerrar" onclick="cerrarTutorFvu()" aria-label="Cerrar">×</button></div>' +
                '<div class="tc-modal-body">' +
                    '<h6 class="fvu-modal-subtitulo">Tutor</h6>' + tutorHtml +
                    '<h6 class="fvu-modal-subtitulo">Co-tutor' + (cot.length > 1 ? 'es' : '') + '</h6>' + cotHtml +
                '</div>' +
            '</div>' +
        '</div>'
    );
};

const cerrarTutorFvu = () => { $('#fvu_modal_tutor').remove(); };

// Abre el marcador del teléfono (en Cordova con _system, como en Emergencia).
const llamarTelefonoFvu = (numero) => {
    if (!numero) return false;
    if (window.cordova && cordova.InAppBrowser) {
        cordova.InAppBrowser.open('tel:' + numero, '_system');
        return false;
    }
    return true; // navegador: deja que el enlace tel: actúe
};

// ===== Vacunas y desparasitación (por mascota) =====
// Respuesta esperada de GET paciente/vacunas_desparasitacion_app { id_mascota }:
// { vacunas: [{ edad, fecha, dosis, nombre, num_lote?, observaciones? }],
//   desparasitaciones: [{ peso, ultima_desparasitacion, fecha_aplicacion, producto, tipo, dosis,
//                         proxima_desparasitacion, realizado_por }] }
var mascotasPorId = {};

// Edad legible a partir de la fecha de nacimiento (o del campo `edad` si ya viene calculado).
const edadMascota = (m) => {
    if (m.edad) return String(m.edad);
    var nac = m.fecha_nacimiento ? new Date(m.fecha_nacimiento) : null;
    if (!nac || isNaN(nac)) return '';
    var hoy = new Date();
    var meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + hoy.getMonth() - nac.getMonth();
    if (hoy.getDate() < nac.getDate()) meses--;
    if (meses < 0) return '';
    if (meses < 12) return meses + (meses === 1 ? ' mes' : ' meses');
    var anios = Math.floor(meses / 12), resto = meses % 12;
    return anios + (anios === 1 ? ' año' : ' años') + (resto ? ' y ' + resto + (resto === 1 ? ' mes' : ' meses') : '');
};

const pintarFichaMascotaVD = (m) => {
    var foto = m.foto || m.foto_url || '';
    var pata = '<svg class="mascota-card-pata" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="11" rx="2" ry="2.8"/><ellipse cx="9.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="14.5" cy="6.2" rx="2" ry="2.8"/><ellipse cx="18.5" cy="11" rx="2" ry="2.8"/><path d="M12 11c-3 0-6 3.4-6 6.2 0 2 1.7 2.8 3.2 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.5 0 3.2-.8 3.2-2.8 0-2.8-3-6.2-6-6.2z"/></svg>';
    var dato = function(etq, v) {
        v = $.trim(v == null ? '' : String(v));
        return '<p><span>' + etq + ':</span> ' + (v ? escaparTextoConsentimiento(v) : '—') + '</p>';
    };
    $('#vd_mascota_nombre').html(
        '<div class="vd-ficha-foto">' + (foto ? '<img src="' + escaparTextoConsentimiento(foto) + '" alt="" onerror="this.remove()">' : pata) + '</div>' +
        '<div class="vd-ficha-datos"><strong>' + escaparTextoConsentimiento(m.nombre || 'Mascota') + '</strong>' +
        dato('Especie', m.especie) + dato('Raza', m.raza) + dato('Edad', edadMascota(m)) +
        dato('Peso', m.peso ? m.peso + (/[a-z]/i.test(String(m.peso)) ? '' : ' kg') : '') + '</div>'
    );
};

var datosVD = { vacunas: [], desparasitaciones: [] };
var seccionVD = 'vacunas';

const abrirVacunasDesparasitacion = (idMascota, boton, seccion) => {
    pintarFichaMascotaVD(mascotasPorId[String(idMascota)] || {});
    datosVD = { vacunas: [], desparasitaciones: [] };
    mostrarSeccionVD(seccion === 'desparasitacion' ? 'desparasitacion' : 'vacunas');
    $('#vd_lista').html('<div class="mis-pacientes-vacio">Cargando...</div>');
    if (MODO_DEMO_MASCOTAS && String(idMascota) === 'demo') {
        datosVD.vacunas = MASCOTA_DEMO.vacunas;
        datosVD.desparasitaciones = MASCOTA_DEMO.desparasitaciones;
        pintarSeccionVD();
        return;
    }
    var api = new Api('paciente', 'vacunas_desparasitacion_app');
    api.request({ id_mascota: idMascota }, function(resp) {
        datosVD.vacunas = resp && Array.isArray(resp.vacunas) ? resp.vacunas : [];
        datosVD.desparasitaciones = resp && Array.isArray(resp.desparasitaciones) ? resp.desparasitaciones : [];
        pintarSeccionVD();
    }, function() {
        $('#vd_lista').html('<div class="mis-pacientes-vacio mis-pacientes-error">No fue posible cargar la información.</div>');
    });
};

const mostrarSeccionVD = (seccion) => {
    seccionVD = seccion;
    $('#vd_pill_vacunas').toggleClass('activo', seccion === 'vacunas');
    $('#vd_pill_desparasitacion').toggleClass('activo', seccion === 'desparasitacion');
    pintarSeccionVD();
};

// Fila "etiqueta: valor"; si el valor viene vacío, la fila no se muestra.
const filaVD = (etiqueta, valor) => {
    valor = $.trim(valor == null ? '' : String(valor));
    return valor ? '<div class="vd-fila"><span>' + etiqueta + '</span><b>' + escaparTextoConsentimiento(valor) + '</b></div>' : '';
};

const fechaVD = (f) => { try { return f ? fechaEsp(f) : ''; } catch (e) { return f || ''; } };

const pintarSeccionVD = () => {
    var $lista = $('#vd_lista');
    var vacunas = seccionVD === 'vacunas';
    var registros = vacunas ? datosVD.vacunas : datosVD.desparasitaciones;
    if (!registros.length) {
        $lista.html('<div class="mis-pacientes-vacio">' + 'No hay registro' + '</div>');
        return;
    }
    $lista.html(registros.map(function(r) {
        if (vacunas) {
            return '<article class="vd-card"><h3>' + escaparTextoConsentimiento(r.nombre || 'Vacuna') + '</h3>' +
                filaVD('Edad', r.edad) + filaVD('Fecha', fechaVD(r.fecha)) + filaVD('Dosis', r.dosis) +
                filaVD('N° de lote', r.num_lote) + filaVD('Observaciones', r.observaciones) + '</article>';
        }
        return '<article class="vd-card"><h3>' + escaparTextoConsentimiento(r.producto || 'Desparasitación') + '</h3>' +
            filaVD('Peso', r.peso) + filaVD('Última desparasitación', fechaVD(r.ultima_desparasitacion)) +
            filaVD('Fecha de aplicación', fechaVD(r.fecha_aplicacion)) + filaVD('Producto antiparasitario', r.producto) +
            filaVD('Tipo', r.tipo) + filaVD('Dosis administrada', r.dosis) +
            filaVD('Próxima desparasitación', fechaVD(r.proxima_desparasitacion)) + filaVD('Realizado por', r.realizado_por) + '</article>';
    }).join(''));
};

// ===== Avisos de vacunas y desparasitación en el inicio del tutor =====
// Por cada mascota se consulta GET paciente/vacunas_desparasitacion_app (el mismo de la ficha).
// - Vacunas: se toma la última aplicación de cada vacuna. Su vencimiento es `proxima_dosis`
//   (o `fecha_vencimiento`) si el backend lo envía; si no viene, se asume revacunación anual.
// - Desparasitación: se toma la última aplicación de cada tipo (interna/externa) y su
//   `proxima_desparasitacion`.
// Se avisa si ya venció (rojo) o si vence dentro de DIAS_AVISO_SALUD días (amarillo).
const DIAS_AVISO_SALUD = 30;
var cargaAlertasSaludId = 0;

const fechaLocalSalud = (valor) => {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

const isoSalud = (d) => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);

const diasHastaSalud = (fecha) => {
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha - hoy) / 86400000);
};

// Último registro de cada grupo (misma vacuna o mismo tipo de desparasitación).
const ultimosPorGrupoSalud = (registros, campoGrupo, campoFecha) => {
    var grupos = {};
    (registros || []).forEach(function(r) {
        var clave = $.trim(String(r[campoGrupo] || '')).toLowerCase() || '_';
        var f = fechaLocalSalud(r[campoFecha]);
        if (!grupos[clave] || (f && (!grupos[clave].f || f > grupos[clave].f))) grupos[clave] = { r: r, f: f };
    });
    return Object.keys(grupos).map(function(k) { return grupos[k]; });
};

const vencimientosSalud = (resp) => {
    var vacunas = ultimosPorGrupoSalud(resp.vacunas, 'nombre', 'fecha').map(function(g) {
        var vence = fechaLocalSalud(g.r.proxima_dosis || g.r.fecha_vencimiento);
        if (!vence && g.f) {
            vence = new Date(g.f);
            vence.setFullYear(vence.getFullYear() + 1);
        }
        return vence ? { categoria: 'vacunas', nombre: g.r.nombre || 'Vacuna', vence: vence } : null;
    });
    var desparasitaciones = ultimosPorGrupoSalud(resp.desparasitaciones, 'tipo', 'fecha_aplicacion').map(function(g) {
        var vence = fechaLocalSalud(g.r.proxima_desparasitacion);
        var tipo = g.r.tipo ? String(g.r.tipo).toLowerCase() : '';
        var nombre = g.r.producto ? g.r.producto + (tipo ? ' (' + tipo + ')' : '') : (tipo ? 'Antiparasitario ' + tipo : 'Antiparasitario');
        return vence ? { categoria: 'desparasitacion', nombre: nombre, vence: vence } : null;
    });
    return vacunas.concat(desparasitaciones).filter(Boolean);
};

// Vacunas y desparasitaciones de una mascota que ya vencieron o vencen pronto.
const alertasSaludMascota = (mascota, resp) => vencimientosSalud(resp || {}).map(function(v) {
    v.dias = diasHastaSalud(v.vence);
    v.estado = v.dias < 0 ? 'vencido' : 'por-vencer';
    v.idMascota = String(mascota.id || mascota.id_paciente || '');
    v.mascota = mascota;
    return v;
}).filter(function(v) { return v.dias <= DIAS_AVISO_SALUD; });

// Cada vencimiento queda como aviso en la campana (notificaciones/historial.js). La clave evita
// repetirlo en cada visita al inicio; si pasa de "por vencer" a "vencida" se crea un aviso nuevo.
const registrarAlertasSalud = (alertas) => {
    if (typeof agregarNotificacion !== 'function') return;
    // Se agregan de menor a mayor urgencia: las vencidas quedan arriba de la lista.
    alertas.sort(function(a, b) { return b.dias - a.dias; }).forEach(function(a) {
        var vencido = a.estado === 'vencido';
        var vence = isoSalud(a.vence);
        var m = a.mascota || {};
        agregarNotificacion({
            clave: ['salud', a.idMascota, a.categoria, a.estado, a.nombre, vence].join('|'),
            tipo: 'salud',
            icono: a.categoria,
            estado: a.estado,
            vence: vence,
            titulo: (m.nombre || 'Tu mascota') + ' · ' + (a.categoria === 'vacunas' ? 'Vacunación' : 'Desparasitación') +
                (vencido ? ' vencida' : ' por vencer'),
            texto: a.nombre + (vencido ? ' · venció el ' : ' · vence el ') + fechaCortaHome(vence),
            accion: {
                tipo: 'vd', id_mascota: a.idMascota, seccion: a.categoria,
                mascota: { id: m.id, nombre: m.nombre, especie: m.especie, raza: m.raza, fecha_nacimiento: m.fecha_nacimiento, edad: m.edad, peso: m.peso, foto: m.foto || m.foto_url }
            }
        });
    });
};

const cargarAlertasSalud = () => {
    if (localStorage.getItem('rolActivo') === 'Profesional') return;
    var carga = ++cargaAlertasSaludId;

    var evaluar = function(mascotas) {
        var alertas = [];
        var pendientes = mascotas.length;
        if (!pendientes) return;
        mascotas.forEach(function(m) {
            var id = String(m.id || m.id_paciente || '');
            if (!mascotasPorId[id]) mascotasPorId[id] = m;
            var listo = function(resp) {
                alertas = alertas.concat(alertasSaludMascota(m, resp));
                if (--pendientes === 0 && carga === cargaAlertasSaludId) registrarAlertasSalud(alertas);
            };
            if (MODO_DEMO_MASCOTAS && id === 'demo') {
                listo({ vacunas: MASCOTA_DEMO.vacunas, desparasitaciones: MASCOTA_DEMO.desparasitaciones });
                return;
            }
            consultarSinLoader('/paciente/vacunas_desparasitacion_app', { id_mascota: id }, listo, function() { listo({}); });
        });
    };
    var sinDatos = function() { evaluar(MODO_DEMO_MASCOTAS ? [MASCOTA_DEMO.mascota] : []); };

    if (!localStorage.getItem('authToken')) { sinDatos(); return; }
    consultarSinLoader('/paciente/mis_mascotas_app', {}, function(resp) {
        var mascotas = resp && Array.isArray(resp.mascotas) ? resp.mascotas : [];
        if (!mascotas.length) { sinDatos(); return; }
        evaluar(mascotas);
    }, sinDatos);
};

$(document).on('pageshow', '#index', cargarAlertasSalud);

// Abre/cierra el panel de acciones de una mascota (móvil y tablet).
const alternarAccionesMascota = (boton) => {
    var $card = $(boton).closest('.mascota-card');
    var abierta = !$card.hasClass('abierta');
    $('#lista-mis-mascotas .mascota-card.abierta').not($card).removeClass('abierta')
        .find('.mascota-card-toggle').attr('aria-expanded', 'false');
    $card.toggleClass('abierta', abierta);
    $(boton).attr('aria-expanded', abierta ? 'true' : 'false');
};

// Destinos de cada acción. Las vistas aún no existen en la app: al crearlas,
// completar `vista` con el id de la página correspondiente.
const accionesMascota = {
    ficha:         { titulo: 'Ficha mascota',        vista: null },
    fvu:           { titulo: 'FVU',                  vista: 'fvu-mascota', alAbrir: (id) => abrirFvuMascota(id) },
    documentos:    { titulo: 'Mis documentos',      vista: 'recetaonline' },
    carne:         { titulo: 'Vacunas/desparasitación', vista: 'vacunas-desparasitacion', alAbrir: (id, boton) => abrirVacunasDesparasitacion(id, boton) },
    carne_old:     { titulo: 'Carné vacunas/desp.',  vista: null },
    genealogia:    { titulo: 'Mi genealogía',        vista: null },
    perdida:       { titulo: 'Mascota perdida',     vista: 'perdida-publicar', alAbrir: (id) => abrirPublicarPerdida('perdida', id) },
    traspasar:     { titulo: 'Traspasar mascota',   vista: 'traspasar-mascota', alAbrir: (id) => abrirTraspasoMascota(id) },
    fallecimiento: { titulo: 'Registrar fallecimiento', vista: 'fallecimiento-mascota', alAbrir: (id) => abrirFallecimientoMascota(id) }
};

const accionMascota = (accion, boton) => {
    var cfg = accionesMascota[accion];
    if (!cfg) return;
    var id = $(boton).closest('.mascota-card').data('id');
    if (cfg.vista) {
        window.mascotaSeleccionada = id;
        vista(cfg.vista);
        if (cfg.alAbrir) cfg.alAbrir(id, boton);
        return;
    }
    msg(cfg.titulo, 'Esta sección estará disponible próximamente en la app.', 'info');
};

const alCambiarEspecieMascota = () => {
    var otra = $('#mascota_especie').val() === 'Otra';
    $('#mascota_especie_otra_grupo').toggle(otra);
    if (otra) $('#mascota_especie_otra').focus(); else $('#mascota_especie_otra').val('');
};

const alCambiarFechaDesconocidaMascota = () => {
    var desconocida = $('#mascota_nacimiento_desconocida').prop('checked');
    $('#mascota_nacimiento').prop('disabled', desconocida);
    if (desconocida) $('#mascota_nacimiento').val('');
};

const alCambiarEsterilizadoMascota = () => {
    var si = $('#mascota_esterilizado').val() === 'Sí';
    $('#mascota_esterilizacion_grupo').toggle(si);
    if (!si) {
        $('#mascota_fecha_esterilizacion').val('').prop('disabled', false);
        $('#mascota_esterilizacion_desconocida').prop('checked', false);
    }
};

const alCambiarEsterilizadoDesconocidoMascota = () => {
    var desconocido = $('#mascota_esterilizado_desconocido').prop('checked');
    $('#mascota_esterilizado').prop('disabled', desconocido);
    if (desconocido) { $('#mascota_esterilizado').val(''); alCambiarEsterilizadoMascota(); }
};

const alCambiarFechaEsterilizacionDesconocidaMascota = () => {
    var desconocida = $('#mascota_esterilizacion_desconocida').prop('checked');
    $('#mascota_fecha_esterilizacion').prop('disabled', desconocida);
    if (desconocida) $('#mascota_fecha_esterilizacion').val('');
};

const alCambiarConviveMascota = () => {
    var si = $('#mascota_convive_animales').val() === 'Sí';
    $('#mascota_convive_cuales_grupo').toggle(si);
    if (si) $('#mascota_convive_cuales').focus(); else $('#mascota_convive_cuales').val('');
};

var fotoMascotaArchivo = null;

/*
 * Foto de la mascota: mismo flujo que la foto de perfil (elegir origen, encuadrar
 * con arrastre y zoom, guardar). El resultado es siempre un recorte cuadrado.
 */
var encuadreMascota = { x: 0, y: 0, escala: 1, minimo: 1, ancho: 0, alto: 0, marco: 0, url: null };

const abrirOpcionesFotoMascota = () => { $('#mascota_foto_bloque').addClass('sheet-abierta'); };
const cerrarOpcionesFotoMascota = () => { $('#mascota_foto_bloque').removeClass('sheet-abierta'); };

const elegirOrigenFotoMascota = (idInput) => {
    cerrarOpcionesFotoMascota();
    var input = document.getElementById(idInput);
    input.value = '';
    input.click();
};

const aplicarEncuadreMascota = () => {
    var e = encuadreMascota;
    var s = e.minimo * e.escala;
    e.x = Math.min(0, Math.max(e.marco - e.ancho * s, e.x));
    e.y = Math.min(0, Math.max(e.marco - e.alto * s, e.y));
    $('#mascota_foto_editor').css('transform', 'translate(' + e.x + 'px,' + e.y + 'px) scale(' + s + ')');
};

const iniciarEncuadreFotoMascota = (archivo) => {
    if (encuadreMascota.url) URL.revokeObjectURL(encuadreMascota.url);
    encuadreMascota.url = URL.createObjectURL(archivo);
    var editor = document.getElementById('mascota_foto_editor');
    editor.onload = function() {
        var e = encuadreMascota;
        $('#mascota_foto_bloque').addClass('con-nueva-foto');
        e.marco = document.getElementById('mascota_foto_marco').clientWidth;
        e.ancho = editor.naturalWidth;
        e.alto = editor.naturalHeight;
        e.minimo = e.marco / Math.min(e.ancho, e.alto);
        e.escala = 1;
        e.x = (e.marco - e.ancho * e.minimo) / 2;
        e.y = (e.marco - e.alto * e.minimo) / 2;
        $('#mascota_foto_zoom').val(100);
        $(editor).css({ width: e.ancho + 'px', height: e.alto + 'px' });
        aplicarEncuadreMascota();
    };
    editor.onerror = function() {
        cancelarFotoMascotaAjustada();
        msg('Foto de la mascota', 'No fue posible leer la imagen. Prueba con otra.', 'error');
    };
    editor.src = encuadreMascota.url;
};

$(document).on('change', '#mascota_foto_galeria, #mascota_foto_camara', function() {
    var archivo = this.files && this.files[0];
    if (!archivo) return;
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type) || archivo.size > 5 * 1024 * 1024) {
        this.value = '';
        msg('Foto de la mascota', 'Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.', 'error');
        return;
    }
    iniciarEncuadreFotoMascota(archivo);
});

$(document).on('input', '#mascota_foto_zoom', function() {
    var e = encuadreMascota;
    var anterior = e.minimo * e.escala;
    var centroX = (e.marco / 2 - e.x) / anterior;
    var centroY = (e.marco / 2 - e.y) / anterior;
    e.escala = this.value / 100;
    var nueva = e.minimo * e.escala;
    e.x = e.marco / 2 - centroX * nueva;
    e.y = e.marco / 2 - centroY * nueva;
    aplicarEncuadreMascota();
});

(function() {
    var arrastre = null;
    $(document).on('pointerdown', '#mascota_foto_bloque.con-nueva-foto #mascota_foto_marco', function(ev) {
        arrastre = { px: ev.originalEvent.clientX, py: ev.originalEvent.clientY, x: encuadreMascota.x, y: encuadreMascota.y };
        try { this.setPointerCapture(ev.originalEvent.pointerId); } catch (err) {}
    });
    $(document).on('pointermove', '#mascota_foto_marco', function(ev) {
        if (!arrastre) return;
        encuadreMascota.x = arrastre.x + (ev.originalEvent.clientX - arrastre.px);
        encuadreMascota.y = arrastre.y + (ev.originalEvent.clientY - arrastre.py);
        aplicarEncuadreMascota();
    });
    $(document).on('pointerup pointercancel', '#mascota_foto_marco', function() { arrastre = null; });
})();

const cancelarFotoMascotaAjustada = () => {
    $('#mascota_foto_galeria, #mascota_foto_camara').val('');
    $('#mascota_foto_bloque').removeClass('con-nueva-foto sheet-abierta');
    if (encuadreMascota.url) {
        URL.revokeObjectURL(encuadreMascota.url);
        encuadreMascota.url = null;
    }
};

// Recorta lo que se ve dentro del marco cuadrado y lo deja listo para enviar.
const guardarFotoMascotaAjustada = () => {
    var e = encuadreMascota;
    var editor = document.getElementById('mascota_foto_editor');
    if (!editor.naturalWidth) return;
    var s = e.minimo * e.escala;
    var lado = 512;
    var lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.drawImage(editor, -e.x / s, -e.y / s, e.marco / s, e.marco / s, 0, 0, lado, lado);
    lienzo.toBlob(function(blob) {
        if (!blob) {
            msg('Foto de la mascota', 'No fue posible preparar la foto.', 'error');
            return;
        }
        fotoMascotaArchivo = new File([blob], 'foto-mascota.jpg', { type: 'image/jpeg' });
        var anterior = $('#mascota_foto_preview').attr('src');
        if (anterior) URL.revokeObjectURL(anterior);
        $('#mascota_foto_preview').attr('src', URL.createObjectURL(blob));
        $('#mascota_foto_bloque').addClass('con-foto');
        $('#mascota_foto_texto').text('Cambiar foto');
        $('#mascota_foto_quitar').show();
        cancelarFotoMascotaAjustada();
    }, 'image/jpeg', 0.9);
};


// ----- Álbum de fotos del fallecimiento: mismo flujo (origen, encuadre, guardar) -----
var encuadreFallec = { x: 0, y: 0, escala: 1, minimo: 1, ancho: 0, alto: 0, marco: 0, url: null };

const abrirOpcionesFotoFallec = () => { $('#fallec_foto_bloque').addClass('sheet-abierta'); };
const cerrarOpcionesFotoFallec = () => { $('#fallec_foto_bloque').removeClass('sheet-abierta'); };

const elegirOrigenFotoFallec = (idInput) => {
    cerrarOpcionesFotoFallec();
    var input = document.getElementById(idInput);
    input.value = '';
    input.click();
};

const aplicarEncuadreFallec = () => {
    var e = encuadreFallec;
    var s = e.minimo * e.escala;
    e.x = Math.min(0, Math.max(e.marco - e.ancho * s, e.x));
    e.y = Math.min(0, Math.max(e.marco - e.alto * s, e.y));
    $('#fallec_foto_editor').css('transform', 'translate(' + e.x + 'px,' + e.y + 'px) scale(' + s + ')');
};

const iniciarEncuadreFotoFallec = (archivo) => {
    if (encuadreFallec.url) URL.revokeObjectURL(encuadreFallec.url);
    encuadreFallec.url = URL.createObjectURL(archivo);
    var editor = document.getElementById('fallec_foto_editor');
    editor.onload = function() {
        var e = encuadreFallec;
        $('#fallec_foto_bloque').addClass('con-nueva-foto');
        e.marco = document.getElementById('fallec_foto_marco').clientWidth;
        e.ancho = editor.naturalWidth;
        e.alto = editor.naturalHeight;
        e.minimo = e.marco / Math.min(e.ancho, e.alto);
        e.escala = 1;
        e.x = (e.marco - e.ancho * e.minimo) / 2;
        e.y = (e.marco - e.alto * e.minimo) / 2;
        $('#fallec_foto_zoom').val(100);
        $(editor).css({ width: e.ancho + 'px', height: e.alto + 'px' });
        aplicarEncuadreFallec();
    };
    editor.onerror = function() {
        cancelarFotoFallecAjustada();
        msg('Álbum de fotos', 'No fue posible leer la imagen. Prueba con otra.', 'error');
    };
    editor.src = encuadreFallec.url;
};

$(document).on('change', '#fallec_foto_galeria, #fallec_foto_camara', function() {
    var archivo = this.files && this.files[0];
    if (!archivo) return;
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type) || archivo.size > 5 * 1024 * 1024) {
        this.value = '';
        msg('Álbum de fotos', 'Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.', 'error');
        return;
    }
    iniciarEncuadreFotoFallec(archivo);
});

$(document).on('input', '#fallec_foto_zoom', function() {
    var e = encuadreFallec;
    var anterior = e.minimo * e.escala;
    var centroX = (e.marco / 2 - e.x) / anterior;
    var centroY = (e.marco / 2 - e.y) / anterior;
    e.escala = this.value / 100;
    var nueva = e.minimo * e.escala;
    e.x = e.marco / 2 - centroX * nueva;
    e.y = e.marco / 2 - centroY * nueva;
    aplicarEncuadreFallec();
});

(function() {
    var arrastre = null;
    $(document).on('pointerdown', '#fallec_foto_bloque.con-nueva-foto #fallec_foto_marco', function(ev) {
        arrastre = { px: ev.originalEvent.clientX, py: ev.originalEvent.clientY, x: encuadreFallec.x, y: encuadreFallec.y };
        try { this.setPointerCapture(ev.originalEvent.pointerId); } catch (err) {}
    });
    $(document).on('pointermove', '#fallec_foto_marco', function(ev) {
        if (!arrastre) return;
        encuadreFallec.x = arrastre.x + (ev.originalEvent.clientX - arrastre.px);
        encuadreFallec.y = arrastre.y + (ev.originalEvent.clientY - arrastre.py);
        aplicarEncuadreFallec();
    });
    $(document).on('pointerup pointercancel', '#fallec_foto_marco', function() { arrastre = null; });
})();

const cancelarFotoFallecAjustada = () => {
    $('#fallec_foto_galeria, #fallec_foto_camara').val('');
    $('#fallec_foto_bloque').removeClass('con-nueva-foto sheet-abierta');
    if (encuadreFallec.url) {
        URL.revokeObjectURL(encuadreFallec.url);
        encuadreFallec.url = null;
    }
};

// Recorta lo que se ve dentro del marco cuadrado y lo deja listo para enviar.
const guardarFotoFallecAjustada = () => {
    var e = encuadreFallec;
    var editor = document.getElementById('fallec_foto_editor');
    if (!editor.naturalWidth) return;
    var s = e.minimo * e.escala;
    var lado = 512;
    var lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    var ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.drawImage(editor, -e.x / s, -e.y / s, e.marco / s, e.marco / s, 0, 0, lado, lado);
    lienzo.toBlob(function(blob) {
        if (!blob) {
            msg('Álbum de fotos', 'No fue posible preparar la foto.', 'error');
            return;
        }
        var archivo = new File([blob], 'album-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        fotosFallecimiento.push({ archivo: archivo, url: URL.createObjectURL(blob) });
        pintarMiniaturasFallecimiento();
        cancelarFotoFallecAjustada();
    }, 'image/jpeg', 0.9);
};


const quitarFotoMascota = () => {
    var anterior = $('#mascota_foto_preview').attr('src');
    if (anterior) URL.revokeObjectURL(anterior);
    fotoMascotaArchivo = null;
    $('#mascota_foto_preview').removeAttr('src');
    $('#mascota_foto_bloque').removeClass('con-foto');
    $('#mascota_foto_texto').text('Agregar foto');
    $('#mascota_foto_quitar').hide();
    cancelarFotoMascotaAjustada();
};

const anadirMascota = () => {
    $('#form-mascota')[0].reset();
    alCambiarEspecieMascota();
    alCambiarFechaDesconocidaMascota();
    alCambiarEsterilizadoMascota();
    alCambiarConviveMascota();
    quitarFotoMascota();
    vista('anadir-mascota');
};

// El servicio para crear mascotas desde la app aún no existe en el backend
// (solo hay GET paciente/mis_mascotas_app). Cuando esté disponible, enviar
// aquí los datos de "datos" con api.request(datos, ok, error, 'POST').
const guardarMascota = (evento) => {
    if (evento) evento.preventDefault();
    var datos = {
        nombre: $.trim($('#mascota_nombre').val()),
        especie: $('#mascota_especie').val() === 'Otra' ? $.trim($('#mascota_especie_otra').val()) : $('#mascota_especie').val(),
        raza: $.trim($('#mascota_raza').val()),
        tamano: $('#mascota_tamano').val(),
        esterilizado: $('#mascota_esterilizado_desconocido').prop('checked') ? '' : $('#mascota_esterilizado').val(),
        esterilizado_desconocido: $('#mascota_esterilizado_desconocido').prop('checked'),
        vacunacion_al_dia: $('#mascota_vacunacion').val(),
        fecha_ultima_desparasitacion: $('#mascota_desparasitacion_fecha').val(),
        producto_desparasitacion: $.trim($('#mascota_desparasitacion_producto').val()),
        tipo_desparasitacion: $('#mascota_desparasitacion_tipo').val(),
        convive_con_otros_animales: $('#mascota_convive_animales').val(),
        foto: fotoMascotaArchivo,
        convive_cuales: $('#mascota_convive_animales').val() === 'Sí' ? $.trim($('#mascota_convive_cuales').val()) : '',
        fecha_esterilizacion: ($('#mascota_esterilizado').val() === 'Sí' && !$('#mascota_esterilizacion_desconocida').prop('checked')) ? $('#mascota_fecha_esterilizacion').val() : '',
        fecha_esterilizacion_desconocida: $('#mascota_esterilizado').val() === 'Sí' && $('#mascota_esterilizacion_desconocida').prop('checked'),
        sexo: $('#mascota_sexo').val(),
        fecha_nacimiento: $('#mascota_nacimiento_desconocida').prop('checked') ? '' : $('#mascota_nacimiento').val(),
        fecha_nacimiento_desconocida: $('#mascota_nacimiento_desconocida').prop('checked'),
        comportamiento: $.trim($('#mascota_comportamiento').val()),
        color: $.trim($('#mascota_color').val()),
        peso: $('#mascota_peso').val(),
        microchip: $.trim($('#mascota_chip').val()),
        enfermedades: $.trim($('#mascota_enfermedades').val())
    };
    if (!datos.nombre) { msg('Añadir mascota', 'Ingresa el nombre de tu mascota.', 'warning'); return false; }
    if (!$('#mascota_especie').val()) { msg('Añadir mascota', 'Selecciona la especie.', 'warning'); return false; }
    if (!datos.especie) { msg('Añadir mascota', 'Escribe cuál es la especie.', 'warning'); return false; }
    if (!datos.raza) { msg('Añadir mascota', 'Ingresa la raza de tu mascota (o escribe "Mestizo").', 'warning'); return false; }
    if (!datos.tamano) { msg('Añadir mascota', 'Selecciona el tamaño.', 'warning'); return false; }
    if (!datos.sexo) { msg('Añadir mascota', 'Selecciona el sexo.', 'warning'); return false; }
    if (!datos.fecha_nacimiento && !datos.fecha_nacimiento_desconocida) { msg('Añadir mascota', 'Ingresa la fecha de nacimiento o marca "Desconozco la fecha de nacimiento".', 'warning'); return false; }
    if (!datos.esterilizado && !datos.esterilizado_desconocido) { msg('Añadir mascota', 'Indica si está esterilizado/a o marca "No sé si está esterilizado/a".', 'warning'); return false; }
    msg('Añadir mascota', 'El registro de mascotas desde la app aún no está habilitado.', 'warning');
    return false;
};

// Ojo para ver u ocultar la contraseña en los campos de Mi perfil.
const verClavePerfil = (id, boton) => {
    var $input = $('#' + id);
    var mostrar = $input.attr('type') === 'password';
    $input.attr('type', mostrar ? 'text' : 'password');
    $(boton).toggleClass('activo', mostrar).attr('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
};
