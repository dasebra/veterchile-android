$(document).on( "pageshow","#aval",function( event ) {
   
    var id_persona = _SESSION('id_persona');
    var id_contrato = _SESSION('id_contrato');
    traerIdAval(id_contrato);

    listaEstadoCivil('estado_civil_aval', '');
    listaRegionTxt('region_aval', 0, 0);
});

const traerIdAval = (id_contrato) => {
    var datos = {};
    datos.id = id_contrato;
    var api = new Api('contrato','ver_registro');    
    api.request(datos,
        function(resp){                    
            if(resp.estado == 1)
            {
                $('#id_aval').val(resp.registros.id_aval);
                verAval();
            }

        },
        function(resp){
            console.log('Problemas al traer ID AVAL contrato');            
        },'GET');
}


const listaEstadoCivil = (div,id) => {
    var datos_ec;
    $.get("src/js/aval/estado_civil.json", function (data, status) {
        if (status == 'success') {
            var html = '';
            data.forEach(e => {
                html+='<option value="'+e.id+'">'+e.text+'</option>'; 
            });
            $('#estado_civil_aval').html(html)
            if(id!=null)
            {
                $('#estado_civil_aval').val(id);
            }
        }
    });
}


const listaRegionTxt = (div,id,id_comuna) => {

    var datos = {};
    datos.estado = 1;
    var api = new Api('region','ver_registros');
    cargando(1);
    api.request(datos,
        function(resp){
            cargando(0);
            $('#'+div).html('<option value="0">Seleccione una Región</option>');

            if(resp.estado == 1)
            {
                for(var key in resp.registros)
                    $('#'+div).append('<option data-id_region="'+resp.registros[key].id+'" value="'+resp.registros[key].nombre+'">'+resp.registros[key].nombre+'</option>');

                if(id!='')
                {
                    $('#'+div).val(id);
                    var region_id = $('#'+div+' option:selected').data('id_region');
                    listaComunaRegionTxt('comuna_persona',id_comuna,region_id);
                }

            }else{
                $('#'+div).html('<option value="0">Sin Regiones</option>');
            }

        },
        function(resp){
            console.log('Error Lista de Regiones');            
        },'GET');

}

const listaRegionTxt3 = (div, id, id_comuna) => {    

    var datos = {};
    datos.estado = 1;
    var api = new Api('region', 'ver_registros');
    cargando(1);
    api.request(datos,
        function (resp) {
            cargando(0);
            $('#' + div).html('<option value="0">Seleccione una Región</option>');
            if (resp.estado == 1) {
                for (var key in resp.registros)
                    $('#' + div).append('<option data-id_region="' + resp.registros[key].id + '" value="' + resp.registros[key].nombre + '">' + resp.registros[key].nombre + '</option>');
                if (id != '') {
                    $('#' + div).val(id);
                    var region_id = $('#' + div + ' option:selected').data('id_region');
                    listaComunaRegionTxt('comuna_aval', id_comuna, region_id);
                }
            } else {
                $('#' + div).html('<option value="0">Sin Regiones</option>');
            }
        },
        function (resp) {
            console.log('Error Lista de Regiones');
        }, 'GET');

}

function listaComunaRegionTxt(div,id,id_region)
{
    var datos = {};

    datos.estado = 1;
    datos.id_region = id_region;
    var api = new Api('comuna','ver_comuna_region');
    cargando(1);
    api.request(datos,
        function(resp){
            cargando(0);
            $('#'+div).html('<option value="0">Seleccione una Comuna</option>');
            if(resp.estado == 1)
            {
                for(var key in resp.registros)
                    $('#'+div).append('<option data-id_comuna="'+resp.registros[key].id+'" value="'+resp.registros[key].nombre+'">'+resp.registros[key].nombre+'</option>');
                if(id!='')
                {
                    $('#'+div).val(id);
                }

            }else{
                $('#'+div).html('<option value="0">Sin Comunas</option>');
            }

        },
        function(resp){

        },'POST');

}



const verAval = () => {

    var id = $('#id_aval').val();
    var api = new Api('persona', 'ver_registro');
    var datos = {};
    datos.id = id;
    cargando(1);
    api.request(datos,
        function (resp) {
            cargando(0);
            if (resp.estado == 1) {
                $('#id_registro_aval').val(resp.registros.id);
                $('#rut_aval').val(resp.registros.rut);
                $('#nombre_aval').val(resp.registros.nombre);
                $('#apellido_paterno_aval').val(resp.registros.apellido_paterno);
                $('#apellido_materno_aval').val(resp.registros.apellido_materno);                
                $('#email_aval').val(resp.registros.email);
                $('#direccion_aval').val(resp.registros.direccion);
                $('#estado_civil_aval').val(resp.registros.estado_civil);                
                $('#celular_aval').val(resp.registros.celular);
                $('#profesion_aval').val(resp.registros.profesion);
                $('#nacionalidad_aval').val(resp.registros.nacionalidad);

                listaEstadoCivil('estado_civil_aval', resp.registros.estado_civil);
                listaRegionTxt3('region_aval', resp.registros.region, resp.registros.comuna);
                traerComunas();

                msg('AVAL', 'Se ha encontrado el registro, datos cargados.', 'success');
            } else {
                msg('AVAL', 'No existe aval asociado', 'error');
            }
        },
        function (resp) {
            console.log('Error ver Aval');
        },
        'GET'
    );
}

function traerComunasAval() {

    var region_id = $('#region_aval option:selected').data('id_region');
    listaComunaRegion('comuna_aval', 0, region_id);
}

const traerComunas = () => {

    var region_id = $('#region_mod option:selected').data('id_region');
    listaComunaRegion('comuna_mod', 0, region_id);
}


const listaComunaRegion = (div,id,id_region) => {

    var api = new Api('comuna','ver_comuna_region');
    var datos = {};
    datos.estado = 1;
    datos.id_region = id_region;

    cargando(1);
    api.request(datos,
        function(resp){
            cargando(0);
            $('#'+div).html('<option value="0">Seleccione una Comuna</option>');
            if(resp.estado == 1)
            {
                for(var key in resp.registros)
                    $('#'+div).append('<option data-id_comuna="'+resp.registros[key].id+'" value="'+resp.registros[key].nombre+'">'+resp.registros[key].nombre+'</option>');

                if(id!='')
                {
                    $('#'+div).val(id);
                }

            }else{
                $('#'+div).html('<option value="0">Sin Comunas</option>');
            }
        },
        function(resp){
            console.log('Error Lista Comuna Región');
        },'POST');
}



const actualizarAval = ()=>{

    var id_contrato = $('#id_contrato').val();    
    var nombre = $('#nombre_aval').val();
    var apellido_paterno = $('#apellido_paterno_aval').val();
    var apellido_materno = $('#apellido_materno_aval').val();
    var rut = $('#rut_aval').val();
    var email = $('#email_aval').val();
    var celular = $('#celular_aval').val();
    var edificio = $('#id_edificio').val();
    var nacionalidad = $('#nacionalidad_aval').val();
    var estado_civil = $('#estado_civil_aval').val();
    var direccion = $('#direccion_aval').val();
    var region = $('#region_aval').val();
    var comuna = $('#comuna_aval').val();
    var profesion = $('#profesion_aval').val();    
    var id_aval = $('#id_aval').val();
    
    if (email == '') {
        $('#email_aval').select().focus();
        msg("Requiere", "Debe Ingresar el email del aval.", 'warning');
        return false;
    }
    else if (validarEmail(email)) {
        msg('Requiere', 'Debe ingresar Correo valido', 'error');
        $('#email_aval').select().focus();
        return false;
    }

    if (celular == '') {
        $('#celular_aval').select().focus();
        msg("Requiere", "Debe Ingresar el número de celular del aval.", 'warning');
        return false;
    }
   
    if (estado_civil == '') {
        $('#estado_civil_aval').select().focus();
        msg("Requiere", "Debe Ingresar el estado civil del aval.", 'warning');
        return false;
    }
    if (profesion == '') {
        $('#profesion_aval').select().focus();
        msg("Requiere", "Debe Ingresar la profesión del aval.", 'warning');
        return false;
    }
    if (region == 0) {
        $('#region_aval').select().focus();
        msg("Requiere", "Debe Ingresar la región del aval.", 'warning');
        return false;
    }

    if (comuna == 0) {
        $('#comuna_aval').select().focus();
        msg("Requiere", "Debe Ingresar la comuna del aval.", 'warning');
        return false;
    }

   

    var api = new Api('persona', 'modificar');
    var datos = {};

    datos.id = id_aval;
    datos.nombre = nombre;
    datos.rut = rut;
    datos.apellido_paterno = apellido_paterno;
    datos.apellido_materno = apellido_materno;
    datos.id_tipo_usuario = 2;
    datos.email = email;
    datos.celular = celular;
    datos.id_edificio = edificio;
    datos.nacionalidad = nacionalidad;
    datos.estado_civil = estado_civil;
    datos.direccion = direccion;
    datos.region = region;
    datos.comuna = comuna;
    datos.profesion = profesion;


    cargando(1);
    api.request(datos,
        function (resp) {
            cargando(0);
            if (resp.estado == 1) {
                $('#agregarDatosAval').modal('hide');
                msg('AVAL', 'Se ha modificado su aval.', 'success');
            } else {
                cargando(0);
                msg('AVAL', 'No se pudo modificar aval.', 'error');
            }
        },
        function (resp) {
            console.log('problema al actualizar el aval');
        },
        'POST'
    );

}


