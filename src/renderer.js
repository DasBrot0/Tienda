const { ipcRenderer } = require('electron');

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Script cargado correctamente");
    
    // Asignar eventos a los elementos de la interfaz
    const tipoPersonaSelect = document.getElementById('tipoPersona');
    const registrarButton = document.getElementById('registrarButton');

    // Obtener las sedes desde el proceso principal
    const response = await ipcRenderer.invoke('obtener-sedes');
    let sedes = [];
    if (response.success) {
        sedes = response.data; // Asigna las sedes obtenidas
    } else {
        console.error('Error al obtener sedes:', response.error);
        // Maneja el error, por ejemplo, mostrando un mensaje al usuario
    }

    // Ocultar el botón de registrar por defecto al cargar la página
    registrarButton.style.display = 'none';

    // Función para llenar el select de sedes
    function llenarSedeSelect(selectId, sedes) {
        const sedeSelect = document.getElementById(selectId);
        sedeSelect.innerHTML = ''; // Limpiar opciones anteriores
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione una sede';
        sedeSelect.appendChild(defaultOption);
    
        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede[0]; // id_sede
            option.textContent = sede[1]; // nombre
            sedeSelect.appendChild(option);
        });
    }

    tipoPersonaSelect.addEventListener('change', () => {
        const tipoPersona = tipoPersonaSelect.value;

        // Ocultar todos los campos
        document.getElementById('clienteCampos').classList.add('hidden');
        document.getElementById('empleadoSupervisorCampos').classList.add('hidden');
        document.getElementById('empleadoVendedorCampos').classList.add('hidden');

        // Ocultar el botón de registrar por defecto
        registrarButton.style.display = 'none';

        // Mostrar los campos correspondientes y el botón si se selecciona un tipo válido
        if (tipoPersona === 'cliente') {
            document.getElementById('clienteCampos').classList.remove('hidden');
            registrarButton.style.display = 'block'; // Mostrar el botón
            llenarSedeSelect('sedeSelectCliente', sedes);
        } else if (tipoPersona === 'empleado_supervisor') {
            document.getElementById('empleadoSupervisorCampos').classList.remove('hidden');
            registrarButton.style.display = 'block'; // Mostrar el botón
            llenarSedeSelect('sedeSelectSupervisor', sedes);
        } else if (tipoPersona === 'empleado_vendedor') {
            document.getElementById('empleadoVendedorCampos').classList.remove('hidden');
            registrarButton.style.display = 'block'; // Mostrar el botón
            llenarSedeSelect('sedeSelectVendedor', sedes);
        }
    });
});

// Evento para el botón de registrar
document.getElementById('registrarButton').addEventListener('click', async function() {
    console.log('Botón Registrar clickeado');
    let personData = {};
    const tipoPersona = document.getElementById('tipoPersona').value;
    const errorElement = document.getElementById('error');
    errorElement.innerText = ''; // Limpiar mensajes de error previos

    // Validaciones
    let valid = true;
    let messages = []; // Array para acumular mensajes de error

    if (tipoPersona === 'cliente') {
        const dni = document.getElementById('dniCliente').value;
        if (!/^\d{8}$/.test(dni)) {
            messages.push('EL DNI DEBE SER EXACTAMENTE 8 DÍGITOS Y UN NÚMERO');
            valid = false;
        }

        const nombres = document.getElementById('nombresCliente').value;
        if (nombres.length === 0 || nombres.length > 50 || /[^a-zA-Z\s]/.test(nombres)) {
            messages.push('LOS NOMBRES NO PUEDEN SER NULOS Y NO PUEDEN SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoPaterno = document.getElementById('apellidoPaternoCliente').value;
        if (apellidoPaterno.length === 0 || apellidoPaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoPaterno)) {
            messages.push('EL APELLIDO PATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoMaterno = document.getElementById('apellidoMaternoCliente').value;
        if (apellidoPaterno.length === 0 || apellidoMaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoMaterno)) {
            messages.push('EL APELLIDO MATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const correo = document.getElementById('correoElectronicoCliente').value;
        if (correo.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            messages.push('EL CORREO NO PUEDE SUPERAR 60 CARACTERES Y DEBE TENER FORMATO DE CORREO');
            valid = false;
        }

        // Validación de teléfonos
        const telefonosDiv = document.getElementById('telefonosCliente');
        const telefonoInputs = telefonosDiv.querySelectorAll('.telefono');
        telefonoInputs.forEach((input, index) => {
            const telefono = input.value;
            if (!telefono) {
                messages.push(`EL TELÉFONO ${index + 1} ES OBLIGATORIO`);
                valid = false;
            } else if (telefono && (!/^\d+$/.test(telefono) || telefono.length < 6 || telefono.length > 9)) {
                messages.push(`EL TELÉFONO ${index + 1} DEBE SER UN NÚMERO Y TENER ENTRE 6 Y 9 DÍGITOS INCLUSIVE`);
                valid = false;
            }
        });

        // Validación de direcciones
        const direccionesDiv = document.getElementById('direccionesCliente');
        const direccionInputs = direccionesDiv.querySelectorAll('.direccion');
        direccionInputs.forEach((input, index) => {
            const direccion = input.value;
            if (!direccion){
                messages.push(`LA DIRECCIÓN ${index + 1} ES OBLIGATORIA`);
                valid = false;
            } else if (direccion && direccion.length > 60) {
                messages.push(`LA DIRECCIÓN ${index + 1} NO PUEDE SUPERAR 60 CARACTERES`);
                valid = false;
            }
        });
    } else if (tipoPersona === 'empleado_supervisor') {
        const dni = document.getElementById('dniSupervisor').value;
        if (!/^\d{8}$/.test(dni)) {
            messages.push('EL DNI DEBE SER EXACTAMENTE 8 DÍGITOS Y UN NÚMERO');
            valid = false;
        }

        const nombres = document.getElementById('nombresSupervisor').value;
        if (nombres.length === 0 || nombres.length > 50 || /[^a-zA-Z\s]/.test(nombres)) {
            messages.push('LOS NOMBRES NO PUEDEN SER NULOS Y NO PUEDEN SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoPaterno = document.getElementById('apellidoPaternoSupervisor').value;
        if (apellidoPaterno.length === 0 || apellidoPaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoPaterno)) {
            messages.push('EL APELLIDO PATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoMaterno = document.getElementById('apellidoMaternoSupervisor').value;
        if (apellidoMaterno.length === 0 || apellidoMaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoMaterno)) {
            messages.push('EL APELLIDO MATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const correo = document.getElementById('correoElectronicoSupervisor').value;
        if (correo.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            messages.push('EL CORREO NO PUEDE SUPERAR 60 CARACTERES Y DEBE TENER FORMATO DE CORREO');
            valid = false;
        }

        const fechaContratacion = document.getElementById('fechaContratacionSupervisor').value;
        const hoy = new Date();
        if (new Date(fechaContratacion) > hoy) {
            messages.push('LA FECHA DE CONTRATACIÓN NO PUEDE SER POSTERIOR A LA FECHA DEL DÍA DE HOY');
            valid = false;
        }

        const salario = document.getElementById('salarioSupervisor').value;
        if (salario.length === 0 || !/^\d+(\.\d+)?$/.test(salario)) {
            messages.push('EL SALARIO NO PUEDE SER NULO Y DEBE ESTAR COMPUESTO SOLAMENTE POR NÚMEROS DE TIPO FLOTANTE O ENTEROS');
            valid = false;
        }

        const areaDeSupervision = document.getElementById('areaDeSupervision').value;
        if (areaDeSupervision.length === 0 || areaDeSupervision.length > 60 || /[^a-zA-Z\s]/.test(areaDeSupervision)) {
            messages.push('EL ÁREA DE SUPERVISIÓN NO PUEDE SER NULA, NO PUEDE SUPERAR 60 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        // Validación de teléfonos
        const telefonosDiv = document.getElementById('telefonosSupervisor');
        const telefonoInputs = telefonosDiv.querySelectorAll('.telefono');
        telefonoInputs.forEach((input, index) => {
            const telefono = input.value;
            if (!telefono) {
                messages.push(`EL TELÉFONO ${index + 1} ES OBLIGATORIO`);
                valid = false;
            } else if (telefono && (!/^\d+$/.test(telefono) || telefono.length < 6 || telefono.length > 9)) {
                messages.push(`EL TELÉFONO ${index + 1} DEBE SER UN NÚMERO Y TENER ENTRE 6 Y 9 DÍGITOS INCLUSIVE`);
                valid = false;
            }
        });

        // Validación de direcciones
        const direccionesDiv = document.getElementById('direccionesSupervisor');
        const direccionInputs = direccionesDiv.querySelectorAll('.direccion');
        direccionInputs.forEach((input, index) => {
            const direccion = input.value;
            if (!direccion){
                messages.push(`LA DIRECCIÓN ${index + 1} ES OBLIGATORIA`);
                valid = false;
            } else if (direccion && direccion.length > 60) {
                messages.push(`LA DIRECCIÓN ${index + 1} NO PUEDE SUPERAR 60 CARACTERES`);
                valid = false;
            }
        });
    } else if (tipoPersona === 'empleado_vendedor') {
        const dni = document.getElementById('dniVendedor').value;
        if (!/^\d{8}$/.test(dni)) {
            messages.push('EL DNI DEBE SER EXACTAMENTE 8 DÍGITOS Y UN NÚMERO');
            valid = false;
        }

        const nombres = document.getElementById('nombresVendedor').value;
        if (nombres.length === 0 || nombres.length > 50 || /[^a-zA-Z\s]/.test(nombres)) {
            messages.push('LOS NOMBRES NO PUEDEN SER NULOS Y NO PUEDEN SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoPaterno = document.getElementById('apellidoPaternoVendedor').value;
        if (apellidoPaterno.length === 0 || apellidoPaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoPaterno)) {
            messages.push('EL APELLIDO PATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const apellidoMaterno = document.getElementById('apellidoMaternoVendedor').value;
        if (apellidoPaterno.length === 0 || apellidoMaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoMaterno)) {
            messages.push('EL APELLIDO MATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }

        const correo = document.getElementById('correoElectronicoVendedor').value;
        if (correo.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            messages.push('EL CORREO NO PUEDE SUPERAR 60 CARACTERES Y DEBE TENER FORMATO DE CORREO');
            valid = false;
        }

        const fechaContratacion = document.getElementById('fechaContratacionVendedor').value;
        const hoy = new Date();
        if (new Date(fechaContratacion) > hoy) {
            messages.push('LA FECHA DE CONTRATACIÓN NO PUEDE SER POSTERIOR A LA FECHA DEL DÍA DE HOY');
            valid = false;
        }

        const salario = document.getElementById('salarioVendedor').value;
        if (salario.length === 0 || !/^\d+(\.\d+)?$/.test(salario)) {
            messages.push('EL SALARIO NO PUEDE SER NULO Y DEBE ESTAR COMPUESTO SOLAMENTE POR NÚMEROS DE TIPO FLOTANTE O ENTEROS');
            valid = false;
        }

        const comision = document.getElementById('comisionVendedor').value;
        if (comision.length === 0 || !/^\d+(\.\d+)?$/.test(comision)) {
            messages.push('LA COMISIÓN NO PUEDE SER NULA Y DEBE ESTAR COMPUESTA SOLAMENTE POR NÚMEROS DE TIPO FLOTANTE O ENTEROS');
            valid = false;
        }

        // Validación de teléfonos
        const telefonosDiv = document.getElementById('telefonosVendedor');
        const telefonoInputs = telefonosDiv.querySelectorAll('.telefono');
        telefonoInputs.forEach((input, index) => {
            const telefono = input.value;
            if (!telefono) {
                messages.push(`EL TELÉFONO ${index + 1} ES OBLIGATORIO`);
                valid = false;
            } else if (telefono && (!/^\d+$/.test(telefono) || telefono.length < 6 || telefono.length > 9)) {
                messages.push(`EL TELÉFONO ${index + 1} DEBE SER UN NÚMERO Y TENER ENTRE 6 Y 9 DÍGITOS INCLUSIVE`);
                valid = false;
            }
        });

        // Validación de direcciones
        const direccionesDiv = document.getElementById('direccionesVendedor');
        const direccionInputs = direccionesDiv.querySelectorAll('.direccion');
        direccionInputs.forEach((input, index) => {
            const direccion = input.value;
            if (!direccion){
                messages.push(`LA DIRECCIÓN ${index + 1} ES OBLIGATORIA`);
                valid = false;
            } else if (direccion && direccion.length > 60) {
                messages.push(`LA DIRECCIÓN ${index + 1} NO PUEDE SUPERAR 60 CARACTERES`);
                valid = false;
            }
        });
    }

    if (!valid) {
        // Unir mensajes con saltos de línea
        if (messages.length > 1) {
            const lastMessage = messages.pop(); // Extraer el último mensaje
            errorElement.innerHTML = messages.map(msg => msg.toUpperCase()).join('<br>') + '<br><span style="color: red;">Y</span> ' + lastMessage.toUpperCase();
        } else {
            errorElement.innerHTML = messages[0].toUpperCase(); // Solo un mensaje
        }
        return; // Si hay errores, no continuar con el registro
    }

    if (tipoPersona === 'cliente') {
        personData = {
            dni: document.getElementById('dniCliente').value,
            nombres: document.getElementById('nombresCliente').value,
            apellidoPaterno: document.getElementById('apellidoPaternoCliente').value,
            apellidoMaterno: document.getElementById('apellidoMaternoCliente').value,
            correoElectronico: document.getElementById('correoElectronicoCliente').value,
            idSede: document.getElementById('sedeSelectCliente').value,
            telefonos: obtenerTelefonos(tipoPersona),
            direcciones: obtenerDirecciones(tipoPersona),
            tipoPersona: tipoPersona
        };
    } else if (tipoPersona === 'empleado_supervisor') {
        personData = {
            dni: document.getElementById('dniSupervisor').value,
            nombres: document.getElementById('nombresSupervisor').value,
            apellidoPaterno: document.getElementById('apellidoPaternoSupervisor').value,
            apellidoMaterno: document.getElementById('apellidoMaternoSupervisor').value,
            correoElectronico: document.getElementById('correoElectronicoSupervisor').value,
            idSede: document.getElementById('sedeSelectSupervisor').value,
            fechaContratacion: document.getElementById('fechaContratacionSupervisor').value,
            salario: document.getElementById('salarioSupervisor').value,
            areaDeSupervision: document.getElementById('areaDeSupervision').value,
            telefonos: obtenerTelefonos(tipoPersona),
            direcciones: obtenerDirecciones(tipoPersona),
            tipoPersona: tipoPersona
        };
    } else if (tipoPersona === 'empleado_vendedor') {
        personData = {
            dni: document.getElementById('dniVendedor').value,
            nombres: document.getElementById('nombresVendedor').value,
            apellidoPaterno: document.getElementById('apellidoPaternoVendedor').value,
            apellidoMaterno: document.getElementById('apellidoMaternoVendedor').value,
            correoElectronico: document.getElementById('correoElectronicoVendedor').value,
            idSede: document.getElementById('sedeSelectVendedor').value,
            fechaContratacion: document.getElementById('fechaContratacionVendedor').value,
            salario: document.getElementById('salarioVendedor').value,
            comision: document.getElementById('comisionVendedor').value,
            dniSupervisor: document.getElementById('dniSupervisorVendedor').value,
            telefonos: obtenerTelefonos(tipoPersona),
            direcciones: obtenerDirecciones(tipoPersona),
            tipoPersona: tipoPersona
        };
    }
    
    function obtenerTelefonos(tipoPersona) {
        const telefonos = [];
        const telefonosDiv = tipoPersona === 'cliente' ? document.getElementById('telefonosCliente') :
                            tipoPersona === 'empleado_supervisor' ? document.getElementById('telefonosSupervisor') :
                            document.getElementById('telefonosVendedor');
        const telefonoInputs = telefonosDiv.querySelectorAll('.telefono');
        telefonoInputs.forEach(input => {
            if (input.value) {
                telefonos.push(input.value);
            }
        });
        return telefonos;
    }

    function obtenerDirecciones(tipoPersona) {
        const direcciones = [];
        const direccionesDiv = tipoPersona === 'cliente' ? document.getElementById('direccionesCliente') :
                            tipoPersona === 'empleado_supervisor' ? document.getElementById('direccionesSupervisor') :
                            document.getElementById('direccionesVendedor');
        const direccionInputs = direccionesDiv.querySelectorAll('.direccion');
        direccionInputs.forEach(input => {
            if (input.value) {
                direcciones.push(input.value);
            }
        });
        return direcciones;
    }

    const response = await ipcRenderer.invoke('register-person', personData);
    if (response.success) {
        errorElement.innerText = 'Registro exitoso'; // Mostrar mensaje de éxito
        errorElement.style.color = 'green'; // Cambiar color a verde para éxito
    } else {
        errorElement.innerText = 'Error al registrar: ' + response.error; // Mostrar error
    }
    
    // Borrar el mensaje después de 3 segundos
    setTimeout(() => {
        errorElement.innerText = ''; // Limpiar el mensaje
    }, 5000);
});