

$(document).on( "pageshow","#agregar_lista_invitados",function( event ) {
    listaDeptoPersona('id_producto',0,_SESSION('id_persona'));
});




const registrar_lista_invitados = () => {


    var id_producto = $.trim($('#id_producto').val());
    var asunto = $.trim($('#asunto').val());
    var detalle = $.trim($('#detalle').val());

    var hora_inicio = $('#hora_inicio').val();
    var hora_termino = $('#hora_termino').val();
    var fecha_inicio = $('#fecha_inicio').val();
    var fecha_termino = $('#fecha_termino').val();

    var id_edificio = $('#id_edificio').val();
    var id_persona = _SESSION('id_persona');

    if (id_producto == 0) {
        $('#id_producto').select().focus();
        msg("Requiere", "Debe Ingresar el departamento al cual pertenece la lista", 'warning');
        return false;
    }

    if (asunto == '') {
        $('#asunto').select().focus();
        msg("Requiere", "Debe Ingresar el asunto de la solicitud", 'warning');
        return false;
    }

    if (detalle == '') {
        $('#detalle').select().focus();
        msg("Requiere", "Debe Ingresar el detalle de la solicitud", 'warning');
        return false;
    }



    if (hora_inicio == '') {
        $('#hora_inicio').select().focus();
        msg("Requiere", "Debe Ingresar fecha hora de inicio", 'warning');
        return false;
    }

    if (hora_termino == '') {
        $('#hora_termino').select().focus();
        msg("Requiere", "Debe Ingresar hora de termino", 'warning');
        return false;
    }


    if (fecha_inicio == '') {
        $('#fecha_inicio').select().focus();
        msg("Requiere", "Debe Ingresar fecha de inicio", 'warning');
        return false;
    }

    if (fecha_termino == '') {
        $('#fecha_termino').select().focus();
        msg("Requiere", "Debe Ingresar fecha de termino", 'warning');
        return false;
    }

    var datos = {};
    
    datos.id_producto = id_producto;
    datos.asunto = asunto;
    datos.detalle = detalle;
    
    datos.fecha_inicio = (fecha_inicio);
    datos.fecha_fin = (fecha_termino);
    datos.hora_inicio = hora_inicio;
    datos.hora_fin = hora_termino;

    
    datos.id_correo = 1;
    datos.valoracion = 0;
    datos.id_tipo_solicitud = 2;
    datos.id_persona_asigando = 0;
        
    datos.id_edificio = id_edificio;
    datos.id_persona_solicitud = id_persona;
    datos.estado = 1;

    cargando(1);
    var api = new Api('solicitud', 'registrar');

    $('#btn-registrar').attr('click', '').addClass('btn-app-inactive');
    api.request(datos,
        function (resp) {
            // console.log(resp);

            
            if (resp.estado == 1) {
                msg('Registro Nuevo', "Registro creado satisfactoriamente.", 'success');

                $('#id_producto').val(0);
                $('#asunto').val('');
                $('#detalle').val('');                
                
                $('#hora_inicio').val('');
                $('#hora_termino').val('');
                $('#fecha_inicio').val('');
                $('#fecha_termino').val('');

                registrarNotificacion('Lista de invitado, creada');    
                vista('ver_lista_invitados');           
                
            } else {
                msg("Problemas", "problema al crear el registro, vuelva a intentarlo.", 'error');
            }

            $('#btn-registrar').attr('click', 'registrar_lista_invitados').removeClass('btn-app-inactive');
            cargando(0);
        },
        function (resp) {
            console.log(resp);
        },
        'POST'
    );
}