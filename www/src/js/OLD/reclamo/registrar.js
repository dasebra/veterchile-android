$(document).on( "pageshow","#agregar_reclamo",function( event ) {

    listaDeptoPersona('id_producto_a_re',0,_SESSION('id_persona'));
});




const registrar_reclamo = () =>  {
    var asunto = $.trim($('#asunto').val());
    var detalle = $.trim($('#detalle').val());
    var id_persona = _SESSION('id_persona');
    var id_producto = $.trim($('#id_producto_a_re').val());
    var id_edificio = $.trim($('#id_edificio').val());


    // var persona_solicitud = $.trim($('#id_persona_solicitud').val());

    if (id_producto == 0) {
        $('#id_producto_a_re').select().focus();
        msg("Requiere", "Debe Ingresar el departamento asociado al reclamo", 'warning');
        return false;
    }

    if (asunto == '') {
        $('#asunto').select().focus();
        msg("Requiere", "Debe Ingresar el asunto del reclamo.", 'warning');
        return false;
    }

    if (detalle == '') {
        $('#detalle').select().focus();
        msg("Requiere", "Debe Ingresar el detalle del reclamo.", 'warning');
        return false;
    }

    var datos = {};

    datos.id_edificio = id_edificio;
    datos.asunto = asunto;
    datos.detalle = detalle;
    datos.estado = 1;
    datos.id_persona_solicitud = id_persona;
    datos.id_correo = 1;
    datos.valoracion = 0;
    datos.id_tipo_solicitud = 1;
    datos.id_persona_asigando = 0;
    datos.id_producto = id_producto;

    
    $('#btn-registrar').attr('click', '').addClass('btn-app-inactive');
    cargando(1);

    var api = new Api('solicitud', 'registrar');
    api.request(datos,
        function (resp) {

            if (resp.estado == 1) {
                
                $('#asunto').val('');
                $('#detalle').val('');            
                $('#id_producto_a_re').val(0);

                msg('Registro Nuevo', "Registro creado satisfactoriamente.", 'success');
                registrarNotificacion('Registro de un reclamo');        
                vista('ver_reclamos');       
            } else {
                msg("Problemas", "problema al crear el registro, vuelva a intentarlo.", 'error');            
            }

            cargando(0);
            $('#btn-registrar').attr('click', 'registrar_reclamo').removeClass('btn-app-inactive');

        },
        function (resp) {
            console.log(resp);
        },
        'POST'
    );
}
