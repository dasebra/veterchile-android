$(document).on( "pageshow","#notificaciones",function( event ) {

    verNotificaciones('contenedor_not');
});



const cantidadNotificaciones = () => {
        
      var datos = {};
            
      datos.id_persona = _SESSION('id_persona');
      datos.estado = 1;
   
      var api = new Api("notificacion", "ver_registros");
      api.request(
          datos,
          function (resp) {
              //console.log(resp);
  
              if (resp.estado == 1) {                  
                $('#cant_notificaciones').html(resp.cantidad_registros);                
              }else{
                $('#cant_notificaciones').html(0);                
              } 
  
          },
          function (resp) {               
              console.log(resp); 
          },
          "GET");

}

const verNotificaciones = (divid) => {
        
    var datos = {};
          
    datos.id_persona = _SESSION('id_persona');
    datos.estado = 1;


    $('#'+divid).html(load_animate);
 
    var api = new Api("notificacion", "ver_registros");
    api.request(
        datos,
        function (resp) {
            //console.log(resp);

            if (resp.estado == 1) {      
              var html = '';
              
              resp.registros.forEach(function(item,index){
                html+=`
                <div id="not_${item.id}">
                <div class="row">
                    <div class="col-xs-8 col-xs-offset-1">${item.msg} - ${item.fecha_ingreso} </div> 
                    <div class="col-xs-2 bg-rojo color-blanco text-center pt5 pb5" onclick="estadoNotificacion(${item.id},2)" >X</div>                    
                </div>
                <hr>
                </div>
              `;
              });

            
                
              $('#'+divid).html(html);                
            }else{
              $('#'+divid).html(`
              <div>
                <div class="row">
                    <div class="col-xs-8 col-xs-offset-1"><h4>Sin Registros</h4></div>                     
                </div>
                <hr>
                </div>
              `);                
            } 

        },
        function (resp) {               
            console.log(resp); 
        },
        "GET");

}

const registrarNotificacion = (msg) => {
        
    var datos = {};
          
    datos.id_persona = _SESSION('id_persona');
    datos.msg = msg;
    datos.estado = 1;
 
    var api = new Api("notificacion", "registrar");
    api.request(
        datos,
        function (resp) {
            //console.log(resp);

            if (resp.estado == 1) {                  
                console.log('Notificacion registrada: '+msg);
            }else{
                console.log('Problema - registrar notificacion: '+msg);
            } 

        },
        function (resp) {               
            console.log(resp); 
        },
        "POST");

}

const estadoNotificacion = (id,estado) => {
        
    var datos = {};
          
    datos.id = id;
    datos.estado = estado;
    
    var api = new Api("notificacion", "estado");
    api.request(
        datos,
        function (resp) {
            //console.log(resp);

            if (resp.estado == 1) {                  
                console.log('Notificacion quemada: '+id);
                if(estado==2)
                {
                    $('#not_'+id).remove();
                }
            }else{
                console.log('Problema - al quemar la notificacion: '+msg);
            } 

        },
        function (resp) {               
            console.log(resp); 
        },
        "POST");
}