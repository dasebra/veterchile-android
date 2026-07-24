$(document).on( "pageshow","#perfil",function( event ) {
   
    var id_persona = _SESSION('id_persona');

    cargarClientePerfil(id_persona);

});

$(document).on( "pageshow","#cambiar_contrasena",function( event ) {
   
});


const cargarClientePerfil = (id_persona) => {

       
    // console.log(id_persona_cap);
    var datos = {};

    // datos.estado = 1;
    datos.id_edificio = $('#id_edificio').val();
    datos.id = id_persona;

    cargando(1);

    var api = new Api("persona", "ver_registro");
    api.request(
        datos,
        function (resp) {
            //console.log(resp);

            if (resp.estado == 1) {
                                                
                $('#id_p').val(resp.registros.id);
                $('#nombre_p').val(resp.registros.nombre);
                $('#apellidop_p').val(resp.registros.apellido_paterno);
                $('#apellidom_p').val(resp.registros.apellido_materno);
                $('#profesion_p').val(resp.registros.profesion);
                $('#rut_p').val(resp.registros.rut);
                $('#email_p').val(resp.registros.email);
                $('#celular_p').val(resp.registros.celular);
                $('#renta_liquida_p').val(resp.registros.renta_liquida);                
            } else {                
                msg('Perfil de Cliente', 'Intente Nuevamente', 'error');
            }

            cargando(0);

        },
        function (resp) { 
            msg('Conexion', 'Error de conexión Internet', 'error');
            cargando(0); 
            console.log(resp); 
        },
        "GET");

}

const actualizarDatosPerfil = () =>{


    var id_p = $.trim($('#id_p').val());
    var nombre_p = $.trim($('#nombre_p').val());
    var apellidop_p = $.trim($('#apellidop_p').val());
    var apellidom_p =$.trim($('#apellidom_p').val());
    var profesion_p =$.trim($('#profesion_p').val());
    var rut_p =$.trim($('#rut_p').val());
    var email_p =$.trim($('#email_p').val());
    var celular_p =$.trim($('#celular_p').val());
    var renta_liquida_p =$.trim($('#renta_liquida_p').val());   
    
    if(nombre_p=='')
    {
        $('#nombre_p').focus().select();
        msg('Perfil de Cliente','Debe ingresar el nombre', 'warning');
        return false;
    }

    if(apellidop_p=='')
    {
        $('#apellidop_p').focus().select();
        msg('Perfil de Cliente','Debe ingresar el apellido paterno', 'warning');
        return false;
    }

    if(apellidom_p=='')
    {
        $('#apellidom_p').focus().select();
        msg('Perfil de Cliente','Debe ingresar el apellido materno', 'warning');
        return false;
    }
    

    if(email_p=='')
    {
        $('#email_p').focus().select();
        msg('Perfil de Cliente','Debe ingresar el email', 'warning');
        return false;
    }

     // console.log(id_persona_cap);
     var datos = {};

     // datos.estado = 1;
     datos.id_edificio = $('#id_edificio').val();
     datos.id = id_p;
     datos.nombre = nombre_p;
     datos.apellido_paterno = apellidop_p;
     datos.apellido_materno = apellidom_p;
     datos.profesion = profesion_p;
     datos.rut = rut_p;
     datos.email = email_p;
     datos.telefono = '';
     datos.celular = celular_p;
     datos.renta_liquida = renta_liquida_p;
 
     $('#btn-actualizar-datos').attr('onclick','').addClass('btn-app-inactive');
     cargando(1);
 
     var api = new Api("persona", "modificar");
     api.request(
         datos,
         function (resp) {
             //console.log(resp);
 
             if (resp.estado == 1) {                 
                msg('Perfil de Cliente', 'Datos Actualizados', 'success'); 
                //Registrar Notificacion
                registrarNotificacion('Datos actualizados en perfil');                   
             } else {                
                 msg('Perfil de Cliente', 'Intente Nuevamente', 'error');
             }
             cargando(0);
             $('#btn-actualizar-datos').attr('onclick','actualizarDatosPerfil()').removeClass('btn-app-inactive');
 
         },
         function (resp) { 
             msg('Conexion', 'Error de conexión Internet', 'error');
             cargando(0); 
             console.log(resp); 
         },
         "POST");
}



const actualizarContransena = () => {
    var id_registro = _SESSION('id_usuario');
    var pass = $.trim($('#clave_nueva').val());
    var pass2 = $.trim($('#clave_nueva2').val());

    if (pass == '') {
        msg('Password', 'Debe ingresar Passwrod');
        $('#clave_nueva').select().focus();
        return false;
    }
    else if (pass != pass2) {
        msg('Contraseña', 'La contraseña y la confirmacion no son iguales.', 'error');
        $('#clave_nueva').select().focus();
        return false;
    }

    var datos = {};

    datos.id = id_registro;
    datos.password = pass;

    cargando(1);
    $('#btn-actualizar-datos').attr('onclick','').addClass('btn-app-inactive');
    var api = new Api("usuario", "cambiar_clave");
    api.request(
        datos,
        function (resp) {
           
            if (resp.estado == 2) {
                msg('Cambio de Clave', 'Se presento una falla, intente nuevamente', 'error');
                $('#btn_cambiar_password').attr('disabled', false);


            } else {
                if (resp.estado == 1) {                    
                    $.trim($('#clave_nueva').val(''));
                    $.trim($('#clave_nueva2').val(''));
                    msg('Cambio de Clave', 'Cambio de Clave de forma exitosa.', 'success');                    
                    vista('perfil');
                } else {
                    msg('Cambio de Clave', 'Se presento una falla, intente nuevamente', 'error');                    
                }

            }
            $('#btn-actualizar-datos').attr('onclick','actualizarContransena()').removeClass('btn-app-inactive');
            cargando(0);
        },
        function (resp) { 
            msg('Conexion', 'Error de conexión Internet', 'error');
            cargando(0);
            console.log(resp); 
        },
        "POST");
}




