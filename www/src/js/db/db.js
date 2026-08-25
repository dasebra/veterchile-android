//Objeto de Base de Datos
var webdb = {};

function crearDB(){

	webdb.db = null;

	/**
	 * [open - Crea la base de datos]
	 * @param  {[object]} options [Objeto con parametros de la base de datos]
	 */
	webdb.open = function(options) {
		if (typeof openDatabase == "undefined") return;

		// Opciones por defecto
	   	var options = options || {};
		options.name = options.name || 'database';
		options.mb = options.mb || 5;
		options.description = options.description || 'no description';
		options.version = options.version || '1.0';

		// Definimos el tamaño en MB
	   	var dbSize = options.mb * 1024 * 1024;


		// Cargamos la base de datos
	   	webdb.db = openDatabase(options.name, options.version, options.description, dbSize);
	}

	/**
	 * [executeSql - Ejecuta consultas a la WEB SQL]
	 * @param  {[string]} 	sql       [Sentencia SQL]
	 * @param  {[array]} 	data      [Arreglo con parametros a utilizar en la sentencia SQL]
	 * @param  {[function]} onSuccess [Funcion Callback de Success]
	 * @param  {[function]} onError   [Funcion Callback de Error]
	 */
	webdb.executeSql = function(sql, data, onSuccess, onError){
		if (!webdb.db) return;
		webdb.db.transaction(function(tx){tx.executeSql(sql, data,onSuccess,onError);});
	}

	//Parametros de la base de datos
	var opt = {
		name: "db",
		mb: 5,
		description: "Base de datos",
		version: "1.0"
	};

	//Crea la base de datos
    webdb.open(opt);
    
	crearTablas();
	
	setTimeout(function(){
		if (typeof checkSesionUsuario2 === 'function') {
			checkSesionUsuario2();
		}
	},250);

}

//Event Listener que avisa cuando el movil esta listo para poder ejecutar las transacciones de la DB
document.addEventListener("deviceready", crearDB, false);

/**
 * [crearTablas - Crea la tabla de usuarios en la web db]
 */
function crearTablas()
{
	/* CREATE TABLE USUARIO */
	webdb.executeSql(`CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY AUTOINCREMENT, id_usuario INTEGER,id_persona INTEGER,id_tipo_usuario INTEGER,nombre TEXT,apellido TEXT, rut INTEGER, email TEXT, avatar TEXT, estado INTEGER)`, [],
		function(tx, r){
			console.log('Tabla Usuario Creada');	
			//alert('Tabla Usuario Creada');		
		},
		function(tx, e){
			console.log("Error al crear la tabla Usuario: "+e.message);
			//alert("Error al crear la tabla Usuario: "+e.message);		
		}
	);
}

/**
 * [query - Funcion que ejecuta consultas al objeto webdb]
 * @param  {[type]} sql   [Sentencia SQL a ejecutar, SELECT, INSERT, UPDATE, etc]
 * @param  {[type]} data  [Parametros a pasar para la consulta enviadas en un arreglo]
 * @param  {[type]} ok    [Funcion Callback Success]
 * @param  {[type]} error [Funcion Callback Error]
 */
function query(sql,data,ok,error)
{
	webdb.executeSql(sql,data,ok,error);
}

