$(document).on( "pageshow","#ver_datos_bancarios",function( event ) {
    tabla_cuentas();
});



function tabla_cuentas() {
    var id_edificio = $('#id_edificio').val();    

    var datos = {};

    datos.estado = 1;
    datos.id_edificio = id_edificio;
    datos.id_persona = _SESSION('id_persona');

    cargando(1);
    var api = new Api('datos_bancarios_persona', 'ver_registros');
    api.request(datos,
        function (resp) {

            //var titulos = [['Nombre', ''], ['Espacio Común', ''], ['Horario', ''], ['Arriendo', '']];
            var titulos = [['Registros Cuentas', '']];
            var html = '';
            var div_tabla = 'tabla_registros_cuentas';
            html += armar_tabla_head(titulos, div_tabla);
            
            if (resp.estado == 1) {
                
                for (var key in resp.registros) {
                 
                    html += '<tr>';
                    html += '<td>';

                    html += `
                        <p><b>Rut:</b> ${resp.registros[key].rut}</p>
                        <p><b>Nombre:</b> ${resp.registros[key].nombre}</p>
                        <p><b>Correo:</b> ${resp.registros[key].correo}</p>
                        <p><b>Banco:</b> ${resp.registros[key].banco}</p>
                        <p><b>Tipo Cuenta:</b> ${resp.registros[key].tipo_cuenta}</p>
                        <p><b>Número Cuenta:</b> ${resp.registros[key].numero_cuenta}</p>
                        <p><b>Fechas Registro:</b> ${resp.registros[key].fecha_ingreso}</p>
                        <div class="row mt10">
                            <div class="col-xs-12"><button class="btn btn-danger" onclick="remover_cuenta(${resp.registros[key].id},0)">Eliminar</button></div>
                        </div>
                    `;

                    html += '</td>';
                    html += '</tr>';
                }
            } 

            html+='</table>';

            $('#tabla_registro_cuentas').html(html);            
            cargando(0);
        },
        function (resp) {
            console.log(resp);
        }, 'GET');

}

const remover_cuenta = (id, estado) => {

    
    var id_edificio = $('#id_edificio').val();

    var datos = {};

    datos.id = id;
    datos.id_edificio = id_edificio;
    datos.estado = estado;    

    cargando(1);
    var api = new Api('datos_bancarios_persona', 'estado');
    api.request(datos,
        function (resp) {
            
            if (resp.estado == 1) {
                msg('Estado', 'Cuenta removida con exito', 'success');
                tabla_cuentas();                
            } else {
                msg('Problema', 'Problemas al remover al invitado', 'error');
            }

            cargando(0);
        },
        function (resp) {
            console.log(resp);
            cargando(0);
        },
        'POST'
    );

}

