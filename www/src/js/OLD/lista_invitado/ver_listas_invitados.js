

$(document).on( "pageshow","#ver_lista_invitados",function( event ) {
    tabla_registros_listas_invitados();
});

function tabla_registros_listas_invitados() 
{
    var datos = {};

    datos.id_edificio = $('#id_edificio').val();
    datos.id_persona_solicitud = _SESSION('id_persona');
    datos.id_tipo_solicitud = 2;


    cargando(1);
    var api = new Api("solicitud", "ver_registros");
    api.request(
        datos,
        function (resp) {
                                
            //var titulos = [['Arrendatario', ''], ['Depto.', ''], ['Nombre Evento', ''], ['Horario', ''], ['Invitados', ''], ['Estado', ''], ['Opciones', '']];
            var titulos = [['Registros Listas', '']];

            var color_estado2 = ['', 'info', 'success', 'warning', 'info', 'success', 'danger', 'danger'];
            var color_estado_txt = ['', 'NUEVA', 'ASIGNADO', 'EN PROCESO', 'PENDIENTE', 'REALIZADA', 'RECHAZADA', 'CANCELADA'];

            var html = '';
            var btn_disabled = "";
            var div_tabla = 'tabla_registros_lista_invitados';
            html += armar_tabla_head(titulos, div_tabla);

            if (resp.estado == 1) {
                
                for (var key in resp.registros) 
                {

                    if (resp.registros[key].estado == 7 || resp.registros[key].estado == 5) {
                        btn_disabled = 'disabled';
                    } else {
                        btn_disabled = '';
                    }

                    var asunto = '';
                    if(resp.registros[key].asunto == '' || resp.registros[key].asunto == null){
                        asunto = 'Sin asunto';
                    }else{
                        asunto = resp.registros[key].asunto.replace(/<[^>]*>?/g, '');
                     }

                     var agregar_invitados_btn = '';
                     var cantidad_btn = '';
                     cantidad_btn += '<span class="badge badge-xs badge-danger mb20" title="Cantidad de invitados">' + resp.registros[key].solicitud_invitado.length + '</span>';                    
                     if(resp.registros[key].estado == 1){
                        agregar_invitados_btn += '<button class="btn btn-xs ml10 btn-success  menu-icon fa fa fa-plus-circle boton pr8 pl8" onclick="tabla_invitados(' + resp.registros[key].id + ')"' + btn_disabled + 'title="Agregar Invitados">+</button>';                        
                    }else{
                        agregar_invitados_btn += '<button class="btn btn-xs  ml10 btn-info  menu-icon fa fa fa-eye boton pr8 pl8" onclick="tabla_invitados_realizada(' + resp.registros[key].id + ')" title="Ver Invitados">V</button>';                               
                    }

                    var estado = '';

                    estado = '<span class="label label-' + color_estado2[resp.registros[key].estado] + '" >' + color_estado_txt[resp.registros[key].estado] + '</span>';


                    var acciones = '';

                    if(resp.registros[key].estado == 1)
                    acciones = `
                    <div class="row mt15">
                    <div class="col-xs-5 col-xs-colspan-1"><button onclick="estado_realizada('${resp.registros[key].id}')" class="btn btn-success" ' + btn_disabled + '>Realizada</button></div>
                    <div class="col-xs-5 col-xs-colspan-1"><button onclick="estado_cancelar('${resp.registros[key].id}')" class="btn btn-danger" ' + btn_disabled + '>Cancelar</button></div>
                    </div>
                    `;
            
                    html += '<tr><td>';

                    html += `
                        <div class="row">
                            <div class="col-xs-10 col-xs-colspan-1"><p>Arrendatario: ${resp.registros[key].persona_solicitud.nombre}</p></div>
                        </div>
                        <div class="row">
                            <div class="col-xs-10 col-xs-colspan-1"><p>Depto: ${numerDepato(resp.registros[key].producto.numero, resp.registros[key].producto.piso)}</p></div>
                        </div>
                        <div class="row">
                            <div class="col-xs-10 col-xs-colspan-1"><p>Asunto: ${asunto}</p></div>
                        </div>
                        <div class="row">
                            <div class="col-xs-5 col-xs-colspan-1"><p>Fecha Inicio: ${fecha_eng(resp.registros[key].fecha_inicio)}</p></div>
                            <div class="col-xs-5 "><p>Hora Inicio: ${resp.registros[key].hora_inicio}</p></div>
                        </div>
                        <div class="row">
                            <div class="col-xs-5 col-xs-colspan-1"><p>Fecha Inicio: ${fecha_eng(resp.registros[key].fecha_fin)}</p></div>
                            <div class="col-xs-5 "><p>Hora Inicio: ${resp.registros[key].hora_fin}</p></div>
                        </div>
                        <div class="row">
                            <div class="col-xs-5 col-xs-colspan-1"><p>Agregar Invitados: ${agregar_invitados_btn} </p></div>
                            <div class="col-xs-5 "><p>Cantidad Invitados: ${cantidad_btn} </p></div>
                        </div>
                        <div class="row">    
                            <div class="col-xs-10 col-xs-colspan-1"><p>Estado: ${estado} </p></div>
                        </div>
                       ${acciones}
                    `;                        
                    html += '</td></tr>';

                }

            } 

            html += '</table>';

            $('#tabla_registro_lista_invitados').html(html);            
            cargando(0);
        },
        function (resp) {
            cargando(0);
            console.log(resp);
        },
        "GET");

}

const tabla_invitados = (id_solicitud) => {
    setSession('id_solicitud',id_solicitud);    
    vista('agregar_invitados');
}

const tabla_invitados_realizada = (id_solicitud) =>{
    setSession('id_solicitud',id_solicitud);    
    vista('ver_invitados');
}


const estado_realizada = (id_solicitud) => {
    $('#id_solicitud_estado_mod').val(id_solicitud);
    $('#modalConfirmar').modal('show');
}

const estado_cancelar = (id_solicitud) => {
    $('#id_solicitud_estado_mod').val(id_solicitud);
    $('#modalCancelar').modal('show');
}



const estado_solicitud_realizada = () => {
    var id = $('#id_solicitud_estado_mod').val();

    var datos = {};

    datos.id = id;
    datos.estado = 5;

    cargando(1);
    $('#btn-confirmar-opcion').attr('disabled', true);
    var api = new Api("solicitud", "estado");
    api.request(
        datos,
        function (resp) {

            if (resp.estado == 1) {

                $('#modalConfirmar').modal('hide');
                msg('Solicitud', 'actualización de estado', 'success');
                tabla_registros_listas_invitados();
                
            } else {
                msg('Solicitud', 'Se presento una falla, intente nuevamente', 'error');                
            }
            cargando(0);
            $('#btn-confirmar-opcion').attr('disabled', false);

        },
        function (resp) {
            cargando(0);            
        }
        ,
        "POST"
    );
}


const estado_solicitud_cancelar = () => {
    var id = $('#id_solicitud_estado_cancelar').val();

    var datos = {};

    datos.id = id;
    datos.estado = 7;

    cargando(1);
    $('#btn-cancelar-opcion').attr('disabled', true);
    var api = new Api("solicitud", "estado");
    api.request(
        datos,
        function (resp) {
            if (resp.estado == 1) {                
                msg('Solicitud', 'actualización de estado', 'success');
                $('#btn-cancelar-opcion').attr('disabled', false);
                tabla_registros_listas_invitados();
            } else {
                msg('Solicitud', 'Se presento una falla, intente nuevamente', 'error');                       
            }
            cargando(0);
        },
        function (resp) {
            cargando(0);
            console.log(resp);
        }
        ,
        "POST"
    );
}
