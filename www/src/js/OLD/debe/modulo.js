$(document).on( "pageshow","#debe",function( event ) {

    //cargarPagos(_SESSION('id_persona'),_SESSION('productos'),'tabla_registro_pago');
    cargarPagos(_SESSION('id_contrato'),'tabla_registro_pago');
});

const cargarPagos = (id_contrato,divid) => {

    var datos = {};
    datos.id_edificio = $('#id_edificio').val();    
    datos.id_contrato = id_contrato;

    cargando(1);

    var api = new Api("documento", "ver_registros");
    api.request(
        datos,
        function (resp) {
            // console.log(resp);
            var titulos = [['Tipo Pago', ''], ['Fecha Pago', ''], ['Fecha Venc.', ''], ['Monto Morosidad', ''], ['Monto', ''], ['Estado', '']];

            var estado_list = ['','PENDIENTE', 'PAGADO', 'RECHAZADO'];
            var estado_color = ['warning','warning', 'success', 'danger'];

            var html = '';
            var div_tabla = 'tabla_registros_pagos';
            html += armar_tabla_head(titulos, div_tabla);

            if (resp.estado == 1) {
                // console.log(resp.registros);
                for (var key in resp.registros) {
                    html += '<tr onclick="verCargarDetallePago('+resp.registros[key].id+')">';
                    //html += '<td>' + resp.registros[key].id + '</td>';
                    html += '<td>' + resp.registros[key].tipo_documento.nombre + '</td>';
                    html += '<td>' + fecha_eng(resp.registros[key].fecha_emision) + '</td>';
                    html += '<td>' + fecha_eng(resp.registros[key].fecha_vencimiento) + '</td>';
                    html += '<td>$' + monedaPesos(resp.registros[key].monto_morosidad) + '</td>';
                    html += '<td>$' + monedaPesos(resp.registros[key].total) + '</td>';

                    html += '<td><label id="estado_reg8_' + resp.registros[key].id + '" class="label label-' + estado_color[resp.registros[key].estado] + ' size10" onclick="">' + estado_list[resp.registros[key].estado] + '</label></td>';


                    /*
                    if (resp.registros[key].factura_nombre != '' && resp.registros[key].factura_nombre != null) {
                        if (resp.registros[key].total > 0) {
                            html += '<td><button data-fancybox data-src="https://manager.largroup.cl/facturacion/' + resp.registros[key].factura_nombre + '" data-type="iframe" class="btn btn-success menu-icon fa fa fa-file-text-o boton" href="javascript:;"></button></td>';
                            html += '<td><a href="https://manager.largroup.cl/facturacion/' + resp.registros[key].factura_nombre + '" target="_blank" download="' + resp.registros[key].factura_nombre + '"><div class="btn btn-default fa fa-download hei50" ></div></a></td>'

                        } else {
                            html += '<td><button class="btn  menu-icon fa fa fa-file-text-o boton disable" href="javascript:;"></button></td>';
                            html += '<td><button class="btn  menu-icon fa fa fa-file-text-o boton disable" href="javascript:;"></button></td>';

                        }
                    }
                    else {
                        html += '<td><button class="btn  menu-icon fa fa fa-file-text-o boton disable" href="javascript:;"></button></td>';
                        html += '<td><button class="btn  menu-icon fa fa fa-file-text-o boton disable" href="javascript:;"></button></td>';
                    }
                    */
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

const verCargarDetallePago = (id_documento) => {

    setSession('_id_documento',id_documento);
    vista('detalle_debe');
}

