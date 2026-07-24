$(document).on( "pageshow","#ver_invitados",function( event ) {
    tabla_ver_invitados_confirmados();
});


const tabla_ver_invitados_confirmados = () => {

    var id_solicitud = _SESSION('id_solicitud');

    var datos = {};

    datos.id_edificio = 1;
    datos.id_solicitud = id_solicitud;
    datos.estado = '1';

    cargando(1);
    var api = new Api('solicitud_invitado', 'ver_registros');
    api.request(datos,
        function (resp) {
                
            var color_estados = ['danger', 'success'];
            var texto_estados = ['Confimar','Desactivar']
            //var titulos = [['Rut', ''], ['Nombre', ''], ['Email', ''], ['Telefono', ''], ['Estado', ''], ['Remover', '']];
            var titulos = [['Registros', '']];
            var html = '';
            var html2 = '';
            var div_tabla = 'tabla_invitado';
            html += armar_tabla_head(titulos, div_tabla);
            if (resp.estado == 1) {
                for (var key in resp.registros) {
                    html += '<tr><td>';
                    html += `
                        <div class="row">
                            <div class="col-xs-5 col-xs-offset-1">Rut: ${resp.registros[key].rut}</div>
                            <div class="col-xs-5">Nombre: ${resp.registros[key].nombre}</div>
                        </div>
                        <div class="row">
                            <div class="col-xs-5 col-xs-offset-1">Email: ${resp.registros[key].email}</div>
                            <div class="col-xs-5">Teléfono: ${resp.registros[key].telefono}</div>
                        </div>                    
                    `;               
                    html += '</td></tr>';
                }              
            } 
            html+='</table>';
            $('#contenedor_invitados').html(html);
       
            cargando(0);
        },
        function (resp) {
            console.log(resp);
            cargando(0);
        },
        'GET'
    );
}