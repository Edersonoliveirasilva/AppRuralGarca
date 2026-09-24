let graficoInstancia = null;

// ==========================================
// NAVEGAÇÃO E INICIALIZAÇÃO
// ==========================================
function mudarAba(abaId) {
    document.querySelectorAll('.aba').forEach(el => el.style.display = 'none');
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(abaId).style.display = 'block';
    document.getElementById('btn-' + abaId).classList.add('active');

    if(abaId === 'salario') { calcularSalarioCompleto(); }
    if(abaId === 'dashboard') { desenharGrafico(); }
}

// ==========================================
// BUSCA AUTOMÁTICA (API DO BANCO CENTRAL DO BRASIL)
// ==========================================
async function buscarSalarioMinimoGov() {
    const inputSalario = document.getElementById('salarioMinimo');
    try {
        // Conecta na API oficial do Governo (SGS - Banco Central, Série 1619 - Salário Mínimo)
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json');
        const data = await response.json();
        
        if (data && data.length > 0) {
            const valorOficial = parseFloat(data[0].valor);
            inputSalario.value = valorOficial.toFixed(2); // Atualiza o campo com o valor oficial
        }
    } catch (error) {
        console.error("Erro ao buscar no Banco Central:", error);
        // Fallback de segurança: se o site do governo cair, ele mantém o valor base
        inputSalario.value = "1412.00"; 
    }
    // Após buscar, ele recalcula a tabela da insalubridade
    calcularSalarioCompleto();
}

window.onload = () => { 
    mudarAba('dashboard'); 
    buscarSalarioMinimoGov(); // Chama o robô da API assim que o app carrega
};

// ==========================================
// GRÁFICO (Chart.js)
// ==========================================
function desenharGrafico() {
    const ctx = document.getElementById('graficoEvolucao');
    if(!ctx) return;
    
    if(graficoInstancia) { graficoInstancia.destroy(); }

    const anos = [2006, 2010, 2015, 2020, 2024, 2025, 2026];
    const salarios = [350, 510, 788, 1045, 1412, 1550, 1935];

    graficoInstancia = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: anos,
            datasets: [{
                label: 'Salário Base Rural (R$)',
                data: salarios,
                backgroundColor: '#8FBC8F',
                borderColor: '#2E5939',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            color: '#fff',
            scales: {
                x: { ticks: { color: '#ccc' } },
                y: { ticks: { color: '#ccc' } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

// ==========================================
// MÓDULO 1: CÁLCULO DE SALÁRIO
// ==========================================
const formatar = (valor) => valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

function calcularAcimaPiso() {
    let input = document.getElementById('salarioAcimaPiso').value;
    let base = parseFloat(input);
    let el = document.getElementById('resultadoAcimaPiso');
    
    if(!isNaN(base) && base > 0) {
        let novo = base * 1.075;
        el.innerText = `Novo Salário (+7,5%): ${formatar(novo)}`;
        el.style.display = 'block';
    }
}

function calcularSalarioCompleto() {
    const piso = parseFloat(document.getElementById('salarioPiso').value) || 1935;
    const minVigente = parseFloat(document.getElementById('salarioMinimo').value) || 1412;
    const temInsal = document.getElementById('temInsalubridade').checked;

    const diaria = piso / 30;
    const horaNormal = piso / 220;
    const horaExtra50 = horaNormal * 1.5;
    const horaExtra100 = horaNormal * 2.0;
    const decimoTerceiro = piso / 12;
    const umTercoFerias = piso / 3;
    const feriasProp = (piso / 12) + ((piso / 12) / 3);
    const insalubridade = temInsal ? (minVigente * 0.20) : 0;
    const salFamilia = 65.00;

    const linhas = `
        <tr><th>Descrição</th><th>Valor (R$)</th></tr>
        <tr><td>SALÁRIO BRUTO</td><td>${formatar(piso)}</td></tr>
        <tr><td>DIÁRIA BRUTA</td><td>${formatar(diaria)}</td></tr>
        <tr><td>HORA NORMAL</td><td>${formatar(horaNormal)}</td></tr>
        <tr><td>HORA EXTRA (H.Normal + 50%)</td><td>${formatar(horaExtra50)}</td></tr>
        <tr><td>HORA EXTRA (100%)</td><td>${formatar(horaExtra100)}</td></tr>
        <tr><td>13º SALÁRIO PROPORCIONAL (1 mês)</td><td>${formatar(decimoTerceiro)}</td></tr>
        <tr><td>FÉRIAS INTEGRAIS</td><td>${formatar(piso)}</td></tr>
        <tr><td>1/3 das FÉRIAS</td><td>${formatar(umTercoFerias)}</td></tr>
        <tr><td>FÉRIAS PROP. + 1/3 (1 mês)</td><td>${formatar(feriasProp)}</td></tr>
        <tr><td>Salário Família</td><td>${formatar(salFamilia)}</td></tr>
        <tr style="background:#f9f9f9;"><td>ADICIONAL INSALUBRIDADE 20% (Base Mínimo: ${formatar(minVigente)})</td>
        <td style="color:${temInsal ? '#D93025' : '#000'}">${formatar(insalubridade)}</td></tr>
    `;
    document.getElementById('tabelaSalario').innerHTML = linhas;
}

// ==========================================
// MÓDULO 2: SIMULADOR DE RESCISÃO COMPLETA
// ==========================================
function verificarJustaCausa() {
    const motivo = document.getElementById('motivoSaidaRescisao').value;
    if(motivo === 'justa_causa') {
        alert("Na Justa Causa, o trabalhador perde direito a Férias Proporcionais, 13º Proporcional, Aviso Prévio e Saque/Multa do FGTS.");
    }
}

function calcularRescisaoCompleta() {
    const status = document.getElementById('statusRegistro').value;
    const motivo = document.getElementById('motivoSaidaRescisao').value;
    const dataAdm = new Date(document.getElementById('dataAdmissao').value);
    const dataDem = new Date(document.getElementById('dataDemissao').value);
    const salarioBase = parseFloat(document.getElementById('salarioBaseRescisao').value);
    const temInsal = document.getElementById('insalubridadeRescisao').checked;
    const qtdFeriasVencidas = parseInt(document.getElementById('feriasVencidas').value);

    if(isNaN(dataAdm.getTime()) || isNaN(dataDem.getTime()) || isNaN(salarioBase)) {
        alert("Preencha as datas de Admissão, Demissão e o Salário Base.");
        return;
    }
    if(dataDem <= dataAdm) {
        alert("A data de demissão deve ser maior que a de admissão.");
        return;
    }

    const salarioCalculo = salarioBase + (temInsal ? (parseFloat(document.getElementById('salarioMinimo').value) * 0.20) : 0);
    const diasTrabalhadosTotal = Math.floor((dataDem - dataAdm) / (1000 * 60 * 60 * 24));
    const mesesTrabalhadosTotal = diasTrabalhadosTotal / 30;
    const anosCompletos = Math.floor(diasTrabalhadosTotal / 365);
    
    const mesDemissao = dataDem.getMonth() + 1; 
    const diasMesDemissao = dataDem.getDate();
    const mesesPara13 = dataDem.getMonth(); 

    let direitos = [];
    let totalLiquido = 0;

    let saldoSalario = (salarioCalculo / 30) * diasMesDemissao;
    direitos.push(`<li><span>Saldo de Salário (${diasMesDemissao} dias)</span> <span>${formatar(saldoSalario)}</span></li>`);
    totalLiquido += saldoSalario;

    if(qtdFeriasVencidas > 0) {
        let feriasVencValor = (salarioCalculo + (salarioCalculo / 3)) * qtdFeriasVencidas;
        direitos.push(`<li><span>Férias Vencidas + 1/3 (${qtdFeriasVencidas} ref.)</span> <span>${formatar(feriasVencValor)}</span></li>`);
        totalLiquido += feriasVencValor;
    }

    if(motivo !== 'justa_causa') {
        let mesesProporcionais = (diasMesDemissao >= 15) ? (mesesPara13 + 1) : mesesPara13;
        
        let decimoTerceiro = (salarioCalculo / 12) * mesesProporcionais;
        direitos.push(`<li><span>13º Proporcional (${mesesProporcionais}/12)</span> <span>${formatar(decimoTerceiro)}</span></li>`);
        totalLiquido += decimoTerceiro;

        let feriasProp = (salarioCalculo / 12) * mesesProporcionais;
        let tercoFeriasProp = feriasProp / 3;
        direitos.push(`<li><span>Férias Proporcionais + 1/3</span> <span>${formatar(feriasProp + tercoFeriasProp)}</span></li>`);
        totalLiquido += (feriasProp + tercoFeriasProp);
    }

    document.getElementById('alertaDissidio').style.display = 'none';

    if(motivo === 'sem_justa_causa') {
        let diasAviso = 30 + (anosCompletos * 3);
        if(diasAviso > 90) diasAviso = 90;
        let valorAviso = (salarioCalculo / 30) * diasAviso;
        direitos.push(`<li><span>Aviso Prévio Indenizado (${diasAviso} dias)</span> <span>${formatar(valorAviso)}</span></li>`);
        totalLiquido += valorAviso;

        if(mesDemissao === 9) {
            let multaDissidio = salarioCalculo;
            direitos.push(`<li style="color:#D93025; font-weight:bold;"><span>Multa Dissídio (Art 9º)</span> <span>${formatar(multaDissidio)}</span></li>`);
            totalLiquido += multaDissidio;
            document.getElementById('alertaDissidio').style.display = 'block';
        }
    }

    let saldoEstimadoFGTS = (salarioCalculo * 0.08) * mesesTrabalhadosTotal;
    let multaFGTS = 0;
    
    document.getElementById('valorSaldoFGTS').innerText = formatar(saldoEstimadoFGTS);
    
    if(motivo === 'sem_justa_causa') {
        multaFGTS = saldoEstimadoFGTS * 0.40; 
        document.getElementById('valorMultaFGTS').innerText = formatar(multaFGTS);
        document.getElementById('linhaMultaFGTS').style.display = 'block';
        totalLiquido += multaFGTS; 
    } else {
        document.getElementById('linhaMultaFGTS').style.display = 'none';
    }

    document.getElementById('listaDireitosRescisao').innerHTML = direitos.join('');
    document.getElementById('totalRescisao').innerText = formatar(totalLiquido);
    
    document.getElementById('resultadoRescisao').style.display = 'block';
    document.getElementById('btnImprimirRescisao').style.display = 'block';
}