const oracledb = require('oracledb');

let pool;

async function initialize() {
    try {
        pool = await oracledb.createPool({
            user: 'USERDB',
            password: 'PASSWORD',
            connectString: 'localhost:1521/XEPDB1',
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1,
            poolTimeout: 60,
        });
        console.log('Pool de conexiones creado');
    } catch (err) {
        console.error('Error al crear el pool de conexiones:', err);
        throw err;
    }
}

async function closePool() {
    try {
        if (pool) {
            await pool.close(0); // Cierra el pool sin esperar a que se completen las conexiones activas
            console.log('Pool de conexiones cerrado');
        }
    } catch (err) {
        console.error('Error al cerrar el pool de conexiones:', err);
    }
}

async function getConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión obtenida del pool');
        return connection;
    } catch (err) {
        console.error('Error al obtener la conexión:', err);
        throw err;
    }
}

async function testConnection() {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute('SELECT SYSDATE FROM dual');
        console.log('La fecha y hora actual es:', result.rows[0][0]);
    } catch (err) {
        console.error('Error al probar la conexión:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function executeQuery() {
    let connection;

    try {
        connection = await oracledb.getConnection({
            user: 'USERDB',
            password: 'PASSWORD',
            connectString: 'localhost:1521/XEPDB1'
        });

        // Ejecuta la consulta sin parámetros
        const result = await connection.execute(
            `SELECT * FROM PRODUCTO`
        );

        console.log('Resultados de la consulta:', result.rows);

    } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function registerPerson(personData) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(
            `INSERT INTO persona (dni, nombres, apellido_Paterno, apellido_Materno, correo_Electronico, fecha_Registro, id_sede) 
             VALUES (:dni, :nombres, :apellidoPaterno, :apellidoMaterno, :correoElectronico, SYSDATE, :idSede)`,
            {
                dni: personData.dni,
                nombres: personData.nombres,
                apellidoPaterno: personData.apellidoPaterno,
                apellidoMaterno: personData.apellidoMaterno,
                correoElectronico: personData.correoElectronico,
                idSede: personData.idSede
            }
        );

        // Insertar en la tabla PERSONA_DIRECCION
        for (const direccion of personData.direcciones) {
            await connection.execute(
                `INSERT INTO persona_direccion (direccion, dni) 
                 VALUES (:direccion, :dni)`,
                {
                    direccion: direccion,
                    dni: personData.dni
                }
            );
        }

        // Insertar en la tabla PERSONA_TELEFONO
        for (const telefono of personData.telefonos) {
            await connection.execute(
                `INSERT INTO persona_telefono (telefono, dni) 
                 VALUES (:telefono, :dni)`,
                {
                    telefono: telefono,
                    dni: personData.dni
                }
            );
        }

        // Si es un cliente, insertar en la tabla CLIENTE
        if (personData.tipoPersona === 'cliente') {
            await connection.execute(
                `INSERT INTO cliente (dni) 
                 VALUES (:dni)`,
                {
                    dni: personData.dni
                }
            );
        }

        // Si es un empleado supervisor, insertar en la tabla SUPERVISOR
        if (personData.tipoPersona === 'empleado_supervisor') {
            await connection.execute(
                `INSERT INTO empleado (dni, fecha_de_contratacion, salario) 
                 VALUES (:dni, TO_DATE(:fecha_de_contratacion, 'YYYY-MM-DD'), :salario)`,
                {
                    dni: personData.dni,
                    fecha_de_contratacion: { val: personData.fechaContratacion, type: oracledb.STRING },
                    salario : personData.salario
                }
            );

            await connection.execute(
                `INSERT INTO supervisor (dni, area_de_supervision) 
                 VALUES (:dni, :area_de_supervision)`,
                {
                    dni: personData.dni,
                    area_de_supervision: personData.areaDeSupervision
                }
            );
        }

        // Si es un empleado vendedor, insertar en la tabla VENDEDOR
        if (personData.tipoPersona === 'empleado_vendedor') {
            await connection.execute(
                `INSERT INTO empleado (dni, fecha_de_contratacion, salario) 
                 VALUES (:dni, TO_DATE(:fecha_de_contratacion, 'YYYY-MM-DD'), :salario)`,
                {
                    dni: personData.dni,
                    fecha_de_contratacion: { val: personData.fechaContratacion, type: oracledb.STRING },
                    salario : personData.salario
                }
            );

            await connection.execute(
                `INSERT INTO vendedor (dni_vendedor, comision, dni_supervisor) 
                    VALUES (:dni_vendedor, :comision, :dni_supervisor)`,
                {
                    dni_vendedor: personData.dni,
                    comision: personData.comision,
                    dni_supervisor: personData.dniSupervisor
                }
            );
        }

        // Confirmar la transacción
        await connection.commit();
        return { success: true };
    } catch (error) {
        console.error('Error al registrar la persona:', error);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function obtenerSedes() {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`SELECT id_sede, nombre FROM sede`);
        return result.rows; // Devuelve las filas obtenidas
    } catch (error) {
        console.error('Error al obtener las sedes:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function buscarPersonaPorDNI(dni) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT p.dni, p.nombres, p.apellido_Paterno, p.apellido_Materno, p.correo_Electronico, 
                    c.dni AS cliente_dni, e.dni AS empleado_dni, s.dni AS supervisor_dni
             FROM persona p
             LEFT JOIN cliente c ON p.dni = c.dni
             LEFT JOIN empleado e ON p.dni = e.dni
             LEFT JOIN supervisor s ON p.dni = s.dni
             WHERE p.dni = :dni`,
            { dni: dni }
        );

        if (result.rows.length > 0) {
            const persona = result.rows[0];
            return {
                dni: persona[0],
                nombres: persona[1],
                apellidoPaterno: persona[2],
                apellidoMaterno: persona[3],
                correoElectronico: persona[4],
                tipoPersona: persona[5] ? 'cliente' : (persona[6] ? 'empleado_supervisor' : (persona[7] ? 'empleado_vendedor' : null))
            };
        } else {
            return null; // No se encontró la persona
        }
    } catch (error) {
        console.error('Error al buscar persona por DNI:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function obtenerTelefonosPorDNI(dni) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT telefono FROM persona_telefono WHERE dni = :dni`,
            { dni: dni }
        );
        return result.rows.map(row => row[0]); // Devuelve un array de teléfonos
    } catch (error) {
        console.error('Error al obtener teléfonos:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function obtenerDireccionesPorDNI(dni) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT direccion FROM persona_direccion WHERE dni = :dni`,
            { dni: dni }
        );
        return result.rows.map(row => row[0]); // Devuelve un array de direcciones
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function actualizarPersona(personData) {
    let connection;
    try {
        connection = await getConnection();

        // Actualizar la información básica de la persona
        await connection.execute(
            `UPDATE persona 
             SET nombres = :nombres, 
                 apellido_Paterno = :apellidoPaterno, 
                 apellido_Materno = :apellidoMaterno, 
                 correo_Electronico = :correoElectronico, 
                 id_sede = :idSede 
             WHERE dni = :dni`,
            {
                dni: personData.dni,
                nombres: personData.nombres,
                apellidoPaterno: personData.apellidoPaterno,
                apellidoMaterno: personData.apellidoMaterno,
                correoElectronico: personData.correoElectronico,
                idSede: personData.idSede
            }
        );

        // Actualizar teléfonos
        await connection.execute(`DELETE FROM persona_telefono WHERE dni = :dni`, { dni: personData.dni });
        for (const telefono of personData.telefonos) {
            await connection.execute(
                `INSERT INTO persona_telefono (telefono, dni) 
                 VALUES (:telefono, :dni)`,
                {
                    telefono: telefono,
                    dni: personData.dni
                }
            );
        }

        // Actualizar direcciones
        await connection.execute(`DELETE FROM persona_direccion WHERE dni = :dni`, { dni: personData.dni });
        for (const direccion of personData.direcciones) {
            await connection.execute(
                `INSERT INTO persona_direccion (direccion, dni) 
                 VALUES (:direccion, :dni)`,
                {
                    direccion: direccion,
                    dni: personData.dni
                }
            );
        }

        // Actualizar detalles específicos según el tipo de persona
        if (personData.tipoPersona === 'empleado_supervisor') {
            await connection.execute(
                `UPDATE empleado 
                 SET salario = :salario 
                 WHERE dni = :dni`,
                {
                    dni: personData.dni,
                    salario: personData.salario
                }
            );

            await connection.execute(
                `UPDATE supervisor 
                 SET area_de_supervision = :area_de_supervision 
                 WHERE dni = :dni`,
                {
                    dni: personData.dni,
                    area_de_supervision: personData.areaDeSupervision
                }
            );
        } else if (personData.tipoPersona === 'empleado_vendedor') {
            await connection.execute(
                `UPDATE empleado 
                 SET salario = :salario 
                 WHERE dni = :dni`,
                {
                    dni: personData.dni,
                    salario: personData.salario
                }
            );

            await connection.execute(
                `UPDATE vendedor 
                 SET comision = :comision, 
                     dni_supervisor = :dni_supervisor 
                 WHERE dni_vendedor = :dni_vendedor`,
                {
                    dni_vendedor: personData.dni,
                    comision: personData.comision,
                    dni_supervisor: personData.dniSupervisor
                }
            );
        }

        // Confirmar la transacción
        await connection.commit();
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar la persona:', error);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

async function buscarPersonaPorDNI(dni) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(
            `SELECT p.dni, p.nombres, p.apellido_Paterno, p.apellido_Materno, p.correo_Electronico,
                    CASE 
                        WHEN c.dni IS NOT NULL THEN 'cliente'
                        WHEN v.dni_vendedor IS NOT NULL THEN 'empleado_vendedor'
                        WHEN s.dni IS NOT NULL THEN 'empleado_supervisor'
                    END AS tipo_persona
             FROM persona p
             LEFT JOIN cliente c ON p.dni = c.dni
             LEFT JOIN vendedor v ON p.dni = v.dni_vendedor
             LEFT JOIN supervisor s ON p.dni = s.dni
             WHERE p.dni = :dni`,
            { dni: dni }
        );

        if (result.rows.length > 0) {
            const persona = result.rows[0];
            return {
                dni: persona[0],
                nombres: persona[1],
                apellidoPaterno: persona[2],
                apellidoMaterno: persona[3],
                correoElectronico: persona[4],
                tipoPersona: persona[5] // Aquí se obtiene el tipo de persona
            };
        } else {
            return null; // No se encontró la persona
        }
    } catch (error) {
        console.error('Error al buscar persona por DNI:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

executeQuery();

module.exports = {
    initialize,
    closePool,
    getConnection,
    testConnection,
    registerPerson,
    obtenerSedes,
    buscarPersonaPorDNI,
    obtenerTelefonosPorDNI,
    obtenerDireccionesPorDNI,
    actualizarPersona,
    buscarPersonaPorDNI
};