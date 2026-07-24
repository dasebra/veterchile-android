$(document).on("pageshow","#agregar_reserva",function( event ) {

    listaDeptoPersona('id_producto_a_r',0,_SESSION('id_persona'));
    listaEspacioComun('id_espacio_comun',0);
    listaBloqueHoras('id_bloque_horas',0);
});

var agrego_persona = false;


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

    var invitados = agregarInvitadoReserva();

    if(invitados.length == 0) {
        $('#id_numero_invitados').select().focus();
        msg("Requiere", "Debe Ingresar al menos 1 invitado.", 'warning');
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
    datos.invitados = invitados;

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
                agrego_persona = false;    
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



function formatCliente(Rut) {
    var sRut = Rut.value;
    var sRutFormateado1 = '';
    var sRutFormateado = sRutFormateado1;
    sRut = quitarFormato(sRut);
    var sDV = sRut.charAt(sRut.length - 1);
    sRut = sRut.substring(0, sRut.length - 1);
    while (sRut.length >= 4) {
        sRutFormateado = "." + sRut.substr(sRut.length - 3) + sRutFormateado;
        //  console.log(sRutFormateado);
        sRut = sRut.substring(0, sRut.length - 3);
    }

    sRutFormateado = sRut + sRutFormateado;
    if (sRutFormateado != "") {
        sRutFormateado += "-" + sDV;
        Rut.value = sRutFormateado;
    }


}


function quitarFormato(rut) {

    var strRut = new String(rut);
    while (strRut.indexOf(".") != -1) {
        strRut = strRut.replace(".", "");
        //  console.log('--rut--' + strRut);

    }
    while (strRut.indexOf("-") != -1) {
        strRut = strRut.replace("-", "");
        // console.log('--rut2--' + strRut);

    }
    // console.log('--rut3--' + strRut);
    // console.log('------------------');

    return strRut;
}



function agregarInvitadoReserva() {


    var cant_max_invitados = 15;
    var array_invitados = [];

    if(agrego_persona) {

    for (var i = 0; i < $('#id_numero_invitados').val(); i++) {
        total_invitados = array_invitados.length;
        if (parseInt(total_invitados) < parseInt(cant_max_invitados)) {

            var nombre = $('#nombre_apellido_reserva_invitado_' + i).val();
            var rut = $('#rut_reserva_invitado_' + i).val();
            var email = $('#email_reserva_invitado_' + i).val();
            var telefono = $('#telefono_reserva_invitado_' + i).val();

            array_invitados[i] = { "nombre": nombre, "rut": rut, "email": email, "telefono": telefono };

        }
    }
    }

    return array_invitados;

}



function agregar_usuario_espacio_comun() {

    agrego_persona = true;

    var html = '';

    // var cant_invitados = $('#id_espacio_comun').find(":selected").data("cant_invitados");

    var cant_invitados = $('#id_numero_invitados').val();

    for (var i = 0; i < cant_invitados; i++) {
        html += '<div id="invitado_' + i + '" class="row mb30">';

        html += '   <div class="col-xs-10 col-xs-offset-1">';
        html += '       <div class="form-group">';
        html += '           <label>RUT</label>';
        html += '           <input onkeyup="formatCliente(this)" id="rut_reserva_invitado_' + i + '" class="form-control rut_reserva_invitado"></input>';
        html += '       </div>';
        html += '   </div>';

        html += '   <div class="col-xs-10 col-xs-offset-1">';
        html += '       <div class="form-group">';
        html += '           <label>Nombre y Apellido</label><label class="text-warning">*</label>';
        html += '           <input id="nombre_apellido_reserva_invitado_' + i + '" class="form-control nombre_apellido_reserva_invitado"></input>';
        html += '       </div>';
        html += '   </div>';

        html += '   <div class="col-xs-10 col-xs-offset-1">';
        html += '       <div class="form-group">';
        html += '           <label>Email</label>';
        html += '           <input id="email_reserva_invitado_' + i + '" class="form-control email_reserva_invitado"></input>';
        html += '       </div>';
        html += '   </div>';

        html += '   <div class="col-xs-10 col-xs-offset-1">';
        html += '       <div class="form-group">';
        html += '           <label>Telefono</label>';
        html += '           <input id="telefono_reserva_invitado_' + i + '" class="form-control telefono_reserva_invitado" placeholder="Telefono: (+56)9 1111 1111"></input>';
        html += '       </div>';
        html += '   </div>';

        html += '</div>';

        // $('#telefono_reserva_invitado_' + i + '').mask('(+00)0 0000 0000');
    }

    $('#lista_invitados').append(html).css('overflow-y', 'scroll').css('height', 'auto').css('width', '95%').css('padding-right', '15px');
    $('#btn_agregar_usuario_espacio_comun').addClass('disabled');
   

    // console.log(array_invitados);

}

function habilitarAgregar() {
    $('#btn_agregar_usuario_espacio_comun').attr('disabled',false);
}



