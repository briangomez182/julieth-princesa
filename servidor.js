/* Servidor local de La Aventura de la Princesa Julieth.
 * Node.js puro, sin dependencias. Sirve el juego y guarda las fotos de la cámara.
 *
 *   node servidor.js            -> http://localhost:8000
 *   PORT=9000 node servidor.js  -> otro puerto
 *
 * API:
 *   GET    /api/estado      -> { ok: true }
 *   GET    /api/fotos       -> { fotos: ["img/cameraShot/xxx.jpg", ...] }
 *   POST   /api/fotos       -> body { id, imagen: "data:image/jpeg;base64,..." }
 *   DELETE /api/fotos/<id>  -> borra la foto de ese id
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const RAIZ = __dirname;
const PUERTO = parseInt(process.env.PORT, 10) || 8000;
const CARPETA_FOTOS = path.join(RAIZ, 'img', 'cameraShot');
const RUTA_FOTOS_WEB = 'img/cameraShot/';
const LIMITE_BODY = 8 * 1024 * 1024; // 8 MB
const ID_VALIDO = /^[a-zA-Z0-9_-]{1,64}$/;

// Tipos de imagen que aceptamos y la extensión con la que se guardan
const TIPOS_FOTO = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};
const EXT_FOTOS = ['.jpg', '.jpeg', '.png', '.webp'];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

fs.mkdirSync(CARPETA_FOTOS, { recursive: true });

// ---------- Utilidades ----------

function responderJSON(res, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-store'
  });
  res.end(cuerpo);
}

function error(res, codigo, mensaje) {
  responderJSON(res, codigo, { ok: false, error: mensaje });
}

// Lee el body entero respetando el límite; si se pasa, corta con 413
function leerBody(req, res, alTerminar) {
  const largo = parseInt(req.headers['content-length'], 10);
  if (largo > LIMITE_BODY) {
    error(res, 413, 'La foto es demasiado grande (máximo 8 MB)');
    req.resume();
    return;
  }
  const trozos = [];
  let total = 0;
  let cortado = false;
  req.on('data', (trozo) => {
    if (cortado) return;
    total += trozo.length;
    if (total > LIMITE_BODY) {
      cortado = true;
      error(res, 413, 'La foto es demasiado grande (máximo 8 MB)');
      req.resume();
      return;
    }
    trozos.push(trozo);
  });
  req.on('end', () => {
    if (!cortado) alTerminar(Buffer.concat(trozos).toString('utf8'));
  });
  req.on('error', () => {
    if (!cortado) error(res, 400, 'No se pudo leer el pedido');
  });
}

// Borra todos los archivos de ese id (cualquier extensión de foto)
function borrarFotosDeId(id) {
  for (const ext of EXT_FOTOS) {
    try { fs.unlinkSync(path.join(CARPETA_FOTOS, id + ext)); } catch (e) { /* no existía */ }
  }
}

// ---------- API de fotos ----------

function apiGuardarFoto(req, res) {
  leerBody(req, res, (texto) => {
    let datos;
    try { datos = JSON.parse(texto); } catch (e) {
      return error(res, 400, 'El cuerpo tiene que ser JSON');
    }
    if (!datos || typeof datos !== 'object') return error(res, 400, 'El cuerpo tiene que ser JSON');

    const id = datos.id;
    if (typeof id !== 'string' || !ID_VALIDO.test(id)) {
      return error(res, 400, 'Id inválido (letras, números, _ y -, hasta 64)');
    }
    const imagen = datos.imagen;
    const m = typeof imagen === 'string' && /^data:(image\/[a-z]+);base64,(.+)$/s.exec(imagen);
    if (!m) return error(res, 400, 'La imagen tiene que ser un data URL base64');
    const ext = TIPOS_FOTO[m[1].toLowerCase()];
    if (!ext) return error(res, 415, 'Solo se aceptan fotos jpeg, png o webp');

    const bytes = Buffer.from(m[2], 'base64');
    if (!bytes.length) return error(res, 400, 'La imagen está vacía');

    try {
      borrarFotosDeId(id); // si cambió el formato, que no queden dos
      fs.writeFileSync(path.join(CARPETA_FOTOS, id + ext), bytes);
    } catch (e) {
      return error(res, 500, 'No se pudo guardar la foto');
    }
    responderJSON(res, 200, { ok: true, archivo: RUTA_FOTOS_WEB + id + ext });
  });
}

function apiListarFotos(res) {
  let archivos = [];
  try {
    archivos = fs.readdirSync(CARPETA_FOTOS)
      .filter((n) => EXT_FOTOS.includes(path.extname(n).toLowerCase()))
      .sort()
      .map((n) => RUTA_FOTOS_WEB + n);
  } catch (e) { /* carpeta vacía o inexistente */ }
  responderJSON(res, 200, { fotos: archivos });
}

function apiBorrarFoto(res, id) {
  if (!ID_VALIDO.test(id)) return error(res, 400, 'Id inválido');
  borrarFotosDeId(id);
  responderJSON(res, 200, { ok: true });
}

function manejarAPI(req, res, ruta) {
  if (ruta === '/api/estado') {
    if (req.method !== 'GET') return error(res, 405, 'Método no permitido');
    return responderJSON(res, 200, { ok: true });
  }
  if (ruta === '/api/fotos') {
    if (req.method === 'GET') return apiListarFotos(res);
    if (req.method === 'POST') return apiGuardarFoto(req, res);
    return error(res, 405, 'Método no permitido');
  }
  if (ruta.startsWith('/api/fotos/')) {
    if (req.method !== 'DELETE') return error(res, 405, 'Método no permitido');
    return apiBorrarFoto(res, ruta.slice('/api/fotos/'.length));
  }
  return error(res, 404, 'No existe esa ruta de la API');
}

// ---------- Archivos estáticos ----------

function servirArchivo(req, res, ruta) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Método no permitido');
  }
  if (ruta.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Pedido inválido');
  }
  // Resolvemos y verificamos que siga adentro de la carpeta del juego
  let archivo = path.resolve(RAIZ, '.' + path.posix.normalize('/' + ruta));
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Prohibido');
  }

  fs.stat(archivo, (err, info) => {
    if (!err && info.isDirectory()) {
      archivo = path.join(archivo, 'index.html');
      return fs.stat(archivo, (err2, info2) => enviar(err2, info2));
    }
    enviar(err, info);
  });

  function enviar(err, info) {
    if (err || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': tipo,
      'Content-Length': info.size,
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(archivo).on('error', () => res.destroy()).pipe(res);
  }
}

// ---------- Servidor ----------

const servidor = http.createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return error(res, 400, 'Dirección inválida');
  }
  if (ruta === '/api' || ruta.startsWith('/api/')) return manejarAPI(req, res, ruta);
  servirArchivo(req, res, ruta);
});

servidor.listen(PUERTO, '0.0.0.0', () => {
  console.log('La Aventura de la Princesa Julieth');
  console.log('  Local:  http://localhost:' + PUERTO);
  const redes = os.networkInterfaces();
  for (const nombre of Object.keys(redes)) {
    for (const r of redes[nombre] || []) {
      if (r.family === 'IPv4' && !r.internal) {
        console.log('  Red:    http://' + r.address + ':' + PUERTO + '   (la cámara puede necesitar https)');
      }
    }
  }
  console.log('  Fotos en: ' + path.relative(RAIZ, CARPETA_FOTOS));
});
