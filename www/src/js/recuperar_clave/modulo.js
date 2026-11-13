/* =========================================================================
   Recuperar contraseña (front-end)
   Flujo: 1) elegir correo o teléfono → 2) código de 6 dígitos → 3) nueva
   contraseña → 4) listo.

   Para el programador: las 3 llamadas al servidor están en rcApi (abajo).
   Mientras RC_MODO_DEMO sea true se simulan las respuestas para poder ver
   las vistas sin backend (en demo el código "000000" se toma como incorrecto
   y cualquier otro código de 6 dígitos como correcto).
   Respuesta esperada de cada endpoint: { estado: 1, ... } si salió bien, o
   { estado: 0, mensaje: '...' } si no.
   ========================================================================= */

const RC_MODO_DEMO = true; // TODO programador: false cuando existan los endpoints
const RC_SEGUNDOS_REENVIO = 60;

const rcApi = {
    // datos: { metodo: 'email' | 'telefono', destino: 'correo' | '+569XXXXXXXX' }
    // respuesta: { estado: 1, token: '<id de la solicitud>' }
    enviarCodigo(datos, ok, error) {
        if (RC_MODO_DEMO) return rcSimular(() => ok({ estado: 1, token: 'demo-' + Date.now() }));
        new Api('user', 'recuperar_clave_enviar_codigo').request(datos, ok, error, 'POST');
    },
    // datos: { token, codigo }
    // respuesta: { estado: 1 } o { estado: 0, mensaje: 'El código no es correcto' }
    verificarCodigo(datos, ok, error) {
        if (RC_MODO_DEMO) {
            return rcSimular(() => ok(datos.codigo === '000000'
                ? { estado: 0, mensaje: 'El código no es correcto. Revísalo e inténtalo de nuevo.' }
                : { estado: 1 }));
        }
        new Api('user', 'recuperar_clave_verificar_codigo').request(datos, ok, error, 'POST');
    },
    // datos: { token, codigo, clave }
    // respuesta: { estado: 1 }
    cambiarClave(datos, ok, error) {
        if (RC_MODO_DEMO) return rcSimular(() => ok({ estado: 1 }));
        new Api('user', 'recuperar_clave_cambiar').request(datos, ok, error, 'POST');
    }
};

function rcSimular(fn) {
    if (typeof cargando === 'function') cargando(1);
    setTimeout(() => {
        if (typeof cargando === 'function') cargando(0);
        fn();
    }, 700);
}

const rcEstado = { paso: 1, metodo: 'email', destino: '', token: '', codigo: '', temporizador: null };

/* ---------- Navegación ---------- */

const abrirRecuperarClave = () => {
    rcReiniciar();
    var usuario = $.trim($('#user').val() || '');
    if (usuario.indexOf('@') > 0) $('#rc_email').val(usuario);
    vista('recuperar-clave');
};

const rcReiniciar = () => {
    rcDetenerContador();
    Object.assign(rcEstado, { paso: 1, metodo: 'email', destino: '', token: '', codigo: '' });
    $('#rc_email, #rc_telefono, #rc_clave, #rc_clave2').val('');
    $('#rc_codigo input').val('');
    $('#recuperar-clave .rc-error').text('');
    $('#recuperar-clave .rc-input, #rc_codigo').removeClass('rc-invalido');
    rcElegirMetodo('email');
    rcValidarClave();
    rcIrPaso(1);
};

const rcIrPaso = (paso) => {
    rcEstado.paso = paso;
    var $pagina = $('#recuperar-clave');
    $pagina.find('.rc-paso').hide().filter('[data-paso="' + paso + '"]').show();
    $pagina.find('.rc-progreso-barra').each(function (i) { $(this).toggleClass('hecho', i < paso); });
    $pagina.toggleClass('rc-en-exito', paso === 4);
    $('#rc_paso_num').text('Paso ' + Math.min(paso, 3) + ' de 3');
    if (paso === 1) rcDetenerContador();
    $('html, body').scrollTop(0);
};

const rcVolver = () => {
    if (rcEstado.paso === 2 || rcEstado.paso === 3) { rcIrPaso(1); return; }
    rcIrALogin();
};

const rcIrALogin = () => {
    if (rcEstado.paso === 4 && rcEstado.metodo === 'email' && rcEstado.destino) {
        $('#user').val(rcEstado.destino);
    }
    $('#pass').val('');
    rcDetenerContador();
    vista('login');
};

/* ---------- Paso 1: método y destino ---------- */

const rcElegirMetodo = (metodo) => {
    rcEstado.metodo = metodo;
    $('#recuperar-clave .rc-metodo').each(function () {
        var activo = $(this).data('metodo') === metodo;
        $(this).toggleClass('activo', activo).attr('aria-checked', activo ? 'true' : 'false');
    });
    $('#rc_campo_email').toggle(metodo === 'email');
    $('#rc_campo_telefono').toggle(metodo === 'telefono');
    $('#rc_error_1').text('');
    $('#rc_email, #rc_telefono').removeClass('rc-invalido');
};

const rcSoloDigitos = (texto) => String(texto || '').replace(/\D/g, '');

// Formato visual del celular chileno: 9 1234 5678
$(document).on('input', '#rc_telefono', function () {
    var d = rcSoloDigitos(this.value).slice(0, 9);
    this.value = [d.slice(0, 1), d.slice(1, 5), d.slice(5, 9)].filter(Boolean).join(' ');
    $(this).removeClass('rc-invalido');
    $('#rc_error_1').text('');
});
$(document).on('input', '#rc_email', function () {
    $(this).removeClass('rc-invalido');
    $('#rc_error_1').text('');
});
$(document).on('keydown', '#rc_email, #rc_telefono', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); rcEnviarCodigo(); }
});

const rcErrorPaso1 = (texto, campo) => {
    $('#rc_error_1').text(texto);
    $(campo).addClass('rc-invalido').trigger('focus');
};

const rcEnviarCodigo = () => {
    var destino;
    if (rcEstado.metodo === 'email') {
        destino = $.trim($('#rc_email').val()).toLowerCase();
        if (!destino) return rcErrorPaso1('Ingresa tu correo electrónico.', '#rc_email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(destino)) return rcErrorPaso1('Revisa el correo, parece que no está bien escrito.', '#rc_email');
    } else {
        var d = rcSoloDigitos($('#rc_telefono').val());
        if (!d) return rcErrorPaso1('Ingresa tu número de teléfono.', '#rc_telefono');
        if (d.length !== 9 || d.charAt(0) !== '9') return rcErrorPaso1('El número debe tener 9 dígitos y empezar con 9.', '#rc_telefono');
        destino = '+56' + d;
    }

    rcApi.enviarCodigo({ metodo: rcEstado.metodo, destino: destino }, function (resp) {
        if (resp && resp.estado == 1) {
            rcEstado.destino = destino;
            rcEstado.token = resp.token || '';
            $('#rc_destino_texto').html(rcTextoDestino());
            $('#rc_codigo input').val('');
            $('#rc_error_2').text('');
            $('#rc_boton_verificar').prop('disabled', true);
            rcIrPaso(2);
            rcIniciarContador();
            setTimeout(() => $('#rc_codigo input').first().trigger('focus'), 350);
        } else {
            $('#rc_error_1').text((resp && resp.mensaje) || 'No pudimos enviar el código. Inténtalo de nuevo.');
        }
    }, function () {
        $('#rc_error_1').text('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
    });
};

// Muestra el destino enmascarado: da•••@gmail.com / +56 9 •••• 5678
const rcTextoDestino = () => {
    var d = rcEstado.destino;
    if (rcEstado.metodo === 'email') {
        var partes = d.split('@');
        var nombre = partes[0];
        var visible = nombre.slice(0, Math.min(2, Math.max(1, nombre.length - 1)));
        return 'a <strong>' + $('<i>').text(visible + '•••@' + partes[1]).html() + '</strong>';
    }
    return 'por SMS al <strong>+56 9 •••• ' + d.slice(-4) + '</strong>';
};

/* ---------- Paso 2: código ---------- */

const rcLeerCodigo = () => $('#rc_codigo input').map(function () { return this.value; }).get().join('');

const rcActualizarCodigo = () => {
    var codigo = rcLeerCodigo();
    $('#rc_boton_verificar').prop('disabled', codigo.length !== 6);
    $('#rc_codigo').removeClass('rc-invalido');
    $('#rc_error_2').text('');
    if (codigo.length === 6) rcVerificarCodigo();
};

const rcLlenarCodigo = (desde, digitos) => {
    var $cajas = $('#rc_codigo input');
    digitos.split('').forEach((c, i) => { if ($cajas[desde + i]) $cajas[desde + i].value = c; });
    var siguiente = Math.min(desde + digitos.length, 5);
    $cajas.eq(siguiente).trigger('focus');
};

$(document).on('input', '#rc_codigo input', function () {
    var $cajas = $('#rc_codigo input');
    var i = $cajas.index(this);
    var d = rcSoloDigitos(this.value);
    this.value = '';
    if (d) rcLlenarCodigo(i, d.slice(0, 6 - i));
    rcActualizarCodigo();
});

$(document).on('keydown', '#rc_codigo input', function (e) {
    var $cajas = $('#rc_codigo input');
    var i = $cajas.index(this);
    if (e.key === 'Backspace' && !this.value && i > 0) {
        e.preventDefault();
        $cajas.eq(i - 1).val('').trigger('focus');
        rcActualizarCodigo();
    } else if (e.key === 'ArrowLeft' && i > 0) {
        $cajas.eq(i - 1).trigger('focus');
    } else if (e.key === 'ArrowRight' && i < 5) {
        $cajas.eq(i + 1).trigger('focus');
    }
});

$(document).on('paste', '#rc_codigo input', function (e) {
    var texto = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
    var d = rcSoloDigitos(texto).slice(0, 6);
    if (!d) return;
    e.preventDefault();
    $('#rc_codigo input').val('');
    rcLlenarCodigo(0, d);
    rcActualizarCodigo();
});

$(document).on('focus', '#rc_codigo input', function () { this.select(); });

const rcVerificarCodigo = () => {
    var codigo = rcLeerCodigo();
    if (codigo.length !== 6) return;
    $('#rc_codigo input').trigger('blur');

    rcApi.verificarCodigo({ token: rcEstado.token, codigo: codigo }, function (resp) {
        if (resp && resp.estado == 1) {
            rcEstado.codigo = codigo;
            rcDetenerContador();
            $('#rc_clave, #rc_clave2').val('');
            rcValidarClave();
            rcIrPaso(3);
        } else {
            rcCodigoIncorrecto((resp && resp.mensaje) || 'El código no es correcto.');
        }
    }, function () {
        rcCodigoIncorrecto('No pudimos conectarnos. Inténtalo de nuevo.');
    });
};

const rcCodigoIncorrecto = (texto) => {
    var $codigo = $('#rc_codigo');
    $('#rc_error_2').text(texto);
    $codigo.removeClass('rc-invalido');
    void $codigo[0].offsetWidth; // reinicia la animación
    $codigo.addClass('rc-invalido');
    $codigo.find('input').val('');
    $('#rc_boton_verificar').prop('disabled', true);
    setTimeout(() => $codigo.find('input').first().trigger('focus'), 300);
};

const rcIniciarContador = () => {
    rcDetenerContador();
    var restante = RC_SEGUNDOS_REENVIO;
    var $boton = $('#rc_boton_reenviar');
    var pintar = () => {
        if (restante <= 0) {
            rcDetenerContador();
            $boton.prop('disabled', false).text('Reenviar código');
            return;
        }
        $boton.prop('disabled', true).html('Reenviar en <span id="rc_contador">' +
            (typeof formatearTiempoBloqueoLogin === 'function' ? formatearTiempoBloqueoLogin(restante) : restante + ' s') + '</span>');
        restante--;
    };
    pintar();
    rcEstado.temporizador = setInterval(pintar, 1000);
};

const rcDetenerContador = () => {
    if (rcEstado.temporizador) clearInterval(rcEstado.temporizador);
    rcEstado.temporizador = null;
};

const rcReenviarCodigo = () => {
    rcApi.enviarCodigo({ metodo: rcEstado.metodo, destino: rcEstado.destino }, function (resp) {
        if (resp && resp.estado == 1) {
            if (resp.token) rcEstado.token = resp.token;
            $('#rc_codigo input').val('');
            $('#rc_error_2').text('');
            rcIniciarContador();
            if (typeof msg === 'function') msg('Código reenviado', 'Te enviamos un nuevo código.', 'success');
        } else {
            $('#rc_error_2').text((resp && resp.mensaje) || 'No pudimos reenviar el código.');
        }
    }, function () {
        $('#rc_error_2').text('No pudimos conectarnos. Inténtalo de nuevo.');
    });
};

/* ---------- Paso 3: nueva contraseña ---------- */

const rcReglasClave = () => {
    var clave = $('#rc_clave').val() || '';
    var clave2 = $('#rc_clave2').val() || '';
    return {
        largo: clave.length >= 8,
        mayuscula: /[A-ZÁÉÍÓÚÑ]/.test(clave),
        numero: /\d/.test(clave),
        igual: clave.length > 0 && clave === clave2
    };
};

const rcValidarClave = () => {
    var reglas = rcReglasClave();
    var todas = true;
    $('#rc_reglas li').each(function () {
        var ok = !!reglas[$(this).data('regla')];
        $(this).toggleClass('cumple', ok);
        todas = todas && ok;
    });
    $('#rc_boton_guardar').prop('disabled', !todas);
    $('#rc_error_3').text('');
    return todas;
};

const rcVerClave = (id, boton) => {
    var $input = $('#' + id);
    var mostrar = $input.attr('type') === 'password';
    $input.attr('type', mostrar ? 'text' : 'password');
    $(boton).toggleClass('activo', mostrar).attr('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
};

$(document).on('keydown', '#rc_clave, #rc_clave2', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); rcGuardarClave(); }
});

const rcGuardarClave = () => {
    if (!rcValidarClave()) return;
    rcApi.cambiarClave({ token: rcEstado.token, codigo: rcEstado.codigo, clave: $('#rc_clave').val() }, function (resp) {
        if (resp && resp.estado == 1) {
            $('#rc_clave, #rc_clave2').val('');
            rcIrPaso(4);
        } else {
            $('#rc_error_3').text((resp && resp.mensaje) || 'No pudimos guardar la contraseña. Inténtalo de nuevo.');
        }
    }, function () {
        $('#rc_error_3').text('No pudimos conectarnos. Inténtalo de nuevo.');
    });
};

// Si se sale de la vista, se corta el contador de reenvío.
$(document).on('pagehide', '#recuperar-clave', rcDetenerContador);
