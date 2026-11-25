/* Partículas: polvo, destellos, oro, confeti, burbujas Zzz, textos flotantes */
(function () {
  const U = J.U;
  const P = { lista: [] };
  const MAX = 420;

  P.crear = function (o) {
    if (P.lista.length >= MAX) P.lista.shift();
    o.vida = o.vida || 0.6; o.vidaMax = o.vida;
    o.z = o.z || 0; o.vx = o.vx || 0; o.vy = o.vy || 0; o.vz = o.vz || 0; o.g = o.g || 0;
    o.tam = o.tam || 5; o.giro = Math.random() * 6;
    P.lista.push(o);
  };

  P.polvo = (x, y, n) => { for (let i = 0; i < (n || 1); i++) P.crear({ tipo: 'polvo', x: x + U.azar(-8, 8), y: y + U.azar(-3, 3), z: 3, vx: U.azar(-25, 25), vz: U.azar(20, 55), vida: U.azar(0.35, 0.6), tam: U.azar(5, 9), color: '255,250,235' }); };
  P.chispas = (x, y, z, n, color) => { for (let i = 0; i < n; i++) { const a = Math.random() * U.TAU, v = U.azar(40, 170); P.crear({ tipo: 'chispa', x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.4, vz: U.azar(40, 240), g: 420, vida: U.azar(0.4, 0.85), tam: U.azar(4, 9), color: color || '#fff6b0' }); } };
  P.oro = (x, y, z, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * U.TAU, v = U.azar(60, 210); P.crear({ tipo: i % 3 ? 'oro' : 'chispa', x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.4, vz: U.azar(120, 380), g: 900, vida: U.azar(0.45, 0.9), tam: U.azar(3, 6.5), color: i % 2 ? '#ffd23f' : '#fff6b0' }); } };
  P.confeti = (x, y, z, n) => { const c = ['#ff5d8f', '#ffd23f', '#5ad1ff', '#8fe39a', '#c38bff', '#ffffff']; for (let i = 0; i < n; i++) { const a = Math.random() * U.TAU, v = U.azar(60, 320); P.crear({ tipo: 'confeti', x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.45, vz: U.azar(250, 620), g: 700, vida: U.azar(1, 1.9), tam: U.azar(5, 9), color: c[i % c.length] }); } };
  P.texto = (x, y, z, texto, color, tam) => P.crear({ tipo: 'texto', x, y, z, vz: 55, vida: 1.1, texto, color: color || '#fff', tam: tam || 22 });
  P.zzz = (x, y, z) => P.crear({ tipo: 'zzz', x, y, z, vx: U.azar(8, 22), vz: 38, vida: 1.7, tam: U.azar(13, 20) });
  P.gotas = (x, y, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * U.TAU, v = U.azar(40, 140); P.crear({ tipo: 'oro', x, y, z: 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.4, vz: U.azar(150, 330), g: 900, vida: 0.6, tam: U.azar(3, 5), color: '#a8f0ff' }); } };
  P.corazones = (x, y, z, n) => { for (let i = 0; i < n; i++) P.crear({ tipo: 'corazon', x: x + U.azar(-24, 24), y, z: z + U.azar(0, 20), vz: U.azar(50, 100), vida: U.azar(0.9, 1.4), tam: U.azar(6, 10), color: '#ff5d8f' }); };

  P.actualizar = function (dt) {
    const L = P.lista;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.vida -= dt;
      if (p.vida <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
      p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.z < 0 && p.g) { p.z = 0; p.vz *= -0.4; p.vx *= 0.6; p.vy *= 0.6; }
      p.giro += dt * 7;
    }
  };

  P.dibujar = function (ctx, v) {
    const D = J.Dibujo;
    for (const p of P.lista) {
      if (p.x < v.x0 - 40 || p.x > v.x1 + 40 || p.y - p.z < v.y0 - 60 || p.y - p.z > v.y1 + 60) continue;
      const k = p.vida / p.vidaMax, x = p.x, y = p.y - p.z;
      switch (p.tipo) {
        case 'polvo': ctx.fillStyle = `rgba(${p.color},${k * 0.7})`; ctx.beginPath(); ctx.arc(x, y, p.tam * (1.6 - k * 0.6), 0, U.TAU); ctx.fill(); break;
        case 'chispa': ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = p.color; D.estrella(ctx, x, y, p.tam * (0.5 + k * 0.6), 4, 0.28); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'oro': ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, p.tam, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'confeti': ctx.globalAlpha = Math.min(1, k * 2.5); ctx.fillStyle = p.color; ctx.save(); ctx.translate(x, y); ctx.rotate(p.giro); ctx.fillRect(-p.tam / 2, -p.tam * 0.3 * Math.cos(p.giro * 1.3), p.tam, p.tam * 0.6 * Math.cos(p.giro * 1.3) || 1); ctx.restore(); ctx.globalAlpha = 1; break;
        case 'corazon': ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = p.color; D.corazon(ctx, x + Math.sin(p.giro * 0.5) * 5, y, p.tam); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'zzz': {
          const a = Math.min(1, k * 2.2), r = p.tam * (1.5 - k * 0.5);
          ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`; ctx.strokeStyle = `rgba(122,170,255,${a})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = `rgba(74,90,200,${a})`; ctx.font = `bold ${Math.round(r * 1.25)}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Z', x, y + 1); break;
        }
        case 'texto':
          ctx.globalAlpha = Math.min(1, k * 2.5);
          ctx.font = `900 ${p.tam}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 5; ctx.strokeStyle = '#5b2a4e'; ctx.lineJoin = 'round'; ctx.strokeText(p.texto, x, y);
          ctx.fillStyle = p.color; ctx.fillText(p.texto, x, y); ctx.globalAlpha = 1; break;
      }
    }
  };

  J.Part = P;
})();
