
const listaDeptoPersona = (div,id,id_persona) => {

    var datos = {};
    datos.estado_contrato = 2;    
    datos.id_edificio = $('#id_edificio').val();
    datos.id_persona= id_persona;

    var api = new Api("producto", "ver_registros_persona");
    cargando(1);
    api.request(
        datos,
        function (resp) {
            console.log(resp);
            
            $('#' + div).html('<option value="0">Seleccione Departamento</option>');

            if(resp.estado == 1)
            {
                for(var key in resp.registros)
                    $('#' + div).append('<option value="' + resp.registros[key].id_producto + '">Departamento N° '+numerDepato(resp.registros[key].numero,resp.registros[key].piso)+'</option>');

                if(id>0)
                {
                    $('#'+div).val(id);
                }
            }
            cargando(0);
        },
        function (resp) { 
            console.log(resp); 
        },
        "GET");
}

const listaEspacioComun = (div, id) => {

    var datos = {};
    // datos.estado = 1;
    datos.id_edificio = $('#id_edificio').val();
    datos.estado = 1;
    // datos.estado = 1;

    var api = new Api("espacio_comun", "ver_registros");
    cargando(1);
    api.request(
        datos,
        function (resp) {        
            $('#' + div).html('<option value="0">Seleccione Espacio Común</option>');

            if (resp.estado == 1) {
                for (var key in resp.registros)
                    $('#' + div).append('<option value="' + resp.registros[key].id + '">' + resp.registros[key].nombre + '</option>');

                if (id > 0) {
                    $('#' + div).val(id);
                }
            }
        
            cargando(0);
        },
        function (resp) { console.log(resp); },
        "GET");
}


const listaBloqueHoras = (div, id) => {

    var datos = {};
    // datos.estado = 1;
    datos.id_edificio = $('#id_edificio').val();
    datos.estado = 1;
    // datos.estado = 1;

    var api = new Api("bloque_horas", "ver_registros");
    cargando(1);
    api.request(
        datos,
        function (resp) {                    
            $('#' + div).html('<option value="0">Seleccione Bloque de horas</option>');

            if (resp.estado == 1) {
                for (var key in resp.registros)
                    $('#' + div).append('<option value="' + resp.registros[key].id + '">Bloque N° ' + resp.registros[key].id + ' - '+resp.registros[key].hora_inicio +' / '+ resp.registros[key].hora_fin+'</option>');

                if (id > 0) {
                    $('#' + div).val(id);
                }
            }
            cargando(0);
        },
        function (resp) { console.log(resp); },
        "GET");
}
