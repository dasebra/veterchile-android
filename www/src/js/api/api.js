"use strict";

// Cordova Browser se usa para desarrollo contra Laragon. Las compilaciones
// Android/iOS continúan consumiendo producción.
var MEDSDI_API_URL = (
    window.location.protocol === 'http:' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) ? 'http://medsdi.test/api' : 'https://med-sdi.cl/api';

/**
 * Created by Paul on 24/09/2018.
 */
var datosRequest = /** @class */ (function () {
    function datosRequest(modulo_, metodo_, data_, debug_) {
        if (debug_ === void 0) { debug_ = false; }
        this.modulo = modulo_;
        this.metodo = metodo_;
        this.data = data_;
        this.debug = debug_;
    }
    return datosRequest;
}());
var Api = /** @class */ (function () {
    function Api(modulo, metodo) {
        this.url_ = MEDSDI_API_URL;
        this.type_ = "POST";
        this.modulo_ = modulo;
        this.metodo_ = metodo;
    }

    Api.prototype.request = function (data, callback, errorcallback, methodSend, debug, _timeout) {
        if(_timeout==undefined)
            _timeout = 10000;

        // Preparar headers básicos
        var headers = {
            'Accept': 'application/json'
        };

        // Verificar si necesita autenticación
        var needsAuth = this.needsAuth();
        var token = localStorage.getItem('authToken');

        console.log("🔍 Ruta:", this.modulo_ + '/' + this.metodo_);
        console.log("🔒 Necesita auth:", needsAuth);
        console.log("🎫 Token disponible:", token ? "Sí (" + token.substring(0, 20) + "...)" : "No");

        // Agregar token si existe para rutas protegidas
        if (token && needsAuth) {
            // *** CAMBIO IMPORTANTE: Usar X-Auth-Token en lugar de Authorization ***
            headers['X-Auth-Token'] = token;
            console.log("✅ Token agregado a headers como X-Auth-Token");
        } else if (needsAuth && !token) {
            console.log("❌ Ruta protegida pero no hay token");
            errorcallback({status: 401, responseText: "No token available"});
            return;
        }

        var requestData;
        var contentType = false;
        var processData = true;
        // Evita redirecciones de Apache: los navegadores bloquean una
        // redirecciÃ³n dentro de una peticiÃ³n CORS preflight.
        var url = (this.url_ + `/${this.modulo_}/${this.metodo_}`).replace(/\/+$/, '');

        if (methodSend === 'GET') {
            // Para GET: agregar parámetros a la URL
            if (data && Object.keys(data).length > 0) {
                var params = new URLSearchParams(data).toString();
                url += '?' + params;
            }
            requestData = undefined;
        } else {
            // Para POST/PUT: enviar como JSON
            headers['Content-Type'] = 'application/json';
            requestData = JSON.stringify(data);
            contentType = 'application/json';
            processData = false;
        }

        console.log("📤 URL final:", url);
        console.log("📋 Headers:", headers);

        $.ajax({
            type: methodSend,
            url: url,
            data: requestData,
            dataType: 'json',
            headers: headers,
            contentType: contentType,
            processData: processData,
            success: function(response) {
                console.log("✅ Respuesta exitosa:", response);
                callback(response);
            },
            error: function(xhr, status, error) {
                console.log("❌ Error en petición:");
                console.log("  Status:", xhr.status);
                console.log("  Response:", xhr.responseText);
                console.log("  Headers enviados:", headers);

                if (xhr.status === 401) {
                    console.log('🚫 Token expirado o inválido - limpiando');
                    localStorage.removeItem('authToken');
                    vista('login', 'fade');
                }

                errorcallback(xhr, status, error);
            },
            timeout: _timeout
        });
    };

    // *** CAMBIO IMPORTANTE: Agregar la nueva ruta a protectedRoutes ***
    Api.prototype.needsAuth = function() {
        var protectedRoutes = [
            'paciente/mi_ficha_medica',
            'paciente/mis_profesionales',
            'paciente/mis_horas_medicas',
            'paciente/agenda',
            'profesional/agenda',
            'profesional/mis_pacientes',
            'perfil/datos',
            'perfil/foto',
            'perfil/clave-dispositivo',
            'paciente/mis_examenes',
            'paciente/mis_recetas',
            'paciente/mis_consentimientos',
            'paciente/ficha_atencion_app',           // *** NUEVA RUTA ***
            'paciente/ficha-atencion-app',           // *** POR SI ACASO ***
            'profesionales/buscar_profesionales',
            'paciente/agendar_hora_medica',
            'paciente/confirmar_hora_medica'
            ,'mensajes/'
            ,'mensajes'
            ,'mensajes/leer'
            // Agregar aquí cualquier otra ruta que requiera autenticación
        ];

        var currentRoute = this.modulo_ + '/' + this.metodo_;
        return protectedRoutes.includes(currentRoute)
            || currentRoute.indexOf('mensajes') === 0
            || currentRoute.indexOf('mobile-authorization/') === 0
            || currentRoute.indexOf('rest-controls') === 0;
    };

    // Resto del código igual...
    Api.prototype.help = function () {
        console.log("\n        -- Inicializar Datos --\n        Ej: var datos = {nombre:'prueba'};\n        -- Incializamos la Api -- Paramentros(modulo:string,metodo:string)\n        Ej: var api = new Api(\"adicionales\",\"obtenerCoberturas\");\n        -- Ejecutamos un REQUEST -- Parametros(datos:Object,funcion callback,metodo de envio \"GET\" o \"POST\")\n        Ej: api.request(datos,function(resp:any){console.log(resp)},\"GET\")\n      ");
    };

    Object.defineProperty(Api.prototype, "url", {
        get: function () { return this.url_; },
        set: function (url__) { this.url_ = url__; },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Api.prototype, "type", {
        get: function () { return this.type_; },
        set: function (type__) { this.type_ = type__; },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Api.prototype, "modulo", {
        get: function () { return this.modulo_; },
        set: function (modulo__) { this.modulo_ = modulo__; },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Api.prototype, "metodo", {
        get: function () { return this.metodo_; },
        set: function (metodo__) { this.metodo_ = metodo__; },
        enumerable: true,
        configurable: true
    });

    return Api;
}());

function testAPI() {
    var datos = { nombre: 'prueba' };
    var api = new Api("adicionales", "obtenerCoberturas");
    api.request(datos, function (resp) { console.log(resp); }, function (resp) { console.log(resp); },"GET");
}

function testSimple() {
    $.ajax({
        type: 'GET',
        url: 'https://med-sdi.cl/api/test-simple',
        headers: {
            'Accept': 'application/json'
        },
        success: function(resp) {
            console.log("✅ Ruta simple funciona:", resp);
        },
        error: function(xhr) {
            console.log("❌ Ruta simple falla:", xhr.status, xhr.responseText);
        }
    });
}

async function testAuthWithLocalToken() {
    // Usar 'authToken' en lugar de 'token'
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.log('❌ No se encontró authToken en localStorage');
        return;
    }

    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    console.log('👤 Usuario:', localStorage.getItem('nombre'));

    try {
        const response = await fetch('https://med-sdi.cl/api/test-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status de respuesta:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Ruta autenticada funciona correctamente:', result);
        } else {
            const errorText = await response.text();
            console.log('❌ Error en ruta autenticada:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

async function testPacienteRoutes() {
    const token = localStorage.getItem('token'); // Ajusta el nombre si es diferente

    if (!token) {
        console.log('❌ No se encontró token en localStorage');
        return;
    }

    const routes = [
        'https://med-sdi.cl/api/mi_ficha_medica',
        'https://med-sdi.cl/api/mis_profesionales',
        'https://med-sdi.cl/api/mis_horas_medicas'
    ];

    for (const route of routes) {
        try {
            console.log(`🔄 Probando: ${route}`);

            const response = await fetch(route, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${route}: OK`, result);
            } else {
                const errorText = await response.text();
                console.log(`❌ ${route}: Error ${response.status}`, errorText);
            }
        } catch (error) {
            console.log(`❌ ${route}: Error de conexión`, error);
        }

        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

function verLocalStorage() {
    console.log('📦 Contenido del localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`   ${key}:`, value);
    }
}

async function testSanctumOnly() {
    const token = localStorage.getItem('authToken');

    console.log('🧪 Probando autenticación estándar de Sanctum...');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    try {
        // Probar la ruta estándar /api/user que viene con Sanctum
        const response = await fetch('https://med-sdi.cl/api/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status:', response.status);

        if (response.ok) {
            const user = await response.json();
            console.log('✅ Sanctum funciona correctamente:', user);
            console.log('👤 Usuario autenticado:', user.name || user.email);

            // Si Sanctum funciona, el problema es nuestro middleware personalizado
            console.log('💡 El problema está en el middleware personalizado que no está en producción');
            return true;
        } else {
            const error = await response.text();
            console.log('❌ Error en Sanctum:', response.status, error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return false;
    }
}

async function testPureApiUser() {
    const token = localStorage.getItem('authToken');

    console.log('🧪 Probando /api/user (solo Sanctum, sin middleware personalizado)');

    try {
        const response = await fetch('https://med-sdi.cl/api/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status /api/user:', response.status);

        if (response.ok) {
            const user = await response.json();
            console.log('✅ /api/user funciona:', user);
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ /api/user falla:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

async function debugTokenIssue() {
    const token = localStorage.getItem('authToken');

    console.log('🔍 Debug completo del token:');
    console.log('Token completo:', token);
    console.log('Usuario ID:', localStorage.getItem('id_usuario'));
    console.log('Email:', localStorage.getItem('email'));

    // Probar con diferentes formatos de Authorization header
    const tests = [
        { name: 'Bearer token', header: `Bearer ${token}` },
        { name: 'Solo token', header: token },
    ];

    for (const test of tests) {
        try {
            console.log(`\n🧪 Probando ${test.name}:`);

            const response = await fetch('https://med-sdi.cl/api/user', {
                method: 'GET',
                headers: {
                    'Authorization': test.header,
                    'Accept': 'application/json'
                }
            });

            console.log(`Status: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Funciona:', result);
                break;
            } else {
                const errorText = await response.text();
                console.log('❌ Error:', errorText.substring(0, 100));
            }
        } catch (error) {
            console.log('❌ Error de conexión:', error);
        }
    }
}
