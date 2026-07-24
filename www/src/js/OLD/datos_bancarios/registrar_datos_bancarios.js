$(document).on( "pageshow","#agregar_datos_bancarios",function( event ) {

});


const registrar_datos_bancarios = () => {

    var id_persona = _SESSION('id_persona');
    var id_edificio = $('#id_edificio').val();

    var rut = $('#rut').val();
    var nombre = $('#nombre').val();
    var correo = $('#correo').val();
    var banco = $('#banco').val();
    var tipo_cuenta = $('#tipo_cuenta').val();
    var numero_cuenta = $('#numero_cuenta').val();


    if (!Rut(rut)) {
        msg('Cuenta', 'Debe ingresar rut de la Cuenta', 'warning');
        $('#rut').select().focus();
        return false;
    }

    
    if (nombre == '') {
        msg('Cuenta', 'Debe ingresar nombre de la Cuenta', 'warning');
        $('#nombre').select().focus();
        return false;
    }

    if (validarEmail(correo)) {
        msg('Cuenta', 'Debe ingresar correo válido', 'warning');
        $('#correo').select().focus();
        return false;
    }
    
    if (banco == '') {
        msg('Cuenta', 'Debe ingresar banco de la Cuenta', 'warning');
        $('#banco').select().focus();
        return false;
    }

    if (tipo_cuenta == '') {
        msg('Cuenta', 'Debe ingresar tipo de la Cuenta', 'warning');
        $('#tipo_cuenta').select().focus();
        return false;
    }

    if (numero_cuenta == '') {
        msg('Cuenta', 'Debe ingresar número de la Cuenta', 'warning');
        $('#numero_cuenta').select().focus();
        return false;
    }

   
    var datos = {};

    datos.id_persona = id_persona;
    datos.id_edificio = id_edificio;

    datos.rut = rut;
    datos.nombre = nombre;
    datos.correo = correo;
    datos.banco = banco;
    datos.tipo_cuenta = tipo_cuenta;
    datos.numero_cuenta = numero_cuenta;

    datos.estado = 1;

    cargando(1);

    $('#btn-registrar').attr('click', '').addClass('btn-app-inactive');  
    var api = new Api('datos_bancarios_persona', 'registrar');
    api.request(datos,
        function (resp) {
            
            if (resp.estado == 1) {
                $('#rut').val('');
                $('#nombre').val('');
                $('#correo').val('');
                $('#banco').val('');
                $('#tipo_cuenta').val('');
                $('#numero_cuenta').val('');
            
                msg('Datos Bancarios', 'Datos bancarios registrados exitosamente.', 'success');
                registrarNotificacion('Nuevos datos bancarios, registrados'); 
                vista('ver_datos_bancarios');
            } else {
                msg('Problema al registrar', 'Problema al registrar.', 'error');
            }

            $('#btn-registrar').attr('click', 'agregar_datos_bancarios()').removeClass('btn-app-inactive');  
            cargando(0);
        },
        function (resp) {
            console.log(resp);
            cargando(0);
        },
        'POST'
    );

}



