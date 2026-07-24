$(document).on( "pageshow","#agregar_invitados",function( event ) {
    tabla_ver_invitados();
});


const tabla_ver_invitados = ()  =>  {

    var id_solicitud = _SESSION('id_solicitud');

  
    var datos = {};

    datos.id_edificio = 1;
    datos.id_solicitud = id_solicitud;
    datos.estado = '0,1';

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
                        <div class="row mt10">
                            <div class="col-xs-5 col-xs-offset-1"><button id="reg_11' ${resp.registros[key].id} '" class="btn btn-${color_estados[resp.registros[key].estado]}" onclick="estado_invitado('${resp.registros[key].id}','${resp.registros[key].estado}')">${texto_estados[resp.registros[key].estado]}</button></div>
                            <div class="col-xs-5"><button id="reg_11remover'${resp.registros[key].id}'" class="btn btn-danger menu-icon fa fa fa-trash-o" onclick="remover_invitado('${resp.registros[key].id}',' ${resp.registros[key].estado}')">Eliminar</button></div>
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




const agregarInvitado = () => {
    var id_solicitud = _SESSION('id_solicitud');
    var nombre = $('#nombre').val();
    var rut = $('#rut').val();
    var email = $('#email').val();
    var telefono = $('#telefono').val();



    if (!Rut(rut)) {
        msg('Invitado', 'Debe ingresar rut del invitado', 'warning');
        $('#rut').select().focus();
        return false;
    }


    if (nombre == '') {
        msg('Invitado', 'Debe ingresar nombre del invitado', 'warning');
        $('#nombre').select().focus();
        return false;
    }

    var api = new Api('solicitud_invitado', 'registrar');
    var datos = {};

    datos.id_edificio = 1;
    datos.id_solicitud = id_solicitud;
    datos.nombre = nombre;
    datos.rut = rut;
    datos.estado = 0;
    datos.email = email;
    datos.telefono = telefono;

    cargando(1);
    $('#btn-registrar').attr('click', '').addClass('btn-app-inactive');    
    api.request(datos,
        function (resp) {
           

            if (resp.estado == 1) {
                $('#nombre').val('');
                $('#rut').val('');
                $('#email').val('');
                $('#telefono').val('');
                tabla_ver_invitados();               
                msg('Invitado', 'Invitado registrado correctamente', 'success');
            } else if (resp.estado == 2) {
                msg('Invitado', 'Invitado ya existe', 'warning');
            } else {
                msg('Invitado', 'Se presento una falla, intente nuevamente', 'error');
            }

            $('#btn-registrar').attr('click', 'agregarInvitado()').removeClass('btn-app-inactive');
            cargando(0);
        },
        function (resp) {
            console.log(resp);
            cargando(0);
        },
        'POST'
    );
}

const estado_invitado = (id, estado) => {
    
    if (estado==0)
        estado = 1;
    else
        estado = 0;

    var id_edificio = $('#id_edificio').val();
   
    var datos = {};
    datos.id = id;
    datos.id_edificio = id_edificio;
    datos.estado = estado;    

    cargando(1);
    var api = new Api('solicitud_invitado', 'estado');
    api.request(datos,
        function (resp) {
            
            if (resp.estado == 1) {
                msg('Estado', 'Cambios de estado, exitoso.', 'success');
                tabla_ver_invitados();
            } else {
                msg('Problema', 'Problemas al cambiar el estado, vuelva a intentarlo.', 'error');
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


const remover_invitado = (id, estado) => {
    var id_solicitud = _SESSION('id_solicitud');

    var estado = -1;

    var id_edificio = $('#id_edificio').val();
    
    var datos = {};

    datos.id = id;
    datos.id_edificio = id_edificio;
    datos.estado = estado;
    datos.id_solicitud = id_solicitud;

    cargando(1);
    var api = new Api('solicitud_invitado', 'estado');
    api.request(datos,
        function (resp) {
            
            if (resp.estado == 1) {
                msg('Estado', 'Invitado removido con exito', 'success');
                tabla_ver_invitados();             
                registrarNotificacion('Registro de invitado');                  
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