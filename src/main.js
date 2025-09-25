const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('../db/db.js');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: false,
            nodeIntegration: true
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
    try {
        await db.initialize(); // Inicializa la conexión a la base de datos
        await db.testConnection(); // Prueba la conexión
        createWindow();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Cierra el pool de conexiones al cerrar la aplicación
app.on('quit', async () => {
    await db.closePool();
});

ipcMain.handle('register-person', async (event, personData) => {
    const response = await db.registerPerson(personData);
    return response; // Devuelve la respuesta al renderer
});

ipcMain.handle('obtener-sedes', async () => {
    try {
        const sedes = await db.obtenerSedes();
        return { success: true, data: sedes };
    } catch (error) {
        console.error('Error al obtener sedes:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('actualizar-persona', async (event, personData) => {
    const response = await db.actualizarPersona(personData);
    return response; // Devuelve la respuesta al renderer
});

ipcMain.handle('buscar-persona', async (event, dni) => {
    try {
        const persona = await db.buscarPersonaPorDNI(dni);
        if (persona) {
            return { success: true, data: persona };
        } else {
            return { success: false, error: 'Persona no encontrada' };
        }
    } catch (error) {
        console.error('Error al buscar persona:', error);
        return { success: false, error: error.message };
    }
});

// Manejador para obtener teléfonos y direcciones
ipcMain.handle('obtener-telefonos-y-direcciones', async (event, dni) => {
    try {
        const telefonos = await db.obtenerTelefonosPorDNI(dni);
        const direcciones = await db.obtenerDireccionesPorDNI(dni);
        return { success: true, data: { telefonos, direcciones } };
    } catch (error) {
        console.error('Error al obtener teléfonos y direcciones:', error);
        return { success: false, error: error.message };
    }
});
