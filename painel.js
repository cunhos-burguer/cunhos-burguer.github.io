/* Funções compartilhadas pelos painéis Atendimento e Produção.
   Fala só com o script de pedidos (Apps Script). A senha NUNCA fica neste arquivo: ela é conferida lá. */
const App = { E: null, recebidoEm: 0, versao: '', pendentes: 0, rodando: false, ultimoCompleto: 0, semMudanca: false };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = n => 'R$ ' + Number(n).toFixed(2).replace('.', ',');
const pad = n => String(n).padStart(2, '0');
function mmss(ms) { const neg = ms < 0; const s = Math.floor(Math.abs(ms) / 1000); return (neg ? '−' : '') + pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || '';
function fmtTel(t) { const d = String(t).replace(/^55/, ''); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : t; }
const hhmm = ms => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const agoraV = () => App.E.agora + (performance.now() - App.recebidoEm);   // hora do SERVIDOR (não depende do relógio do aparelho)
const saudacao = () => 'Boa noite';   // a hamburgueria só atende à noite; se precisar de outra, o atendimento edita o texto antes de enviar

/* ─── comunicação com o script de pedidos ─── */
const PEDIDOS_URL = 'https://script.google.com/macros/s/AKfycbxwW2p-7sTU69UF3eB8Y-aeZO1F9_Ljb7n91wSfgdiaX-1lS9lwAgp8gUSczjO67hrn/exec';
const PAPEL = window.PAPEL_DA_PAGINA;             // 'atendimento' ou 'producao' (definido na página, antes deste arquivo)
const CHAVE_TOKEN = 'cunhos_painel_' + PAPEL;
const lerToken = () => { try { const t = JSON.parse(localStorage.getItem(CHAVE_TOKEN) || 'null'); return t && t.exp > Date.now() ? t.token : null; } catch (e) { return null; } };
const guardarToken = (token, horas) => { try { localStorage.setItem(CHAVE_TOKEN, JSON.stringify({ token, exp: Date.now() + (horas - 0.5) * 3600000 })); } catch (e) { /* sem armazenamento: pede a senha a cada abertura */ } };
const apagarToken = () => { try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) { /* ok */ } };

async function chamar(corpo) {                    // text/plain: o Apps Script não responde à "consulta prévia" (CORS)
  const r = await fetch(PEDIDOS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corpo) });
  return r.json().catch(() => ({ ok: false, erro: 'Resposta inválida do servidor.', codigo: 'resposta' }));
}
async function api(acao, dados) {                 // chamada com sessão; lança erro com mensagem em português
  let j;
  try { j = await chamar(Object.assign({ acao, token: lerToken() }, dados || {})); }
  catch (e) { const er = new Error('Sem conexão. Tentando de novo…'); er.codigo = 'rede'; throw er; }
  if (!j.ok) {
    if (j.codigo === 'sessao') { apagarToken(); App.rodando = false; pedirLogin('Sessão expirada. Digite a senha de novo.'); }
    const er = new Error(j.erro || 'Erro'); er.codigo = j.codigo; throw er;
  }
  return j;
}
async function carregar(completo) {               // só baixa tudo se algo mudou (ou a cada 60 s, para pegar mudanças na aba Config)
  const j = await api('listar', { versao: completo ? '' : App.versao, completo: !!completo });
  App.recebidoEm = performance.now(); App.semMudanca = !!j.semMudanca;
  if (j.semMudanca && App.E) { App.E.agora = j.agora; return App.E; }
  App.E = j; App.versao = j.versao; App.ultimoCompleto = Date.now(); return App.E;
}
function setStatus(on) { const p = $('#conexao'); if (p) { p.className = 'ponto ' + (on ? 'on' : 'off'); p.title = on ? 'Conectado' : 'Sem conexão'; } }

/* ─── login (senha de 8 números conferida no servidor) ─── */
function pedirLogin(msg) {
  let o = $('#login');
  if (!o) {
    o = document.createElement('div'); o.id = 'login'; o.className = 'login';
    o.innerHTML = '<form class="login-caixa" id="login-form" autocomplete="off"><h2>' + (PAPEL === 'producao' ? 'Produção' : 'Atendimento') + '</h2>' +
      '<p class="mudo">Digite a senha de 8 números</p><input id="login-senha" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="••••••••" aria-label="Senha">' +
      '<div class="login-erro" id="login-erro" role="alert"></div><button class="btn pri" type="submit" id="login-ok">Entrar</button></form>';
    document.body.appendChild(o);
    $('#login-form').addEventListener('submit', async ev => {
      ev.preventDefault(); const senha = $('#login-senha').value.trim(), b = $('#login-ok');
      if (!/^\d{8}$/.test(senha)) { $('#login-erro').textContent = 'A senha tem 8 números.'; return; }
      b.disabled = true; b.textContent = 'Entrando…'; $('#login-erro').textContent = '';
      try {
        const j = await chamar({ acao: 'login', papel: PAPEL, senha });
        if (j.ok) { guardarToken(j.token, j.horas || 24); $('#login-senha').value = ''; o.hidden = true; iniciarSessao(); }
        else $('#login-erro').textContent = j.erro || 'Não foi possível entrar.';
      } catch (e) { $('#login-erro').textContent = 'Sem conexão. Tente de novo.'; }
      b.disabled = false; b.textContent = 'Entrar';
    });
  }
  o.hidden = false; $('#login-erro').textContent = msg || ''; setTimeout(() => { const i = $('#login-senha'); if (i) i.focus(); }, 60);
}
function sair() { apagarToken(); App.rodando = false; App.E = null; App.versao = ''; pedirLogin(''); }

/* ─── atualização automática ─── */
let _ciclo;
function iniciarPainel(onDados) { App.onDados = onDados; if (lerToken()) iniciarSessao(); else pedirLogin(''); }
function iniciarSessao() { if (App.rodando) return; App.rodando = true; ciclo(); }
async function ciclo() {
  clearTimeout(_ciclo); if (!App.rodando) return;
  let espera = document.hidden ? 15000 : 4000;
  if (!App.pendentes) {
    try {
      const completo = !App.E || Date.now() - App.ultimoCompleto > 60000, antes = App.E ? JSON.stringify([App.E.pedidos, App.E.clientes, App.E.modelos, App.E.config]) : '';
      const E = await carregar(completo);
      const mudou = !App.semMudanca && JSON.stringify([E.pedidos, E.clientes, E.modelos, E.config]) !== antes;
      setStatus(true); App.onDados(E, mudou);
    } catch (e) { setStatus(false); if (e.codigo === 'sessao') return; espera = 8000; }
  }
  if (App.rodando) _ciclo = setTimeout(ciclo, espera);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && App.rodando) ciclo(); });

/* ─── ações sobre pedidos: mostram na hora e confirmam com o servidor (que pode levar alguns segundos) ─── */
function aplicarLocal(p, op, extra) {
  const t = agoraV(), log = s => { (p.historico = p.historico || []).push({ quando: t, acao: s }); };
  if (op === 'confirmar_pagamento') { p.status = 'em_producao'; p.pagoEm = t; p.producaoInicio = t; log('Comprovante conferido → enviado para a produção'); }
  else if (op === 'pronto') { p.status = 'pronto'; p.prontoEm = t; log('Pedido pronto'); }
  else if (op === 'voltar_producao') { p.status = 'em_producao'; delete p.prontoEm; log('Voltou para a produção'); }
  else if (op === 'saiu') { p.status = 'saiu'; p.saiuEm = t; log('Saiu para entrega'); }
  else if (op === 'entregue') { p.status = 'entregue'; p.entregueEm = t; log('Entregue'); }
  else if (op === 'cancelar') { p.status = 'cancelado'; p.canceladoEm = t; log('Cancelado'); }
  else if (op === 'mensagem') { p.mensagens = p.mensagens || {}; p.mensagens[extra.chave] = t; }
  else if (op === 'brinde') { p.brinde = true; }
  else if (op === 'vincular_historico') { p.historicoVinculado = extra.hid; }
  else if (op === 'descartar_historico') { p.sugestaoDescartada = true; }
}
async function fazerAcao(id, op, extra) {
  const p = App.E && App.E.pedidos.find(x => x.id === id); if (!p) return false;
  aplicarLocal(p, op, extra); App.pendentes++; if (App.redesenhar) App.redesenhar();
  let ok = true;
  try { await api('acao_pedido', Object.assign({ id, operacao: op }, extra || {})); }
  catch (e) { ok = false; aviso(e.message); }
  try { await carregar(true); } catch (e) { /* o próximo ciclo corrige */ }
  App.pendentes--; if (App.redesenhar) App.redesenhar();
  return ok;
}
let _toast;
function aviso(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'aviso-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(_toast); _toast = setTimeout(() => t.classList.remove('show'), 2600); }

/* som e vibração de pedido novo (o navegador só libera o som depois de um toque) */
let _audio = null;
function ativarSom() { _audio = _audio || new (window.AudioContext || window.webkitAudioContext)(); _audio.resume(); beep(); }
function beep() {
  if (!_audio) return; const o = _audio.createOscillator(), g = _audio.createGain(); o.connect(g); g.connect(_audio.destination);
  o.frequency.value = 880; g.gain.value = 0.15; o.start(); setTimeout(() => { o.frequency.value = 1175; }, 160); setTimeout(() => o.stop(), 380);
}
function alertaNovo() { beep(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }

/* ─── modelos de mensagem ─── */
const ehRecorrente = p => p.ordemDoCliente >= 2;

/* brinde: o 1º no pedido nº brindePrimeiro (4), depois um a cada brindeACada (3). É só sugestão para o atendimento. */
const metaBrinde = (cli, E) => (cli.brindes && cli.brindes.length) ? E.config.brindeACada : E.config.brindePrimeiro;
const brindeDevido = (cli, p, E) => !!cli && ((cli.pedidosDesdeBrinde || 0) + (p && p.status === 'aguardando' ? 1 : 0)) >= metaBrinde(cli, E);
/* "hoje", "ontem" ou "12/10 (há 13 dias)" — só a data, sem lista de pedidos */
function quandoFoi(ts) {
  if (!ts) return '—';
  const d = new Date(ts), h = new Date(agoraV()), dia = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const n = Math.round((dia(h) - dia(d)) / 86400000);
  return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' (há ' + n + ' dias)';
}
function ctxPedido(p, E) {
  return { nome: primeiroNome(p.cliente.nome), pedido: p.numero, total: Number(p.total).toFixed(2).replace('.', ','),
    ordinal: p.ordemDoCliente + 'º', saudacao: saudacao(), previsao: E.config.previsaoEntregaMin };
}
const renderModelo = (texto, ctx) => String(texto).replace(/\{(\w+)\}/g, (m, k) => ctx[k] !== undefined ? ctx[k] : m);
const etapaDoPedido = p => ({ aguardando: 'aguardando', em_producao: 'producao', pronto: 'pronto', saiu: 'saiu', entregue: 'entregue' }[p.status] || 'todas');
function modelosParaPedido(p, E) {
  const et = etapaDoPedido(p), rec = ehRecorrente(p);
  const rel = m => (m.etapa === et || (et === 'pronto' && m.etapa === 'saiu') ? 2 : m.etapa === 'todas' ? 1 : 0) + (m.para === (rec ? 'recorrente' : 'novo') ? 2 : m.para === 'todos' ? 1 : -9);
  return E.modelos.map(m => ({ m, nota: rel(m) })).sort((a, b) => b.nota - a.nota);
}

/* prompt pronto para colar numa IA (sem integração, sem custo) */
function montarPrompt(p, E, situacao) {
  const cli = E.clientes[p.cliente.telefone] || {};
  return `Você é o atendente da Cunho's Burguer, hamburgueria artesanal em Indaiatuba-SP. Tom de voz: ${E.config.tomDeVoz}.
Escreva UMA mensagem curta de WhatsApp (no máximo 3 frases) para o cliente.
Situação: ${situacao}
Dados: nome ${primeiroNome(p.cliente.nome)}; pedido nº ${p.numero}; total R$ ${Number(p.total).toFixed(2).replace('.', ',')}; ` +
`cliente ${ehRecorrente(p) ? 'RECORRENTE (este é o ' + p.ordemDoCliente + 'º pedido)' : 'NOVO'}; ` +
`último pedido anterior: ${p.anteriorEm ? quandoFoi(p.anteriorEm) : 'nenhum'}; brinde sugerido: ${brindeDevido(cli, p, E) ? 'sim' : 'não'}.
Itens: ${resumoItens(p).join('; ')}.
Regras: não invente preços, prazos nem promoções; use no máximo 2 emojis; escreva em português do Brasil.`;
}

/* ─── itens: agrupa unidades idênticas ─── */
function chaveItem(i) { return JSON.stringify([i.pid, i.tam, i.ponto, i.variant, [...i.add].sort(), [...i.rem].sort(), i.obs, i.completo, i.leite, [...i.toppings].sort()]); }
function agruparItens(p) { const m = new Map(); p.itens.forEach(i => { const k = chaveItem(i); if (!m.has(k)) m.set(k, { item: i, qtd: 0 }); m.get(k).qtd++; }); return [...m.values()]; }
function descItem(i, E) {
  const c = E.catalogo, pr = c.produtos[i.pid];
  if (i.tipo === 'burger') return `${i.nome} ${pr.carnes === 2 ? i.tam * 2 + ' g (2×' + i.tam + ' g)' : i.tam + ' g'} · ${i.ponto}`;
  if (i.tipo === 'bebida') return `${i.nome} · ${i.variant}`;
  return `${i.nome} · ${i.completo ? 'Completo (' + (i.leite === 'leitePo' ? 'leite em pó' : 'leite condensado') + ')' : 'Puro'}`;
}
function resumoItens(p) { const E = App.E; return agruparItens(p).map(g => `${g.qtd}× ${descItem(g.item, E)}`); }
function nomeAdd(id, E) { return E.catalogo.adicionais[id] ? E.catalogo.adicionais[id].nome : id; }

/* classe do cronômetro de produção (meta em ms) */
function classeTempo(decorrido, meta) { const r = decorrido / meta; return r >= 1 ? ['t-atraso', 'verm', 100] : r >= 0.83 ? ['t-alerta', 'lar', r * 100] : r >= 0.5 ? ['t-atencao', 'amar', r * 100] : ['t-ok', '', r * 100]; }
