$(document).on( "pageshow","#home",function( event ) {

    activarSel(0);

    var lista_opciones_user = `
                    <li><a href="#">DATOS AVAL</a>
                        <ul>
                            <li><a href="#" onclick="vista('aval')">VER DATOS</a></li>
                        </ul>
                    </li>
                    <li><a href="#">RESERVAR ESPACIO COMÚN</a>
                        <ul>
                            <li><a href="#" onclick="vista('agregar_reserva')">AGREGAR RESERVA</a></li>
                            <li><a href="#" onclick="vista('ver_reservas')">VER RESERVAS</a></li>
                        </ul>
                    </li>                   
                    <li><a href="#">VISITAS</a>
                        <ul>
                            <li><a href="#" onclick="vista('agregar_lista_invitados')">REGISTRAR LISTA VISITA</a></li>                        
                            <li><a href="#" onclick="vista('ver_lista_invitados')">VER LISTAS REGISTRADAS</a></li>                
                        </ul>
                    </li>
                    <li><a href="#">RECLAMOS</a>
                        <ul>
                            <li><a href="#" onclick="vista('agregar_reclamo')">AGREGAR RECLAMO</a></li>
                            <li><a href="#" onclick="vista('ver_reclamos')">VER RECLAMOS</a></li>
                        </ul>
                    </li>       
                    <li><a href="#">DATOS BANCARIOS</a>
                        <ul>
                            <li><a href="#" onclick="vista('agregar_datos_bancarios')">AGREGAR CUENTA</a></li>
                            <li><a href="#" onclick="vista('ver_datos_bancarios')">VER CUENTAS</a></li>
                        </ul>
                    </li>        
                    <li><a href="#">MULTAS</a>
                        <ul>                        
                            <li><a href="#" onclick="vista('ver_multas')">VER MULTAS</a></li>
                        </ul>
                    </li> 
    `;


    $('#accordion-1').html(lista_opciones_user);

    $('#accordion-1').dcAccordion({
        eventType: 'click',
        autoClose: true,
        saveState: true,
        disableLink: true,
        speed: 'slow',
        showCount: false,
        autoExpand: false,
        classActive	 : 'active',
        classArrow	 : 'dcjq-icon',
        cookie	: 'dcjq-accordion-1',
        classExpand	 : 'dcjq-current-parent'
    });


    
    var id_persona = _SESSION('id_persona');

    $('#pago_label').html('$'+load_animate);
    $('#morosidad_label').html('$'+load_animate);
    $('#total_pagar_label').html('$'+load_animate);
    $('#unidad_arrendada_text').html(load_animate);
      
    //cargarCliente(id_persona);
    //ver_contratos_activos();
    
    //Cantidad de notificaciones
    //cantidadNotificaciones();
});

const activarSel = (n) => {

    $('.btn-submenu> div').removeClass('activo_submenu');
    $('.btn-submenu> div').eq(n).addClass('activo_submenu');

    $('.tabs').fadeOut(0);
    $('.tabs').eq(n).fadeIn();

    switch(n)
    {
        case '0':
            
        break;
        case '1':
            
        break;
        case '2':
            
        break;
    }
}



//const cargarCliente = (id_persona) => {
const cargarCliente = () => {
        
    var datos = {};

    datos.id_edificio = $('#id_edificio').val();
    datos.id_persona = _SESSION('id_persona');
    datos.id_contrato = $('#list_contratos').val();
    datos.id_tipo_usuario = _SESSION('id_tipo_usuario');

    cargando(1);

    //var api = new Api("extranet", "perfil");
    var api = new Api("extranet", "perfil_cliente");
    api.request(
        datos,
        function (resp) {
        
            if (resp.estado == 1) {
                
               
                 // HOME DATA
                $('#nombre_persona').html(resp.persona.nombre+' '+resp.persona.apellido_paterno+' '+resp.persona.apellido_materno);
                //$('#unidad_arrendada_text').html(resp.productos.departamentos);

                var lista_prod = '';

                if(resp.productos.departamentos!='')
                lista_prod += `Mi departamento <span class="txt_bold size14 color-celeste">${resp.productos.departamentos}</span><br>`;
                if(resp.productos.bodegas!='')
                lista_prod += `Mi bodega <span class="txt_bold size14 color-celeste">${resp.productos.bodegas}</span><br>`;
                if(resp.productos.estacionamientos!='')
                lista_prod += `Mi estacionamientos <span class="txt_bold size14 color-celeste">${resp.productos.estacionamientos}</span><br>`;


                $('#lista_productos').html(lista_prod);

                $('#pago_label').html('$'+resp.deuda_miles);
                $('#morosidad_label').html('$'+resp.morosidad_miles);
                $('#total_pagar_label').html('$'+resp.total_miles);
                $('#total_pagar').val(resp.total);


                //var id_contrato = resp.id_contratos.split(',');

                //setSession('id_contrato',id_contrato[0]);
                var id_contrato = $('#list_contratos').val();
                setSession('id_contrato',id_contrato);

                setSession('productos',resp.id_productos);
                //ACTIVAR BOTON DETALLE
                $('#btn-ver-detalle').removeClass('btn-app-inactive').addClass('btn-app-1').attr('onclick','vista(\'debe\')');
                $('#btn-pagar-deuda').removeClass('btn-app-inactive').addClass('btn-app-2').attr('onclick','generarOrdenApp()');
                
                //LLAMAR CONTRATO PARA OBTENER ID EDIFICIO
                verContratoIdEdificio(id_contrato);

            } else {
                // html('');
                msg('Perfil de Cliente', 'Intente Nuevamente', 'error');
            }

            cargando(0);

        },
        function (resp) { 
            cargando(0); 
            console.log(resp); 
        },
        "GET");

}


const verContratoIdEdificio = (id_contrato) =>{

    var datos = {};
        datos.id = id_contrato;
        
        var api = new Api("contrato", "ver_registro");
        cargando(1);
        api.request(
            datos,
            function (resp) {
                $('#id_edificio').val(resp.registros.id_edificio);
                setSession('id_edificio',resp.registros.id_edificio);
                $('#nombre_edificio_sel').html(resp.registros.edificio.nombre);

                var img_bg = ['','../src/images/home/soho.jpg','../src/images/home/park.jpg'];
                $('#bg_edificio').attr('src',img_bg[resp.registros.id_edificio]);
            },
            function (resp) { console.log(resp); },
            "GET");
}


const ver_contratos_activos = () => {

    if (_SESSION('id_tipo_usuario') == 12) {

        var datos = {};
        datos.estado = '2,3';
        //datos.id_edificio = $('#id_edificio').val();
        datos.id_persona = _SESSION('id_persona');

        var api = new Api("contrato", "ver_registros");
        cargando(1);
        api.request(
            datos,
            function (resp) {
                cargando(0);
                html = '';
                if (resp.estado == 1) {

                    $('#list_contratos').html('');
                    for (var key in resp.registros) {
                        $('#list_contratos').append('<option data-id_persona="' + resp.registros[key].id_persona + '" value="' + resp.registros[key].id + '">Contrato Nro. ' + resp.registros[key].id + '</option>'); 
                    }

                    if(_SESSION('id_contrato')!=null&&_SESSION('id_contrato')!='')
                    {
                        $('#list_contratos').val(_SESSION('id_contrato'));
                    }
                    
                    cargarCliente();

                }                

            },
            function (resp) { console.log(resp); },
            "GET");
    } else {

        var datos = {};
        datos.estado = '2,3';
        datos.id_edificio = $('#id_edificio').val();
        datos.id_persona = _SESSION('id_persona');
        var api = new Api("extranet", "cantidad_contratos");
        cargando(1);
        api.request(
            datos,
            function (resp) {
                cargando(0);
                html = '';

                if (resp.estado == 1) {
                    
                    $('#list_contratos').html('');
                    for (var key in resp.contratos) {
                        $('#list_contratos').append('<option data-id_persona="' + resp.registros[key].id_persona + '" value="' + resp.registros[key].id + '">Contrato Nro. ' + resp.registros[key].id + '</option>'); 
                    }

                    if(_SESSION('id_contrato')!=null&&_SESSION('id_contrato')!='')
                    {
                        $('#list_contratos').val(_SESSION('id_contrato'));
                    }
                    
                    cargarCliente();
                    
                }                

            },
            function (resp) { console.log(resp); },
            "GET");
    }

}


const cargarDashboard = () => {

    var datos = {};    
    datos.id_edificio = $('#id_edificio').val();
    datos.id_persona  = _SESSION('id_persona');
    datos.id_contrato = _SESSION('id_contrato');

    $('#cant_residentes').html(load_animate);
    $('#cant_estacionamientos').html(load_animate);
    $('#cant_bodegas').html(load_animate);
    $('#cant_reservas').html(load_animate);
    $('#cant_multas').html(load_animate);
    $('#cant_visitas').html(load_animate);
    $('#cant_reclamos').html(load_animate);

    if(datos.id_contrato=='')
    {
        $('#cant_residentes').html(0);
        $('#cant_estacionamientos').html(0);
        $('#cant_bodegas').html(0);
        $('#cant_reservas').html(0);
        $('#cant_multas').html(0);
        $('#cant_visitas').html(0);
        $('#cant_reclamos').html(0);
        return false;        
    }

    var api = new Api("extranet", "dashboard");
    api.request(
        datos,
        function (resp) {
           
            if (resp.estado == 1) {
               
                $('#cant_residentes').html(resp.cantidad_residentes);
                $('#cant_estacionamientos').html(resp.cantidad_estacionamiento);
                $('#cant_bodegas').html(resp.cantidad_bodega);
                $('#cant_reservas').html(resp.cantidad_reservas);
                $('#cant_multas').html(resp.cantidad_multa);
                $('#cant_visitas').html(resp.cantidad_lista_invitado);
                $('#cant_reclamos').html(resp.cantidad_reclamo);               
            }

        },
        function (resp) { 

            console.log(resp); 
        },
        "GET");

}

const pagarDeuda = () =>{

    cargando(1);
    window.open('https://www.bhstudios.com/webpayws/', '_self', 'location=yes');
    //window.open('https://www.bhstudios.com/webpayws/', '_blank', 'location=yes');

}

const pagarDeuda2 = () =>{

    cargando(1);
    //window.open('https://www.bhstudios.com/webpayws/', '_system', 'location=yes');
    window.open('https://www.bhstudios.com/webpayws/', '_blank', 'location=yes');

}


const pagarDeuda3 = () =>{

    cargando(1);
    //window.open('https://www.bhstudios.com/webpayws/', '_system', 'location=yes');
    window.open('https://www.bhstudios.com/webpayws/', '_system', 'location=yes');

}


function generarOrdenApp() {
    var monto = parseInt($('#total_pagar').val());
    var id_edificio = $('#id_edificio').val();
    var id_contrato = $('#id_contrato').val();  

    if (monto > 0) {        
        var datos = {};
        datos.id_edificio = id_edificio;
        datos.id_contrato = id_contrato;
        datos.monto = monto;

        $('#btn-pagar-deuda').addClass('btn-app-inactive').removeClass('btn-app-2').attr('onclick','');
        
        cargando(1);
        var api = new Api('orden', 'procesar_pago_mensual');
        api.request(datos,
            function (resp) {
                console.log(resp);
                if (resp.estado == 1) {

                    var orden = {};
                    orden.numero = resp.id_orden;
                    orden.monto = monto;
                    
                    var btn_disabled = '';
                    var btn_color = 'success';
                    
                    msg('Debe', 'Manejo de Orden creada.', 'success');
                    
                    pagarWebPayDebeManualApp(orden);
                                        
                } else {
                    msg('Problemas al generar orden', 'Problemas al generar la orden, vuelva a intentarlo.', 'warning', 1);
                    $('#btn-pagar-deuda').removeClass('btn-app-inactive').addClass('btn-app-2').attr('onclick','generarOrdenApp()');
                }
            },
            function (resp) {
            }, 'POST');
    }
    else {
        msg('Debe', 'No tiene deudas pendientes', 'warning');
    }
    
}

function pagarWebPayDebeManualApp(orden) 
{

    /** desarrollo */
    
    const ID_OP = ["", "200033", "200035"]
    const DIR_OP = "pre.otrospagos.com";
    
    /** produccion */
    /*
     const ID_OP = ["", "300290", "300291"]
     const DIR_OP = "otrospagos.com";
     */

    var id_edificio = $('#id_edificio').val();;

    var datos = {};

    datos.url = 'https://' + DIR_OP + '/publico/portal/enlace?id=' + ID_OP[id_edificio] + '&idcli=' + orden.numero + '&tiidc=03';

    //setSession('otros_pagos',unescape(datos.url));
     window.open(unescape(datos.url),'_self', 'location=yes');

    //alert('5 cambio');
    //cordova.exec(successFunction, errorFunction, "InAppBrowser", "open", [unescape(datos.url), '_blank', 'location=yes']);
    //var ref = cordova.InAppBrowser.open(unescape(datos.url), '_system', 'location=yes');
    //window.open = cordova.InAppBrowser.open;
    vista('pago');

}

function pagarWebPayDebeManualApp2(orden) {
    
    var datos = {};
    
    datos.url = 'https://cliente.largroup.cl/APIWP/webpay/init';
    datos.id_orden_compra = orden.numero;
    datos.monto_orden_compra = orden.monto;
    datos.url_return = 'https://cliente.largroup.cl/';
    datos.url_final = 'https://cliente.largroup.cl/'+'cierre_app/orden.php';    
    datos.url_exito_postulacion = '6';    

    $.ajax({
        type: 'POST',
        url: datos.url,
        data: datos,
        dataType: 'json',
        success: function (resp) 
        {            
            if (resp.estado == 1) 
            {                
                //$('#webpaywbs').html(atob(resp.html));
                //$('#webPayWbs').submit();

                var iframe = document.createElement('iframe');
                iframe.style.width = '100vw';
                iframe.style.height = '100vh';
                iframe.style.border = 0;
                var form = atob(resp.html);
                var html = '<body>'+form+'</body><script>document.getElementById("webPayWbs").submit();</script>';
                iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);                
                $('#iframe_pago').html(iframe);
                vista('pago');                                
            } 
            else 
            {
                msg('Problemas al enviar a webpay', 'Problema al direccionar a webpay, vuelva a intentarlo.', 'warning', 1);
                $('#btn-pagar-deuda').removeClass('btn-app-inactive').addClass('btn-app-2').attr('onclick','generarOrdenApp()');
            }
            cargando(0);
        }
    });
    
}

const cancelarPago = () =>{
    if(confirm('¿Esta seguro que quiere volver al perfil?'))
    backHistorial();
}





