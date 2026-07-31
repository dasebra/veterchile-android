$(document).on( "pageshow","#autorizacion",function( event ) {
    const esProfesional = localStorage.getItem('rolActivo') === 'Profesional';
    const $opcionesFooter = $('#autorizacion')
        .find('[data-role="footer"] .row')
        .first()
        .children();

    $opcionesFooter.eq(0).find('p').attr('onclick', 'volverInicioSegunRol()');
    $opcionesFooter.eq(1).toggle(!esProfesional);
    $opcionesFooter.eq(0).add($opcionesFooter.eq(2))
        .toggleClass('col-xs-4', !esProfesional)
        .toggleClass('col-xs-6', esProfesional);

    actualizarBotonBiometriaAutorizacion();
});

const claveBiometriaApp = () => {
    return 'biometria_habilitada_' +
        String(_SESSION('id_usuario') || 'sin_usuario') + '_' +
        String(typeof obtenerUuidDispositivo === 'function' ? obtenerUuidDispositivo() : 'sin_uuid');
};

const biometriaHabilitadaApp = () => {
    return localStorage.getItem(claveBiometriaApp()) === '1';
};

const loginBiometricoHabilitadoApp = () => {
    return localStorage.getItem('biometria_login_habilitada') === '1';
};

const codificarBovedaBiometricaApp = (datos) => {
    var bytes = new TextEncoder().encode(JSON.stringify(datos));
    return Array.prototype.map.call(bytes, function(byte) {
        return byte.toString(16).padStart(2, '0');
    }).join('');
};

const decodificarBovedaBiometricaApp = (secreto) => {
    // Compatibilidad con el PIN guardado antes de incorporar login biométrico.
    if (/^\d{4}$/.test(String(secreto || ''))) {
        return {pin: String(secreto)};
    }

    var texto = String(secreto || '');
    if (!texto || texto.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(texto)) {
        throw new Error('La credencial biométrica no tiene un formato válido.');
    }

    var bytes = new Uint8Array(texto.match(/.{2}/g).map(function(hex) {
        return parseInt(hex, 16);
    }));
    return JSON.parse(new TextDecoder().decode(bytes));
};

const opcionesBiometriaApp = (descripcion) => ({
    title: 'MED-SDI',
    subtitle: 'Autorización segura',
    description: descripcion,
    disableBackup: true,
    cancelButtonTitle: 'Cancelar',
    confirmationRequired: true,
    requireStrongBiometrics: true
});

const comprobarBiometriaApp = (disponible, noDisponible) => {
    if (typeof Fingerprint === 'undefined') {
        if (typeof noDisponible === 'function') noDisponible({message: 'Disponible únicamente en la aplicación Android.'});
        return;
    }

    Fingerprint.isAvailable(
        function(tipo) {
            if (typeof disponible === 'function') disponible(tipo);
        },
        function(error) {
            if (typeof noDisponible === 'function') noDisponible(error || {});
        },
        {requireStrongBiometrics: true}
    );
};

const actualizarEstadoBiometriaApp = () => {
    var $estado = $('#perfil_app_biometria_estado');
    var $activar = $('#perfil_app_biometria_activar');
    var $desactivar = $('#perfil_app_biometria_desactivar');

    comprobarBiometriaApp(function() {
        var habilitada = biometriaHabilitadaApp();
        $estado.text(habilitada
            ? 'La huella digital está activada para esta cuenta y este dispositivo.'
            : 'El dispositivo admite autenticación biométrica.');
        $activar.toggle(!habilitada);
        $desactivar.toggle(habilitada);
        actualizarEstadoLoginBiometricoApp();
    }, function(error) {
        $estado.text((error && error.message) || 'No hay una huella digital configurada en este dispositivo.');
        $activar.hide();
        $desactivar.hide();
    });
};

const registrarBovedaBiometricaApp = (boveda, descripcion, exito, error) => {
    Fingerprint.registerBiometricSecret(
        Object.assign(opcionesBiometriaApp(descripcion), {
            secret: codificarBovedaBiometricaApp(boveda),
            invalidateOnEnrollment: true
        }),
        exito,
        error
    );
};

const registrarSecretoBiometricoApp = (pin, exito, error) => {
    var boveda = {pin: String(pin)};
    if (loginBiometricoHabilitadoApp()) {
        boveda.user = localStorage.getItem('biometria_login_usuario') || _SESSION('email') || '';
        boveda.pass = _SESSION('pass') || '';
    }
    registrarBovedaBiometricaApp(
        boveda,
        'Confirma tu huella para proteger la clave SDI.',
        exito,
        error
    );
};

const activarBiometriaApp = () => {
    var pinIngresado = $.trim($('#perfil_app_biometria_pin').val());
    var pinDispositivo = localStorage.getItem('password') || $('#pass_device').val();

    if (!/^\d{4}$/.test(pinIngresado)) {
        msg('Huella digital', 'Ingresa el PIN actual de 4 dígitos de este dispositivo.', 'error');
        $('#perfil_app_biometria_pin').focus();
        return;
    }
    if (pinIngresado !== pinDispositivo) {
        msg('Huella digital', 'La clave actual no es correcta.', 'error');
        return;
    }

    comprobarBiometriaApp(function() {
        registrarSecretoBiometricoApp(pinIngresado, function() {
            localStorage.setItem(claveBiometriaApp(), '1');
            $('#perfil_app_biometria_pin').val('');
            actualizarEstadoBiometriaApp();
            msg('Huella digital', 'La huella quedó activada correctamente.', 'success');
        }, function(error) {
            msg('Huella digital', (error && error.message) || 'No fue posible activar la huella.', 'error');
        });
    }, function(error) {
        msg('Huella digital', (error && error.message) || 'La biometría no está disponible.', 'error');
    });
};

const desactivarBiometriaApp = () => {
    localStorage.removeItem(claveBiometriaApp());
    actualizarEstadoBiometriaApp();
    msg('Huella digital', 'El acceso con huella fue desactivado para esta cuenta.', 'success');
};

const actualizarEstadoLoginBiometricoApp = () => {
    var habilitado = loginBiometricoHabilitadoApp();
    $('#perfil_app_biometria_login_estado').text(habilitado
        ? 'Podrás ingresar con huella usando la cuenta ' + (localStorage.getItem('biometria_login_usuario') || '') + '.'
        : 'El ingreso con huella está desactivado.');
    $('#perfil_app_biometria_login_activar').toggle(!habilitado);
    $('#perfil_app_biometria_login_desactivar').toggle(habilitado);
    $('#perfil_app_password_login').val('');
    actualizarBotonLoginBiometricoApp();
};

const activarLoginBiometricoApp = () => {
    var password = $('#perfil_app_password_login').val();
    var email = _SESSION('email') || '';
    var passwordSesion = _SESSION('pass') || '';
    var pin = localStorage.getItem('password') || $('#pass_device').val() || '';

    if (!password) {
        msg('Ingreso con huella', 'Ingresa la contraseña actual de tu cuenta.', 'error');
        return;
    }
    if (!passwordSesion || password !== passwordSesion) {
        msg('Ingreso con huella', 'La contraseña de la cuenta no es correcta.', 'error');
        return;
    }

    comprobarBiometriaApp(function() {
        registrarBovedaBiometricaApp(
            {pin: pin, user: email, pass: password},
            'Confirma tu huella para activar el inicio de sesión biométrico.',
            function() {
                localStorage.setItem('biometria_login_habilitada', '1');
                localStorage.setItem('biometria_login_usuario', email);
                actualizarEstadoLoginBiometricoApp();
                msg('Ingreso con huella', 'El inicio de sesión con huella quedó activado.', 'success');
            },
            function(error) {
                msg('Ingreso con huella', (error && error.message) || 'No fue posible activar el ingreso biométrico.', 'error');
            }
        );
    }, function(error) {
        msg('Ingreso con huella', (error && error.message) || 'La biometría no está disponible.', 'error');
    });
};

const desactivarLoginBiometricoApp = () => {
    localStorage.removeItem('biometria_login_habilitada');
    localStorage.removeItem('biometria_login_usuario');
    actualizarEstadoLoginBiometricoApp();
    msg('Ingreso con huella', 'El inicio de sesión con huella fue desactivado.', 'success');
};

const actualizarBotonLoginBiometricoApp = () => {
    var disponible = typeof Fingerprint !== 'undefined';
    $('#login_con_biometria').toggle(disponible);
};

const ingresarConBiometriaApp = () => {
    if (typeof Fingerprint === 'undefined') {
        msg('Ingreso con huella', 'El ingreso biométrico no está habilitado.', 'warning');
        return;
    }

    Fingerprint.loadBiometricSecret(
        opcionesBiometriaApp('Confirma tu huella para ingresar a MED-SDI.'),
        function(secreto) {
            try {
                var boveda = decodificarBovedaBiometricaApp(secreto);
                if (!boveda.user || !boveda.pass) {
                    throw new Error('No hay credenciales de inicio de sesión protegidas.');
                }
                localStorage.setItem('biometria_login_habilitada', '1');
                localStorage.setItem('biometria_login_usuario', boveda.user);
                if (boveda.pin) {
                    sessionStorage.setItem('biometria_pin_recuperada', '1');
                }
                $('#user').val(boveda.user);
                $('#pass').val(boveda.pass);
                ingresarLogin();
            } catch (error) {
                msg('Ingreso con huella', error.message, 'error');
            }
        },
        function(error) {
            if (error && Number(error.code) === -113) {
                localStorage.removeItem('biometria_login_habilitada');
                localStorage.removeItem('biometria_login_usuario');
                actualizarBotonLoginBiometricoApp();
            }
            msg('Ingreso con huella', (error && error.message) || 'No fue posible validar la huella.', 'error');
        }
    );
};

const restaurarEstadoBiometricoTrasLogin = () => {
    if (sessionStorage.getItem('biometria_pin_recuperada') !== '1') return;
    localStorage.setItem(claveBiometriaApp(), '1');
    sessionStorage.removeItem('biometria_pin_recuperada');
};

const actualizarSecretoBiometricoApp = (nuevoPin) => {
    if (!biometriaHabilitadaApp() || typeof Fingerprint === 'undefined') return;

    registrarSecretoBiometricoApp(nuevoPin, function() {
        localStorage.setItem(claveBiometriaApp(), '1');
    }, function() {
        localStorage.removeItem(claveBiometriaApp());
        actualizarEstadoBiometriaApp();
    });
};

const actualizarBotonBiometriaAutorizacion = () => {
    var mostrar = biometriaHabilitadaApp() && typeof Fingerprint !== 'undefined';
    $('#autorizar_con_biometria').toggle(mostrar);
    $('#autorizar_con_biometria_texto').text(
        accion_log_actual === 2 ? 'Rechazar con huella' : 'Autorizar con huella'
    );
};

const respuestaBiometrica = () => {
    if (!biometriaHabilitadaApp() || typeof Fingerprint === 'undefined') {
        msg('Huella digital', 'La huella no está habilitada para esta cuenta.', 'warning');
        return;
    }

    Fingerprint.loadBiometricSecret(
        opcionesBiometriaApp(
            accion_log_actual === 2
                ? 'Confirma tu huella para rechazar la solicitud.'
                : 'Confirma tu huella para autorizar la solicitud.'
        ),
        function(secreto) {
            try {
                var boveda = decodificarBovedaBiometricaApp(secreto);
                if (!boveda.pin) {
                    throw new Error('No hay una clave SDI protegida con huella.');
                }
                $('#password_').val(boveda.pin);
                respuesta(accion_log_actual === 2 ? 2 : 1);
            } catch (error) {
                msg('Huella digital', error.message, 'error');
            }
        },
        function(error) {
            if (error && Number(error.code) === -113) {
                localStorage.removeItem(claveBiometriaApp());
                actualizarBotonBiometriaAutorizacion();
            }
            msg('Huella digital', (error && error.message) || 'No fue posible validar la huella.', 'error');
        }
    );
};


const respuesta = (estado) => {

    var pass_device1 = $.trim($('#password_').val());
    var pass_device2 = localStorage.getItem('password') || $('#pass_device').val();

    // Nunca usar el valor inicial "0" como clave de autorización.
    if (!pass_device2 || pass_device2 === '0') {
        if (typeof checkDevice === 'function') {
            checkDevice(function (claveDisponible) {
                if (claveDisponible) {
                    respuesta(estado);
                    return;
                }

                navigator.notification.alert(
                    'El dispositivo no tiene una clave activa para esta cuenta.',
                    function () {},
                    'Clave no disponible',
                    'Cerrar'
                );
            }, true);
        }
        return false;
    }

    if(pass_device1!=pass_device2)
    {
        if($('#uuid').val()!=0)
        {
            navigator.notification.alert('Clave Incorrecta, vuelva a ingresar.', ()=>{}, ['Clave Incorrecta'], ['Cerrar'])
            $('#password_').val('').focus();
            return false;
        }else{
            alert('Clave Incorrecta');
            $('#password_').val('').focus();
            return false;
        }
    }
    
    var id = $('#id_log').val();

    var datos = {};

    datos.estado = estado;
    datos.credential = pass_device1;
    datos.uuid = typeof obtenerUuidDispositivo === 'function'
        ? obtenerUuidDispositivo()
        : (localStorage.getItem('uuid') || '');

    cargando(1); 

    var api = new Api(
        "mobile-authorization",
        "requests/" + encodeURIComponent(id) + "/decision"
    );
    api.request(
        datos,
        function (resp) {
            
            if (resp.estado == 1 && estado == 1) {
                $('#password_').val('');
                vista('autorizado');
            } else if (resp.estado == 1 && estado == 2) {
                $('#password_').val('');
                vista('rechazado');
            } else if (resp.estado == 2) {
                $('#password_').val('');
                msg('Autorización', resp.msg || 'Esta solicitud ya fue procesada.', 'warning');
                vista('autorizaciones_sdi', 'fade');
                cargando(0);
                return;
            } else {
                msg('Autorización', resp.msg || 'No fue posible registrar la respuesta.', 'error');
                cargando(0);
                return;
            }

            setTimeout(function () {
                vista('autorizaciones_sdi', 'fade');
            }, 700);
            cargando(0);

        },
        function (resp) { 
            cargando(0); 
            msg('Check Device', 'Error de verificación', 'error');
        },
        "POST");

  
}
