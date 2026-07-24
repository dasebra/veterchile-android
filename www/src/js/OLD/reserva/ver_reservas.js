$(document).on( "pageshow","#ver_reservas",function( event ) {

    ver_registros_reserva();
});


function ver_registros_reserva() {


    var id_edificio = $('#id_edificio').val();

    var api = new Api('espacio_comun_reserva', 'ver_registros');

    var datos = {};

    datos.estado = 1;
    datos.id_edificio = id_edificio;
    datos.id_encargado = _SESSION('id_persona');

    cargando(1);
    api.request(datos,
        function (resp) {

            //var titulos = [['Nombre', ''], ['Espacio Común', ''], ['Horario', ''], ['Arriendo', '']];
            var titulos = [['Registros Reservas', '']];
            var html = '';
            var div_tabla = 'tabla_registros_reservas';
            html += armar_tabla_head(titulos, div_tabla);
            
            if (resp.estado == 1) {
                
                for (var key in resp.registros) {
                 
                    html += '<tr>';
                    html += '<td>';

                    html += `
                        <p><b>Nombre:</b> ${resp.registros[key].encargado.nombre + ' '+resp.registros[key].encargado.apellido_paterno+' '+resp.registros[key].encargado.apellido_materno}</p>
                        <p><b>Espacio Común:</b> ${resp.registros[key].espacio_comun.nombre}</p>
                        <p><b>Horario:</b> ${resp.registros[key].bloque_horas.nombre + ' '+resp.registros[key].bloque_horas.hora_inicio+' - '+resp.registros[key].bloque_horas.hora_fin}</p>
                        <p><b>Arriendo:</b> $${monedaPesos(resp.registros[key].espacio_comun.costo_arriendo)}</p>
                    `;

                    html += '</td>';
                    html += '</tr>';
                }
            } 

            html+='</table>';

            $('#tabla_registro_reservas').html(html);            
            cargando(0);
        },
        function (resp) {
            cargando(0);
            console.log(resp);
        }, 'GET');

}