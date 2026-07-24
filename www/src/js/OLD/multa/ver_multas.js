$(document).on( "pageshow","#ver_multas",function( event ) {

    ver_registros_multas();
});


function ver_registros_multas() {


    var id_edificio = $('#id_edificio').val();

    var api = new Api('multa', 'ver_registros');

    var datos = {};

    datos.estado = 1;
    datos.id_edificio = id_edificio;
    datos.id_persona = _SESSION('id_persona');

    cargando(1);
    api.request(datos,
        function (resp) {

            //var titulos = [['Nombre', ''], ['Espacio Común', ''], ['Horario', ''], ['Arriendo', '']];
            var titulos = [['Registros Multas', '']];
            var html = '';
            var div_tabla = 'tabla_registros_multas';
            html += armar_tabla_head(titulos, div_tabla);
            
            if (resp.estado == 1) {
                
                for (var key in resp.registros) {
                 
                    html += '<tr>';
                    html += '<td>';

                    html += `
                        <p><b>Descripción:</b> ${resp.registros[key].descripcion}</p>
                        <p><b>Monto:</b> $${formato_miles(resp.registros[key].monto)}</p>
                        <p><b>Descuento:</b> $${formato_miles(resp.registros[key].descuento)}</p>
                        <p><b>Fecha:</b> ${fecha_eng(resp.registros[key].fecha_multa)}</p>                        
                    `;

                    html += '</td>';
                    html += '</tr>';
                }
            } 

            html+='</table>';

            $('#tabla_registro_multas').html(html);            
            cargando(0);
        },
        function (resp) {
            console.log(resp);
            cargando(0);
        }, 'GET');

}