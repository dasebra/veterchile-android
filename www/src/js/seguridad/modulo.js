const mobileTwoFactorRequest = (path, method, data, success) => {
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

            const text = xhr.status === 409 ? 'Este acceso ya fue resuelto o expiró.' : 'No fue posible comunicarse con MED-SDI.';
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
    $('#lista-desafios-acceso').html('<p class="text-center">Buscando solicitudes…</p>');
    mobileTwoFactorRequest('challenges', 'GET', null, function (items) {
        if (!items.length) {
            $('#lista-desafios-acceso').html('<p class="text-center color-gris">No hay accesos pendientes.</p>');
            return;
        }

        const html = items.map(function (item) {
            return '<div class="panel panel-default mb20"><div class="panel-body">' +
                '<p class="txt_bold color-azul">Nuevo acceso a MED-SDI</p>' +
                '<p class="size12">IP: ' + escaparHtml(item.ip_address || 'No disponible') + '</p>' +
                '<p class="size12">Dispositivo: ' + escaparHtml(item.device) + '</p>' +
                '<div class="row mt15"><div class="col-xs-6"><button class="btn btn-success btn-block" onclick="resolverDesafioAcceso(\'' + item.id + '\', \'approved\')">APROBAR</button></div>' +
                '<div class="col-xs-6"><button class="btn btn-danger btn-block" onclick="resolverDesafioAcceso(\'' + item.id + '\', \'rejected\')">RECHAZAR</button></div></div></div></div>';
        }).join('');
        $('#lista-desafios-acceso').html(html);
    });
};

const resolverDesafioAcceso = (id, decision) => {
    mobileTwoFactorRequest('challenges/' + encodeURIComponent(id) + '/decision', 'POST', {decision: decision}, function () {
        msg('Seguridad', decision === 'approved' ? 'Acceso aprobado.' : 'Acceso rechazado.', 'success');
        cargarDesafiosAcceso();
    });
};

const escaparHtml = (value) => $('<div>').text(value || '').html();
