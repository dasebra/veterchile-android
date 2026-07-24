$(document).on( "pageshow","#agregar_reserva",function( event ) {

    listaDeptoPersona('id_producto_a_r',0,_SESSION('id_persona'));
    listaEspacioComun('id_espacio_comun',0);
    listaBloqueHoras('id_bloque_horas',0);
});


const registrar_reserva = () => {
 

    var id_espacio_comun = $('#id_espacio_comun').val();
    var id_producto = $('#id_producto_a_r').val();
    var id_bloque_horas = $('#id_bloque_horas').val();    
    var fecha = $('#fecha').val();

    var id_encargado = _SESSION('id_persona');
    var id_edificio = $('#id_edificio').val();

    

    if (id_producto == 0) {
        $('#id_producto_a_r').select().focus();
        msg("Requiere", "Debe Ingresar el N° de departamento que está solicitando la reserva.", 'warning');
        return false;
    }

    if (id_espacio_comun == 0) {
        $('#id_espacio_comun').select().focus();
        msg("Requiere", "Debe Ingresar el espacio común a reservar.", 'warning');
        return false;
    }
    if (id_bloque_horas == 0) {
        $('#id_bloque_horas').select().focus();
        msg("Requiere", "Debe Ingresar el bloque de horas en el que se hará la reserva.", 'warning');
        return false;
    }
    if (fecha == '') {
        $('#fecha').select().focus();
        msg("Requiere", "Debe Ingresar la fecha de la reserva.", 'warning');
        return false;
    }


    var datos = {};
    datos.id_edificio = id_edificio;
    datos.id_producto = id_producto;
    datos.estado = 1;
    datos.id_encargado = id_encargado;
    datos.id_espacio_comun = id_espacio_comun;
    datos.id_bloque_horas = id_bloque_horas;
    datos.id_debe = 0;
    datos.fecha = fecha;

    $('#btn-registrar').attr('click', '').addClass('btn-app-inactive');
    cargando(1);

    var api = new Api("espacio_comun_reserva", "registrar");
    api.request(
        datos,
        function (resp) {
            
            cargando(0);

            if (resp.estado == 1) {

                $('#id_producto_a_r').val(0);                
                $('#id_espacio_comun').val(0);
                $('#id_bloque_horas').val(0);
                $('#fecha').val('');                                        
                msg('Reserva', 'Reserva realizada correctamente', 'success');     
                registrarNotificacion('Reserva de área común'); 
                vista('ver_lista_invitados');          
            } else {
                msg('Reserva', 'No se pudo realizar la reserva, intente nuevamente', 'error');                
            }

            $('#btn-registrar').attr('click', 'registrar_reserva()').removeClass('btn-app-inactive');

        },
        function (resp) {
            cargando(0);         
        },
        "POST");

}



