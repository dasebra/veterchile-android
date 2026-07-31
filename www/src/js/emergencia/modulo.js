const emergencyRequest = (path, method, data, success, error) => {
    $.ajax({
        url: MEDSDI_API_URL + '/emergency-doctor' + path,
        method: method,
        data: data ? JSON.stringify(data) : undefined,
        contentType: data ? 'application/json' : undefined,
        dataType: 'json',
        headers: {'Accept': 'application/json', 'X-Auth-Token': localStorage.getItem('authToken')},
        success: success,
        error: function (xhr) {
            if (typeof error === 'function') return error(xhr);
            const response = xhr.responseJSON || {};
            msg('Contacto de emergencia', response.message || 'No fue posible completar la operación.', 'error');
        }
    });
};

const abrirMedicoEmergencia = () => {
    vista('medico-emergencia-app', 'fade');
    cargarMedicoEmergencia();
};

const cargarMedicoEmergencia = () => {
    emergencyRequest('', 'GET', null, function (response) {
        const patientRole = response.role === 'patient';
        $('#emergency-patient-panel').toggle(patientRole);
        $('#emergency-professional-panel').toggle(!patientRole);

        if (patientRole) {
            renderEmergencyPatientLink(response.link);
        } else {
            renderEmergencyProfessionalLinks(response.links || []);
        }
    });
};

const renderEmergencyPatientLink = (link) => {
    const $summary = $('#medico-emergencia-resumen');
    if (!link) {
        $summary.text('Configura un contacto médico');
        $('#boton-panico-paciente').hide();
        $('#emergency-current-link').html('<div class="emergency-empty"><strong>Sin médico enlazado</strong><p>Busca un profesional para enviarle una solicitud.</p></div>');
        return;
    }

    const professional = link.professional || {};
    const active = link.status === 'active';
    $summary.text(active ? professional.name : 'Solicitud pendiente de aceptación');
    $('#boton-panico-paciente').toggle(active);
    const status = active ? 'Vínculo activo' : 'Esperando aceptación';
    $('#emergency-current-link').html(
        '<article class="emergency-link-card">' +
        '<span class="emergency-link-icon">♥</span><div><small>' + status + '</small><h2>' +
        escapeEmergency(professional.name || 'Profesional') + '</h2><p>' +
        escapeEmergency(professional.specialty || '') + '</p></div>' +
        '<button type="button" onclick="revocarMedicoEmergencia(' + link.id + ')">Quitar</button></article>'
    );
};

const buscarProfesionalEmergencia = () => {
    const query = $.trim($('#emergency-professional-query').val());
    if (query.length < 3) {
        msg('Buscar profesional', 'Ingresa al menos tres caracteres.', 'warning');
        return;
    }
    $('#emergency-professional-results').html('<div class="app-estado-carga"><span class="app-spinner"></span></div>');
    emergencyRequest('/professionals?q=' + encodeURIComponent(query), 'GET', null, function (items) {
        const html = items.length ? items.map(function (item) {
            return '<article class="emergency-result"><div><strong>' + escapeEmergency(item.name) +
                '</strong><small>' + escapeEmergency(item.specialty) + '</small></div>' +
                '<button type="button" onclick="solicitarMedicoEmergencia(' + item.id + ')">Enlazar</button></article>';
        }).join('') : '<div class="emergency-empty"><p>No encontramos profesionales.</p></div>';
        $('#emergency-professional-results').html(html);
    });
};

const solicitarMedicoEmergencia = (professionalId) => {
    emergencyRequest('/links', 'POST', {professional_id: professionalId}, function (response) {
        msg('Médico de emergencia', 'Solicitud enviada al profesional.', 'success');
        $('#emergency-professional-results').empty();
        renderEmergencyPatientLink(response.link);
    });
};

const decidirVinculoEmergencia = (linkId, decision) => {
    emergencyRequest('/links/' + linkId + '/decision', 'POST', {decision: decision}, function () {
        msg('Contacto de emergencia', decision === 'accept' ? 'Vínculo aceptado.' : 'Solicitud rechazada.', 'success');
        cargarMedicoEmergencia();
    });
};

const revocarMedicoEmergencia = (linkId) => {
    emergencyRequest('/links/' + linkId, 'DELETE', null, function () {
        msg('Contacto de emergencia', 'El vínculo fue retirado.', 'success');
        cargarMedicoEmergencia();
    });
};

const renderEmergencyProfessionalLinks = (links) => {
    const html = links.length ? links.map(function (link) {
        const pending = link.status === 'pending';
        return '<article class="emergency-link-card professional"><span class="emergency-link-icon">♥</span>' +
            '<div><small>' + (pending ? 'Solicitud pendiente' : 'Paciente vinculado') + '</small>' +
            '<h2>' + escapeEmergency(link.patient) + '</h2></div>' +
            (pending ? '<div class="emergency-link-actions"><button class="reject" onclick="decidirVinculoEmergencia(' +
                link.id + ',&quot;reject&quot;)">Rechazar</button><button onclick="decidirVinculoEmergencia(' +
                link.id + ',&quot;accept&quot;)">Aceptar</button></div>' :
                (link.phone ? '<a href="tel:' + encodeURIComponent(link.phone) + '">Llamar</a>' : '')) +
            '</article>';
    }).join('') : '<div class="emergency-empty"><strong>Sin solicitudes</strong><p>No tienes pacientes de emergencia vinculados.</p></div>';
    $('#emergency-professional-links').html(html);
};

var emergencyPressTimer = null;
const iniciarPulsacionSOS = (event) => {
    if (event) event.preventDefault();
    $('#boton-panico-paciente').addClass('pressing');
    emergencyPressTimer = setTimeout(function () {
        emergencyPressTimer = null;
        $('#boton-panico-paciente').removeClass('pressing');
        confirmarAlertaEmergencia();
    }, 1300);
};

const cancelarPulsacionSOS = () => {
    if (emergencyPressTimer) clearTimeout(emergencyPressTimer);
    emergencyPressTimer = null;
    $('#boton-panico-paciente').removeClass('pressing');
};

const confirmarAlertaEmergencia = () => {
    const execute = function (button) {
        if (button === 1) enviarAlertaEmergencia();
    };
    if (navigator.notification && navigator.notification.confirm) {
        navigator.notification.confirm(
            'Se avisará a tu médico vinculado y se abrirá una llamada. Si existe riesgo vital, contacta al servicio oficial de emergencias.',
            execute, 'Confirmar alerta SOS', ['Alertar y llamar', 'Cancelar']
        );
    } else if (window.confirm('¿Enviar alerta SOS y llamar a tu médico?')) {
        enviarAlertaEmergencia();
    }
};

const enviarAlertaEmergencia = () => {
    const send = function (position) {
        const data = position ? {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        } : {};
        emergencyRequest('/alerts', 'POST', data, function (response) {
            msg('Alerta SOS', 'La alerta fue registrada. Intentando llamar al profesional.', 'success');
            const phone = response.doctor && response.doctor.phone;
            if (phone) window.location.href = 'tel:' + phone.replace(/[^+0-9]/g, '');
            else msg('Alerta SOS', 'El profesional no tiene un teléfono disponible.', 'warning');
        });
    };
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(send, function () { send(null); }, {
            enableHighAccuracy: true, timeout: 5000, maximumAge: 60000
        });
    } else {
        send(null);
    }
};

const escapeEmergency = (value) => $('<div>').text(value || '').html();

$(document).on('pageshow', '#index', function () {
    if (localStorage.getItem('rolActivo') === 'Paciente') cargarMedicoEmergenciaResumen();
});

const cargarMedicoEmergenciaResumen = () => {
    emergencyRequest('', 'GET', null, function (response) {
        if (response.role === 'patient') renderEmergencyPatientLink(response.link);
    }, function () {});
};
