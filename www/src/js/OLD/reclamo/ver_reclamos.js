$(document).on( "pageshow","#ver_reclamos",function( event ) {

    tabla_registros_reclamos(_SESSION('id_persona'));
});

function tabla_registros_reclamos(id_persona) {

     
    var datos = {};
    datos.id_edificio = $('#id_edificio').val();
    datos.id_tipo_solicitud = 1;
    datos.id_persona_solicitud = id_persona;

    cargando(1);

    var api = new Api("solicitud", "ver_registros");
    api.request(
        datos,
        function (resp) {
            // console.log(resp);

            // var titulos = [['ID',''], ['Nombre',''], ['Email',''], ['Asunto',''], ['Fecha Ingreso',''], ['Dias Abierto',''], ['Depto.',''], ['Personal Asignado',''], ['Estado','']];
            var titulos = [['Lista Reclamos','']];
            var tipos_solicitudes_colores = ['', 'danger', 'info', 'success'];

            var color_estado2 = ['', 'info', 'success', 'warning', 'info', 'success', 'danger'];
            var color_estado_txt = ['', 'NUEVA', 'ASIGNADO', 'EN PROCESO', 'PENDIENTE', 'REALIZADA', 'RECHAZADA'];
            var btn_disabled = "";
            var html = '';
            var div_tabla = 'tabla_registros_reclamos';
            html += armar_tabla_head(titulos, div_tabla);

            if (resp.estado == 1) {
                resp.registros = removeNull(resp.registros);
                var cant_reclamos = resp.registros.length;

                for (var key in resp.registros) {

                    var cantidad_dias = moment(resp.registros[key].fecha_ingreso, "YYYY-MM-DD H:m:s").startOf('hour').fromNow().replace('a day ago', '1 día').replace('days ago', 'días').replace('hours ago', 'horas').replace('minutes ago', 'minutos').replace('an hour ago', '1 hora');

                    if (resp.registros[key].tipo_solicitud.id == 1) {

                        var personal_asignado = '';
                        var estado_reclamo = '';

                        if (resp.registros[key].id_persona_asigando == 0 || resp.registros[key].id_persona_asigando == null || resp.registros[key].id_persona_asigando == '') {
                            personal_asignado= '<span class="label label-info">No asignado</span>';
                        } else {
                            personal_asignado = '<span class="label label-info">' + removeNull(resp.registros[key].persona_asigando.nombre) + '</span>';
                        }
                        estado_reclamo = '<span class="label label-' + color_estado2[resp.registros[key].estado] + '">' + color_estado_txt[resp.registros[key].estado] + '</span>';

                        //TABLA REGISTROS
                        html += '<tr>';
                        html += '<td>';
                        html += `
                            <p><b>Asunto</b>: ${resp.registros[key].asunto}</p>                            
                            <p><b>Detalle</b>: ${resp.registros[key].detalle}</p>                                                        
                            <p><b>Fecha Ingreso</b>: ${fecha_eng(resp.registros[key].fecha_ingreso)}</p>
                            <p><b>Tiempo Trascurrido</b>: ${cantidad_dias}</p>
                            <p><b>Departamento</b>: ${numerDepato(resp.registros[key].producto.numero,resp.registros[key].producto.piso)}</p>
                            <p><b>Personal Asignado</b>: ${personal_asignado}</p>
                            <p><b>Estado</b>: ${estado_reclamo}</p>
                        `;
                        html += '</td>';
                        html += '</tr>';
                    }

                }

            }

            html+='</table>';

            $('#tabla_registro_reclamo').html(html).html();            
            cargando(0);            
        },
        function (resp) {
            cargando(0);
            console.log(resp);
        }
        ,
        "GET"
    );

}