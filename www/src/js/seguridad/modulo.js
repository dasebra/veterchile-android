const mobileTwoFactorRequest = (path, method, data, success, errorCallback) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        msg('Seguridad', 'Debes iniciar sesión para revisar los accesos.', 'warning');
        return;
    }

    $.ajax({
        url: MEDSDI_API_URL + '/mobile-2fa/' + path,
        method: method,
        data: data ? JSON.stringify(data) : undefined,
        contentType: data ? 'application/json' : undefined,
        dataType: 'json',
        headers: {'Accept': 'application/json', 'X-Auth-Token': token},
        success: success,
        error: function (xhr) {
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.setItem('desafioAccesoPendiente', '1');
                vista('login', 'fade');
                msg('Seguridad', 'Tu sesión móvil terminó. Inicia sesión nuevamente.', 'warning');
                return;
            }
            if (typeof errorCallback === 'function') {
                errorCallback(xhr);
                return;
            }
            const text = xhr.status === 409
                ? 'Este acceso ya fue resuelto o expiró.'
                : 'No fue posible comunicarse con MED-SDI.';
            msg('Seguridad', text, 'error');
        }
    });
};

const abrirDesafiosAcceso = () => {
    if (!localStorage.getItem('authToken')) {
        localStorage.setItem('desafioAccesoPendiente', '1');
        vista('login', 'fade');
        msg('Seguridad', 'Inicia sesión para revisar los accesos.', 'warning');
        return;
    }
    vista('desafios-acceso', 'fade');
    cargarDesafiosAcceso();
};

const volverDesdeDesafiosAcceso = () => {
    const rolActivo = localStorage.getItem('rolActivo');
    vista(rolActivo === 'Profesional' ? 'inicio-profesional' : 'index', 'fade');
};

const cargarDesafiosAcceso = () => {
    $('#lista-desafios-acceso').html(
        '<div class="app-estado-carga"><span class="app-spinner"></span><p>Buscando solicitudes seguras…</p></div>'
    );

    mobileTwoFactorRequest('challenges', 'GET', null, function (items) {
        if (!items.length) {
            $('#lista-desafios-acceso').html(
                '<div class="app-estado-vacio">' +
                    '<span class="app-estado-vacio-icono">✓</span>' +
                    '<strong>Todo está en orden</strong>' +
                    '<p>No tienes solicitudes de acceso pendientes.</p>' +
                '</div>'
            );
            return;
        }

        const html = items.map(function (item) {
            return '<article class="desafio-acceso-card">' +
                '<div class="desafio-acceso-cabecera">' +
                    '<span class="desafio-acceso-icono">↗</span>' +
                    '<div><strong>Nuevo acceso a MED-SDI</strong><span>Esperando tu confirmación</span></div>' +
                    '<span class="desafio-acceso-estado">Pendiente</span>' +
                '</div>' +
                '<div class="desafio-acceso-datos">' +
                    '<div><span class="desafio-dato-icono">⌖</span><p><small>Ubicación aproximada</small>' +
                        escaparHtml(item.location || 'No disponible') + '</p></div>' +
                    '<div><span class="desafio-dato-icono">▣</span><p><small>Dispositivo</small>' +
                        escaparHtml(nombreDispositivoAcceso(item.device)) + '</p></div>' +
                '</div>' +
                '<div class="desafio-acceso-acciones">' +
                    '<button type="button" class="desafio-btn rechazar" onclick="confirmarDesafioAcceso(\'' + item.id + '\', \'rejected\')">Rechazar</button>' +
                    '<button type="button" class="desafio-btn aprobar" onclick="confirmarDesafioAcceso(\'' + item.id + '\', \'approved\')">✓ Aprobar acceso</button>' +
                '</div>' +
            '</article>';
        }).join('');
        $('#lista-desafios-acceso').html(html);
    });
};

const nombreDispositivoAcceso = (device) => {
    const texto = String(device || '');
    if (/android/i.test(texto)) return 'Teléfono o tablet Android';
    if (/iphone|ipad/i.test(texto)) return 'iPhone o iPad';
    if (/windows/i.test(texto)) return 'Computador Windows';
    if (/macintosh|mac os/i.test(texto)) return 'Computador Mac';
    if (/linux/i.test(texto)) return 'Computador Linux';
    return texto || 'Dispositivo no identificado';
};

const confirmarDesafioAcceso = (id, decision) => {
    const aprobar = decision === 'approved';
    $('#desafio-confirmacion-overlay')
        .addClass('visible')
        .attr('aria-hidden', 'false')
        .data('challenge-id', id)
        .data('decision', decision);
    $('#desafio-confirmacion-icono').toggleClass('rechazar', !aprobar).text(aprobar ? '✓' : '!');
    $('#desafio-confirmacion-titulo').text(aprobar ? 'Aprobar este acceso' : 'Rechazar este acceso');
    $('#desafio-confirmacion-texto').text(
        aprobar
            ? 'Confirma que reconoces este ingreso a tu cuenta.'
            : 'Confirma tu identidad para bloquear esta solicitud.'
    );
    $('#desafio-confirmar-clave').text(aprobar ? 'Aprobar con clave SDI' : 'Rechazar con clave SDI');
    $('#desafio_clave_web').val('').attr('type', 'password');
    $('#desafio-ver-clave').text('Ver');
    $('#desafio-confirmacion-error').text('');

    const biometriaDisponible = biometriaHabilitadaApp()
        && typeof Fingerprint !== 'undefined';
    $('#desafio-confirmar-huella').toggle(biometriaDisponible);
    $('#desafio-huella-ayuda').text(
        biometriaDisponible
            ? ''
            : 'Activa la autorización con huella desde Editar perfil para usar esta opción.'
    );
    setTimeout(function () { $('#desafio_clave_web').focus(); }, 150);
};

const cerrarConfirmacionDesafio = () => {
    $('#desafio-confirmacion-overlay')
        .removeClass('visible')
        .attr('aria-hidden', 'true')
        .removeData('challenge-id')
        .removeData('decision');
    $('#desafio_clave_web').val('');
    $('#desafio-confirmacion-error').text('');
};

const alternarVisibilidadClaveDesafio = () => {
    const $input = $('#desafio_clave_web');
    const mostrar = $input.attr('type') === 'password';
    $input.attr('type', mostrar ? 'text' : 'password');
    $('#desafio-ver-clave').text(mostrar ? 'Ocultar' : 'Ver');
};

const obtenerDecisionDesafioActual = () => {
    const $overlay = $('#desafio-confirmacion-overlay');
    return {
        id: String($overlay.data('challenge-id') || ''),
        decision: String($overlay.data('decision') || '')
    };
};

const resolverDesafioConClave = () => {
    const actual = obtenerDecisionDesafioActual();
    const credential = $.trim($('#desafio_clave_web').val());
    if (!/^\d{4}$/.test(credential)) {
        $('#desafio-confirmacion-error').text('Ingresa tu clave SDI de 4 dígitos.');
        $('#desafio_clave_web').focus();
        return;
    }
    resolverDesafioAcceso(actual.id, actual.decision, 'device_pin', credential);
};

const resolverDesafioConBiometria = () => {
    const actual = obtenerDecisionDesafioActual();
    if (!biometriaHabilitadaApp() || typeof Fingerprint === 'undefined') {
        $('#desafio-confirmacion-error').text('La huella no está habilitada para esta cuenta.');
        return;
    }

    Fingerprint.loadBiometricSecret(
        opcionesBiometriaApp(
            actual.decision === 'approved'
                ? 'Confirma tu huella para aprobar este acceso.'
                : 'Confirma tu huella para rechazar este acceso.'
        ),
        function (secreto) {
            try {
                const boveda = decodificarBovedaBiometricaApp(secreto);
                if (!boveda.pin) {
                    throw new Error('Vuelve a activar la autorización con huella desde Editar perfil.');
                }
                resolverDesafioAcceso(actual.id, actual.decision, 'biometric', boveda.pin);
            } catch (error) {
                $('#desafio-confirmacion-error').text(error.message);
            }
        },
        function (error) {
            if (error && Number(error.code) === -113) {
                localStorage.removeItem('biometria_login_habilitada');
                localStorage.removeItem('biometria_login_usuario');
                $('#desafio-confirmar-huella').hide();
            }
            $('#desafio-confirmacion-error').text(
                (error && error.message) || 'No fue posible validar la huella.'
            );
        }
    );
};

const resolverDesafioAcceso = (id, decision, authMethod, credential) => {
    if (!id || !decision) return;
    const uuid = typeof obtenerUuidDispositivo === 'function'
        ? obtenerUuidDispositivo()
        : (localStorage.getItem('uuid') || '');
    if (!uuid || uuid === '0') {
        $('#desafio-confirmacion-error').text(
            'Este navegador no tiene un dispositivo SDI registrado. Inicia sesión y registra este equipo antes de aprobar el acceso.'
        );
        return;
    }
    $('#desafio-confirmacion-error').text('');
    $('#desafio-confirmar-clave, #desafio-confirmar-huella').prop('disabled', true);

    mobileTwoFactorRequest('challenges/' + encodeURIComponent(id) + '/decision', 'POST', {
        decision: decision,
        auth_method: authMethod,
        credential: credential,
        uuid: uuid
    }, function () {
        $('#desafio-confirmar-clave, #desafio-confirmar-huella').prop('disabled', false);
        cerrarConfirmacionDesafio();
        msg('Seguridad', decision === 'approved' ? 'Acceso aprobado.' : 'Acceso rechazado.', 'success');
        cargarDesafiosAcceso();
    }, function (xhr) {
        $('#desafio-confirmar-clave, #desafio-confirmar-huella').prop('disabled', false);
        const respuesta = xhr.responseJSON || {};
        if (xhr.status === 422) {
            const errores = respuesta.errors || {};
            const primerCampo = Object.keys(errores)[0];
            const detalle = primerCampo && Array.isArray(errores[primerCampo])
                ? errores[primerCampo][0]
                : '';
            $('#desafio-confirmacion-error').text(
                detalle || respuesta.message || 'La clave SDI no es correcta.'
            );
            $('#desafio_clave_web').val('').focus();
            return;
        }
        if (xhr.status === 409) {
            cerrarConfirmacionDesafio();
            msg('Seguridad', 'Este acceso ya fue resuelto o expiró.', 'warning');
            cargarDesafiosAcceso();
            return;
        }
        $('#desafio-confirmacion-error').text(
            respuesta.message || 'No fue posible comunicarse con MED-SDI.'
        );
    });
};

const escaparHtml = (value) => $('<div>').text(value || '').html();

$(document).on('keyup', '#desafio_clave_web', function (event) {
    if (event.key === 'Enter') resolverDesafioConClave();
});
