// script.js — versão corrigida para PIZZAS (sem conflito com scripts inline)

// DOM
const botoesAdicionar = document.querySelectorAll('.btn-adicionar');
const modalCarrinho = document.getElementById('modal-carrinho');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalDisplay = document.getElementById('total-carrinho'); // nome diferente para evitar conflito
const btnVerCarrinho = document.getElementById('btn-ver-carrinho');
const btnFecharCarrinho = document.getElementById('btn-fechar-carrinho');
const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
const contadorItens = document.getElementById('contador-itens');
const btnLimparCarrinho = document.getElementById('btn-limpar-carrinho');

const selectTipoEntrega = document.getElementById('tipo-entrega');
const campoEnderecoEl = document.getElementById('campo-endereco');
const selectFormaPagamento = document.getElementById('forma-pagamento');
const inputTroco = document.getElementById('troco');

let carrinho = [];
const TAXA_ENTREGA = 8.0;

// --- Helpers ---
function parsePriceFromOptionText(text) {
  // espera algo como "BROTO - R$ 20,00 (4 fatias)"
  const m = text.match(/R\$\s*([\d.,]+)/);
  if (!m) return NaN;
  const num = m[1].replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
  return parseFloat(num);
}

function getPriceFromItemButton(btn) {
  const item = btn.closest('.lanche-item');
  if (!item) return NaN;
  const sel = item.querySelector('.tamanho-pizza');
  if (sel && sel.selectedOptions && sel.selectedOptions.length) {
    const txt = sel.selectedOptions[0].textContent || sel.selectedOptions[0].innerText;
    const p = parsePriceFromOptionText(txt);
    if (!isNaN(p)) return p;
  }
  // fallback para data-preco do botão (quando não achar no select)
  const bp = btn.getAttribute('data-preco');
  return bp ? parseFloat(bp) : NaN;
}

function getProductNameFromButton(btn) {
  const baseName = btn.getAttribute('data-produto') || 'Produto';
  const item = btn.closest('.lanche-item');
  if (!item) return baseName;
  const sel = item.querySelector('.tamanho-pizza');
  let sizeLabel = '';
  if (sel && sel.selectedOptions && sel.selectedOptions.length) {
    const optText = sel.selectedOptions[0].textContent || sel.selectedOptions[0].innerText;
    sizeLabel = optText.split('-')[0].trim(); // pega a parte antes do '-'
  }
  const selMeio = item.querySelector('.meio-pizza');
  let meioLabel = '';
  if (selMeio && selMeio.value && selMeio.value !== 'Nenhuma') meioLabel = selMeio.value;

  let name = baseName;
  if (sizeLabel) name += ` (${sizeLabel})`;
  if (meioLabel) name += ` — Meio: ${meioLabel}`;
  return name;
}

function calcularSubtotal() {
  return carrinho.reduce((acc, it) => acc + it.preco * it.quantidade, 0);
}

function atualizarContador() {
  if (!contadorItens) return;
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  contadorItens.textContent = totalItens;
}

function atualizarListaCarrinho() {
  if (!listaCarrinho) return;
  listaCarrinho.innerHTML = '';
  carrinho.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'item-carrinho';
    li.innerHTML = `<span class="item-desc">${item.quantidade}x ${item.nome}</span>`;
    const precoSpan = document.createElement('span');
    precoSpan.className = 'item-preco';
    precoSpan.textContent = `R$ ${ (item.preco * item.quantidade).toFixed(2).replace('.', ',') }`;
    li.appendChild(precoSpan);

    // botão remover
    const btnRem = document.createElement('button');
    btnRem.type = 'button';
    btnRem.className = 'remover-item';
    btnRem.textContent = 'Remover';
    btnRem.style.marginLeft = '8px';
    btnRem.addEventListener('click', () => {
      // remove 1 unidade; se chegar a 0 remove do carrinho
      if (item.quantidade > 1) {
        item.quantidade--;
      } else {
        carrinho.splice(idx, 1);
      }
      atualizarListaCarrinho();
      atualizarContador();
      atualizarTotalDisplay();
    });
    li.appendChild(btnRem);

    listaCarrinho.appendChild(li);
  });
  atualizarTotalDisplay();
}

function atualizarTotalDisplay() {
  if (!totalDisplay) return;
  let total = calcularSubtotal();
  if (selectTipoEntrega && selectTipoEntrega.value === 'Entrega') total += TAXA_ENTREGA;
  totalDisplay.textContent = `Total: R$ ${ total.toFixed(2).replace('.', ',') }`;
}

// Adiciona item ao carrinho (ou incrementa se já existe)
function adicionarAoCarrinho(nome, preco) {
  if (isNaN(preco)) preco = 0;
  const index = carrinho.findIndex(i => i.nome === nome && i.preco === preco);
  if (index > -1) {
    carrinho[index].quantidade++;
  } else {
    carrinho.push({ nome, preco, quantidade: 1 });
  }
  atualizarContador();
  atualizarListaCarrinho();
  // manter o modal aberto se já estiver aberto
}

// --- Eventos ---
// abrir carrinho
if (btnVerCarrinho) {
  btnVerCarrinho.addEventListener('click', () => {
    atualizarListaCarrinho();
    if (modalCarrinho) modalCarrinho.classList.remove('hidden');
  });
}

// fechar carrinho
if (btnFecharCarrinho) {
  btnFecharCarrinho.addEventListener('click', () => {
    if (modalCarrinho) modalCarrinho.classList.add('hidden');
  });
}

// limpar carrinho
if (btnLimparCarrinho) {
  btnLimparCarrinho.addEventListener('click', () => {
    carrinho = [];
    atualizarListaCarrinho();
    atualizarContador();
  });
}

// alterar tipo de entrega -> mostrar campo endereço e recalcular total
if (selectTipoEntrega) {
  selectTipoEntrega.addEventListener('change', () => {
    if (campoEnderecoEl) {
      campoEnderecoEl.style.display = (selectTipoEntrega.value === 'Entrega') ? 'block' : 'none';
    }
    // garantimos sempre recalcular e sobrescrever qualquer valor que outro script tente colocar
    atualizarTotalDisplay();
  });
}

// enviar por WhatsApp
if (btnEnviarWhatsapp) {
  btnEnviarWhatsapp.addEventListener('click', () => {
    if (carrinho.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }
    const tipo = selectTipoEntrega ? selectTipoEntrega.value : '';
    const forma = selectFormaPagamento ? selectFormaPagamento.value : '';
    const trocoRaw = inputTroco ? inputTroco.value.trim() : '';
    const endereco = (campoEnderecoEl ? document.getElementById('endereco').value : '') || '';

    let trocoMsg = 'Não precisa de troco';
    if (trocoRaw && trocoRaw !== '0' && trocoRaw !== '0,00' && trocoRaw !== '0.00') {
      trocoMsg = `Precisa de troco para R$ ${trocoRaw}`;
    }

    let mensagem = 'Olá, gostaria de fazer o pedido:%0A';
    carrinho.forEach(item => {
      mensagem += `- ${item.quantidade}x ${item.nome} - R$ ${ (item.preco * item.quantidade).toFixed(2).replace('.', ',') }%0A`;
    });

    const total = calcularSubtotal() + ((selectTipoEntrega && selectTipoEntrega.value === 'Entrega') ? TAXA_ENTREGA : 0);
    mensagem += `%0ATotal: R$ ${ total.toFixed(2).replace('.', ',') }%0A`;
    mensagem += `Tipo de Pedido: ${tipo}%0A`;
    if (tipo === 'Entrega' && endereco) mensagem += `Endereço: ${encodeURIComponent(endereco)}%0A`;
    mensagem += `Forma de Pagamento: ${forma}%0A`;
    mensagem += `${trocoMsg}`;

    const numeroWhatsapp = '5511999999999'; // ajuste pro número real
    const url = `https://wa.me/${numeroWhatsapp}?text=${mensagem}`;
    window.open(url, '_blank');
  });
}

// botões de adicionar nos itens
if (botoesAdicionar && botoesAdicionar.length) {
  botoesAdicionar.forEach(btn => {
    btn.addEventListener('click', () => {
      const nome = getProductNameFromButton(btn);
      const preco = getPriceFromItemButton(btn);
      adicionarAoCarrinho(nome, preco);
    });
  });
}

// inicializa visualizações
atualizarContador();
atualizarTotalDisplay();
