const { ipcRenderer } = require('electron');

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Script cargado correctamente");

    // Evento para el botón de buscar
    document.getElementById('buscarButton').addEventListener('click', async function() {
        const dniBuscar = document.getElementById('dniBuscar').value;
        const errorElement = document.getElementById('error');
        errorElement.innerText = ''; // Limpiar mensajes de error previos

        if (!/^\d{8}$/.test(dniBuscar)) {
            errorElement.innerText = 'EL DNI DEBE SER EXACTAMENTE 8 DÍGITOS Y UN NÚMERO';
            return;
        }

        // Llamar a la función para buscar la persona por DNI
        const response = await ipcRenderer.invoke('buscar-persona', dniBuscar);
        if (response.success) {
            // Mostrar los datos de la persona
            const persona = response.data;
            document.getElementById('datosPersona').innerHTML = `
                <label for="nombres">Nombres:</label>
                <input type="text" id="nombres" value="${persona.nombres}" required>
                <label for="apellidoPaterno">Apellido Paterno:</label>
                <input type="text" id="apellidoPaterno" value="${persona.apellidoPaterno}" required>
                <label for="apellidoMaterno">Apellido Materno:</label>
                <input type="text" id="apellidoMaterno" value="${persona.apellidoMaterno}" required>
                <label for="correoElectronico">Correo Electrónico:</label>
                <input type="text" id="correoElectronico" value="${persona.correoElectronico}" required>
                <label for="sedeSelect">Seleccionar Sede:</label>
                <select id="sedeSelect" required>
                    <option value="">Seleccione una sede</option>
                    <!-- Las opciones se llenarán dinámicamente aquí -->
                </select>
            `;
            document.getElementById('resultadoBusqueda').classList.remove('hidden');
            document.getElementById('actualizarButton').classList.remove('hidden'); // Mostrar el botón de actualizar

            // Llenar el select de sedes
            const sedesResponse = await ipcRenderer.invoke('obtener-sedes');
            if (sedesResponse.success) {
                llenarSedeSelect('sedeSelect', sedesResponse.data); // Llenar el select de sedes
            } else {
                errorElement.innerText = 'Error al cargar sedes: ' + sedesResponse.error;
            }

            // Cargar teléfonos y direcciones
            cargarTelefonosYDirecciones(persona.dni);
            mostrarDetallesEspecificos(persona.tipoPersona); // Mostrar detalles específicos
        } else {
            errorElement.innerText = 'Error al buscar persona: ' + response.error;
        }
    });

    // Evento para agregar un teléfono
    document.getElementById('agregarTelefono').addEventListener('click', function() {
        const telefonosPersona = document.getElementById('telefonosPersona');
        const nuevoTelefono = document.createElement('input');
        nuevoTelefono.type = 'text';
        nuevoTelefono.className = 'telefono';
        nuevoTelefono.placeholder = 'Ingrese teléfono';
        telefonosPersona.appendChild(nuevoTelefono);
    });

    // Evento para agregar una dirección
    document.getElementById('agregarDireccion').addEventListener('click', function() {
        const direccionesPersona = document.getElementById('direccionesPersona');
        const nuevaDireccion = document.createElement('input');
        nuevaDireccion.type = 'text';
        nuevaDireccion.className = 'direccion';
        nuevaDireccion.placeholder = 'Ingrese dirección';
        direccionesPersona.appendChild(nuevaDireccion);
    });

        // Evento para el botón de actualizar
    document.getElementById('actualizarButton').addEventListener('click', async function() {
        const errorElement = document.getElementById('error');
        errorElement.innerText = ''; // Limpiar mensajes de error previos

        // Validaciones
        let valid = true;
        let messages = [];

        const dni = document.getElementById('dniBuscar').value; // Usar el DNI buscado
        const nombres = document.getElementById('nombres').value;
        const apellidoPaterno = document.getElementById('apellidoPaterno').value;
        const apellidoMaterno = document.getElementById('apellidoMaterno').value;
        const correoElectronico = document.getElementById('correoElectronico').value;
        const idSede = document.getElementById('sedeSelect').value;

        // Obtener teléfonos y direcciones
        const telefonos = Array.from(document.querySelectorAll('.telefono')).map(input => input.value);
        const direcciones = Array.from(document.querySelectorAll('.direccion')).map(input => input.value);

        // Validaciones
        if (!/^\d{8}$/.test(dni)) {
            messages.push('EL DNI DEBE SER EXACTAMENTE 8 DÍGITOS Y UN NÚMERO');
            valid = false;
        }
        if (nombres.length === 0 || nombres.length > 50 || /[^a-zA-Z\s]/.test(nombres)) {
            messages.push('LOS NOMBRES NO PUEDEN SER NULOS Y NO PUEDEN SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }
        if (apellidoPaterno.length === 0 || apellidoPaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoPaterno)) {
            messages.push('EL APELLIDO PATERNO NO PUEDE SER NULO Y NO PUEDE SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }
        if (apellidoMaterno.length === 0 || apellidoMaterno.length > 50 || /[^a-zA-Z\s]/.test(apellidoMaterno)) {
            messages.push('EL APELLIDO MATERNO NO PUEDE SER NULO Y NO PUEDEN SUPERAR 50 CARACTERES Y SOLO PUEDEN CONTENER LETRAS');
            valid = false;
        }
        if (correoElectronico.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoElectronico)) {
            messages.push('EL CORREO NO PUEDE SUPERAR 60 CARACTERES Y DEBE TENER FORMATO DE CORREO');
            valid = false;
        }
        if (idSede === '') {
            messages.push('DEBE SELECCIONAR UNA SEDE');
            valid = false;
        }

        if (!valid) {
            errorElement.innerHTML = messages.join('<br>');
            return; // Si hay errores, no continuar con la actualización
        }

        // Aquí debes obtener el tipo de persona de la respuesta de búsqueda
        const response = await ipcRenderer.invoke('buscar-persona', dni);
        if (!response.success) {
            errorElement.innerText = 'Error al buscar persona: ' + response.error;
            return;
        }

            // Captura del salario según el tipo de persona
        let salario = null;
        if (response.data.tipoPersona === 'empleado_supervisor') {
            salario = document.getElementById('salarioSupervisor').value; // Captura el salario del supervisor
        } else if (response.data.tipoPersona === 'empleado_vendedor') {
            salario = document.getElementById('salarioVendedor').value; // Captura el salario del vendedor
        }

        // Crear el objeto personData con los datos actualizados
        const personData = {
            dni: dni,
            nombres: nombres,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            correoElectronico: correoElectronico,
            idSede: idSede, // Asignar el id de la sede seleccionada
            telefonos: telefonos,
            direcciones: direcciones,
            tipoPersona: response.data.tipoPersona, // Obtener el tipo de persona de la respuesta
            salario: salario, // Asignar el salario capturado
            comision: document.getElementById('comisionVendedor') ? document.getElementById('comisionVendedor').value : null,
            dniSupervisor: document.getElementById('dniSupervisorVendedor') ? document.getElementById('dniSupervisorVendedor').value : null,
            areaDeSupervision: document.getElementById('areaDeSupervision') ? document.getElementById('areaDeSupervision').value : null,
        };

        // Llamar a la función para actualizar la persona en la base de datos
        const updateResponse = await ipcRenderer.invoke('actualizar-persona', personData);
        if (updateResponse.success) {
            errorElement.innerText = 'Actualización exitosa'; // Mostrar mensaje de éxito
            errorElement.style.color = 'green'; // Cambiar color a verde para éxito
        } else {
            errorElement.innerText = 'Error al actualizar: ' + updateResponse.error; // Mostrar error
        }
        
        // Borrar el mensaje después de 3 segundos
        setTimeout(() => {
            errorElement.innerText = ''; // Limpiar el mensaje
        }, 5000);
    });
});

// Función para llenar el select de sedes
async function llenarSedeSelect(selectId, sedes) {
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

// Función para cargar teléfonos y direcciones
async function cargarTelefonosYDirecciones(dni) {
    const response = await ipcRenderer.invoke('obtener-telefonos-y-direcciones', dni);
    if (response.success) {
        const telefonos = response.data.telefonos;
        const direcciones = response.data.direcciones;

        const telefonosPersona = document.getElementById('telefonosPersona');
        telefonosPersona.innerHTML = ''; // Limpiar antes de agregar

        telefonos.forEach(telefono => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'telefono';
            input.value = telefono; // Asignar el valor del teléfono
            telefonosPersona.appendChild(input);
        });

        const direccionesPersona = document.getElementById('direccionesPersona');
        direccionesPersona.innerHTML = ''; // Limpiar antes de agregar

        direcciones.forEach(direccion => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'direccion';
            input.value = direccion; // Asignar el valor de la dirección
            direccionesPersona.appendChild(input);
        });
    } else {
        console.error('Error al cargar teléfonos y direcciones:', response.error);
    }
}

// Función para mostrar detalles específicos según el tipo de persona
function mostrarDetallesEspecificos(tipoPersona) {
    const empleadoSupervisorCampos = document.getElementById('empleadoSupervisorCampos');
    const empleadoVendedorCampos = document.getElementById('empleadoVendedorCampos');
    const detallesEspecificos = document.getElementById('detallesEspecificos');

    // Limpiar campos
    empleadoSupervisorCampos.classList.add('hidden');
    empleadoVendedorCampos.classList.add('hidden');

    // Mostrar campos según el tipo de persona
    if (tipoPersona === 'empleado_supervisor') {
        empleadoSupervisorCampos.classList.remove('hidden');
        detallesEspecificos.classList.remove('hidden');
    } else if (tipoPersona === 'empleado_vendedor') {
        empleadoVendedorCampos.classList.remove('hidden');
        detallesEspecificos.classList.remove('hidden');
    } else {
        detallesEspecificos.classList.add('hidden');
    }
}