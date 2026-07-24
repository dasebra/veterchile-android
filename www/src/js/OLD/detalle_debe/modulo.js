$(document).on( "pageshow","#detalle_debe",function( event ) {

    cargarDetallePagos(_SESSION('_id_documento'),'tabla_registro_detalle');
});



const cargarDetallePagos = (id_documento,divid) => {


    var datos = {};
    datos.id_edificio = $('#id_edificio').val();
    datos.id_documento = id_documento;

    cargando(1);

    var api = new Api("detalle_documento", "ver_registros");
    api.request(
        datos,
        function (resp) {
            var titulos = [['Detalle', ''], ['Cantidad', ''], ['Valor Unitario', ''], ['Descuento', '']];

            var html = '';
            var div_tabla = 'tabla_registros_pagos';
            html += armar_tabla_head(titulos, div_tabla);

            if (resp.estado == 1) {
                for (var key in resp.registros) {
                    html += '<tr>';
                    html += '<td>' + resp.registros[key].detalle + '</td>';
                    html += '<td>' + parseInt(resp.registros[key].cantidad) + '</td>';
                    html += '<td>' + monedaPesos(resp.registros[key].valor_unitario) + '</td>';
                    html += '<td>$' + monedaPesos(resp.registros[key].descuento) + '</td>';
                    html += '</tr>';
                }

            } else {
                html += '';
            }
            
            $('#'+divid).html(html);
            
            cargando(0);
        },
        function (resp) { 
            cargando(0); 
            console.log(resp); 
        },
        "GET");
}
