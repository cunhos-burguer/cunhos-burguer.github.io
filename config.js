/* ═══════════════════════════════════════════════════════
   ⚙️  CONFIGURAÇÕES DO CUNHO'S BURGUER
   
   Este é o ÚNICO arquivo que você precisa mexer.
   Nunca precisa abrir o index.html.
   ═══════════════════════════════════════════════════════ */

const CONFIG = {

  /* ─────────────────────────────────────────
     🔴 LOJA ABERTA OU FECHADA?
     
     true  = FECHADO (mostra a tela de encerrado)
     false = ABERTO  (site funcionando normal)
     ───────────────────────────────────────── */

  lojaFechada: true,

  // Textos que aparecem quando está fechado:
  proximoDia:   'Amanhã, domingo',
  horaPedidos:  '18h',
  horaEntregas: '19h',


  /* ─────────────────────────────────────────
     📱 WHATSAPP QUE RECEBE OS PEDIDOS
     Formato: 55 + DDD + número (só números)
     ───────────────────────────────────────── */

  whatsapp: '5511975798062',


  /* ─────────────────────────────────────────
     📦 ESTOQUE DO DIA
     
     0     = ESGOTADO (aparece riscado e bloqueia)
     null  = sem limite
     7     = limita o cliente a 7 no carrinho
     ───────────────────────────────────────── */

  estoque: {
    xcunhos:     null,
    tradicional: null,
    bacon:       null,
    duplo:       null,
    coca:        null,
    sprite:      null,
    acai:        0,
  },


  /* ─────────────────────────────────────────
     🥤 ESTOQUE POR SABOR (só bebidas)
     Para esgotar só a Zero ou só a Normal
     ───────────────────────────────────────── */

  estoqueSabor: {
    coca_Normal:   0,
    coca_Zero:     null,
    sprite_Normal: 0,
    sprite_Zero:   null,
  },


  /* ─────────────────────────────────────────
     💰 PREÇOS (carne de 120g)
     ───────────────────────────────────────── */

  precos: {
    xcunhos:     36.90,
    tradicional: 43.90,
    bacon:       50.90,
    duplo:       57.90,
    coca:         8.90,
    sprite:       8.50,
    acai:        23.90,
  },


  /* ─────────────────────────────────────────
     🥩 ACRÉSCIMO PARA CARNE 180g
     ───────────────────────────────────────── */

  upgrade180:      6.00,   // hambúrgueres normais
  upgrade180Duplo: 12.00,  // duplo (são 2 carnes)


  /* ─────────────────────────────────────────
     ➕ PREÇO DOS ADICIONAIS
     ───────────────────────────────────────── */

  adicionais: {
    carne120:  11.00,
    carne180:  15.00,
    baconFat:   5.00,
    baconPic:   3.00,
    prato:      3.00,
    cheddar:    2.00,
    alface:     2.00,
    cebola:     2.00,
    tomate:     1.50,
  },


  /* ─────────────────────────────────────────
     💳 MOSTRAR PIX NA TELA?
     
     false = cliente ENVIA o pedido, vocês mandam o Pix (recomendado)
     true  = mostra o QR na tela antes de enviar
     ───────────────────────────────────────── */

  mostrarPixNaTela: false,

  // Dados do Pix (só usados se mostrarPixNaTela = true)
  pixChave:  '126bc16c-7ecd-4018-8c09-d19895b1fd1a',
  pixNome:   'LEONARDO P GIUSTI',
  pixCidade: 'INDAIATUBA',

};
