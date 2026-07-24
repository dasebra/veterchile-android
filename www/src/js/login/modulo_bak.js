
const ingresarLogin = () => {

    var user = $.trim($('#user').val());
    var pass = $.trim($('#pass').val());

    if(user=='')
    {
        msg('Login','Debe ingresar el usuario','warning');
        $('#user').focus().select();
        return false;
    }

    if(pass=='')
    {
        msg('Login','Debe ingresar el password','warning');
        $('#pass').focus().select();
        return false;
    }

    var datos = {};

    datos.user = user;
    datos.pass = pass;

    cargando(1); 

    var api = new Api("usuario", "login");
    api.request(
        datos,
        function (resp) {
            
            if (resp.estado == 1) {

                //console.log(resp);
                vista('home','fade')
                sesionUsuarioInit(resp.usuario);
            } else {                
                msg('Login', 'No se encontro el usuario o password incorrecto, vuelva a intentarlo.', 'error');
            }
            cargando(0); 

        },
        function (resp) { 
            cargando(0); 
            //console.log(resp);        
            msg('Login', 'Error de conexión', 'error');
        },
        "POST");
}


const recuperarContrasena = () =>{

    var texto1 = 'Para recuperar tu contraseña debes ingresar tu correo';    
    $('#texto-recuperar').html(`<span class="size12 fade-in">${texto1}</span>`);

    var html = `
    <div class="col-xs-1"></div>
    <div class="col-xs-10">
        <div class="col-xs-12 mt15">
            <!--<p class="size16 color-gris opacity0-5">Ingrese su Rut</p>-->
            <input type="text" class="input-app size16 color-gris col-xs-12 icon-3" placeholder="RUT(Ej:123456789)" id="rut">
        </div>
        <div class="col-xs-12 mt15">
        <!--<p class="size16 color-gris opacity0-5">Ingrese su correo</p>-->
        <input type="text" class="input-app size16 color-gris col-xs-12 icon-1" placeholder="Correo" id="correo">
    </div>
    </div>
    `;

    $('#cont_i_form').html(html);


    var html2 = `
    <div class="col-xs-6 padding0">
        <div class="btn-app-2 color-blanco size12 pt15 pb15 lineh3 center-block" onclick="volverLogin()">VOLVER</div>
    </div>
    <div class="col-xs-6 padding0">
        <div class="btn-app-1 color-blanco pt15 pb15 size12 lineh3 text-uppercase" onclick="recuperarPassword()">Recuperar</div>
    </div>
    `;

    $('#cont_btn_form').html(html2);


    var block_hide =  ['cont_i_login','cont_o_contrasena'];
    var block_show = ['cont_i_form','cont_btn_form','cont_btn_registrar'];
    showHiddenBlock(block_hide,block_show);
}


const volverLogin = () => {

    var texto1 = '¡BIENVENIDO!';
    var texto2 = 'A DEISA APP DESARROLLO';
    $('#texto-recuperar').html(`<span class="size20 fade-in">${texto1}</span><br><span class="size14 fade-in">${texto2}</span>`);

    var block_hide = ['cont_i_form','cont_btn_form'];
    var block_show =  ['cont_i_login','cont_o_contrasena','cont_btn_registrar'];
    showHiddenBlock(block_hide,block_show);
}

const registrarUsuario = () =>{
    var texto1 = 'Debe llenar todos los datos para registrar el usuario';    
    $('#texto-recuperar').html(`<span class="size12 fade-in">${texto1}</span>`);


    var html = `
    <div class="col-xs-1"></div>
    <div class="col-xs-10">
        <div class="col-xs-12 mt15">
            <p class="size16 color-blanco opacity0-5">Rut</p>
            <input type="text" class="input-app size20 color-blanco col-xs-12" id="rut_r">
        </div>
        <div class="col-xs-12 mt15">
            <p class="size16 color-blanco opacity0-5">Ingrese su correo</p>
            <input type="text" class="input-app size20 color-blanco col-xs-12" id="correo_r">
        </div>
        <div class="col-xs-12 mt15">
            <p class="size16 color-blanco opacity0-5">User</p>
            <input type="text" class="input-app size20 color-blanco col-xs-12" id="user_r">
        </div>
        <div class="col-xs-12 mt15">
            <p class="size16 color-blanco opacity0-5">Pass</p>
            <input type="password" class="input-app size20 color-blanco col-xs-12" id="pass_r">
        </div>
    </div>
    `;

    $('#cont_i_form').html(html);


    var html2 = `
            <div class="col-xs-6 pl5 pr5">
                <div class="btn-app2 color-blanco size12 pt15 pb15 opacity0-5 center-block" onclick="volverLogin()">VOLVER</div>
            </div>
            <div class="col-xs-6">
                <div class="btn-app1 pt15 pb15 size12 text-uppercase" onclick="">Registrar</div>
            </div>
    `;

    $('#cont_btn_form').html(html2);

    var block_hide =  ['cont_i_login','cont_o_contrasena','cont_btn_registrar'];
    var block_show = ['cont_i_form','cont_btn_form'];
    showHiddenBlock(block_hide,block_show);

}


const recuperarPassword = () =>{
    var rut = $.trim($('#rut').val());
    var correo = $.trim($('#correo').val());

    if(!Rut(rut))
    {
        //msg('Login','Debe ingresar un rut valido','warning');
        $('#rut').focus().select();
        return false;
    }

    if(correo=='')
    {
        msg('Login','Debe ingresar un correo valido','warning');
        $('#correo').focus().select();
        return false;
    }

    var datos = {};

    datos.rut = rut;
    datos.email = correo;

    cargando(1); 

    var api = new Api("usuario", "recuperar_contrasena");
    api.request(
        datos,
        function (resp) {
            
            if (resp.estado == 1) {

                msg('aviso','Se enviara a su correo con su nueva contraseña temporal','success');
                volverLogin();
                
            } else {                
                msg('Login', 'No se encontro el usuario, vuelva a intentarlo.', 'error');
            }
            cargando(0); 

        },
        function (resp) { 
            cargando(0); 
            console.log(resp);        
            msg('Login', 'Error de conexión', 'error');
        },
        "POST");
}