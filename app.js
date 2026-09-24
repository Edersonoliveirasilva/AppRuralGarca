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
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json');
        const data = await response.json();
        
        if (data && data.length > 0) {
            let valorAPI = String(data[0].valor);
            
            // Segurança: Se a API mandar formato BR "1.621,00", limpa os pontos e troca vírgula por ponto
            if (valorAPI.includes(',')) {
                valorAPI = valorAPI.replace(/\./g, '').replace(',', '.');
            }
            
            const valorOficial = parseFloat(valorAPI);
            
            // Trava de segurança para garantir que é um valor real de salário
            if (!isNaN(valorOficial) && valorOficial > 1000 && valorOficial < 10000) {
                inputSalario.value = valorOficial.toFixed(2);
            } else {
                inputSalario.value = "1621.00"; // Fallback oficial de 2026
            }
        }
    } catch (error) {
        console.error("Erro ao buscar na API do Banco Central:", error);
        inputSalario.value = "1621.00"; // Se estiver sem internet, assume 2026
    }
    
    // Assim que descobrir o valor mínimo, recalcula toda a tabela
    calcularSalarioCompleto();
}

window.onload = () => { 
    mudarAba('dashboard'); 
    buscarSalarioMinimoGov(); 
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
    let inputStr = document.getElementById('salarioAcimaPiso').value;
    
    // Limpeza rigorosa: remove "R$", espaços, e trata virgula/ponto
    inputStr = inputStr.replace(/[^0-9,.]/g, '');
    
    // Se o usuário digitou com vírgula (ex: 3000,00), converte para o padrão do código
    if (inputStr.includes(',')) {
        inputStr = inputStr.replace(/\./g, '').replace(',', '.');
    }
    
    let base = parseFloat(inputStr);
    let el = document.getElementById('resultadoAcimaPiso');
    
    if(!isNaN(base) && base > 0) {
        let novo = base * 1.075; // Aumento de 7,5%
        el.innerText = `Novo Salário (+7,5%): ${formatar(novo)}`;
        el.style.display = 'block';
        
        // Manda o novo valor para a base de cálculo e atualiza a tabela inteira
        document.getElementById('salarioPiso').value = novo.toFixed(2);
        calcularSalarioCompleto();
    }
}

function calcularSalarioCompleto() {
    // 1. Pegando e limpando o valor do Piso
    let pisoStr = document.getElementById('salarioPiso').value;
    if (pisoStr.includes(',')) pisoStr = pisoStr.replace(/\./g, '').replace(',', '.');
    const piso = parseFloat(pisoStr) || 1935.00;

    // 2. Pegando e limpando o valor do Salário Mínimo
    let minStr = document.getElementById('salarioMinimo').value;
    if (minStr.includes(',')) minStr = minStr.replace(/\./g, '').replace(',', '.');
    const minVigente = parseFloat(minStr) || 1621.00;
    
    // 3. Verificando o Checkbox da Insalubridade
    const temInsal = document.getElementById('temInsalubridade').checked;

    // Regras matemáticas Trabalhistas
    const diaria = piso / 30;
    const horaNormal = piso / 220;
    const horaExtra50 = horaNormal * 1.5;
    const horaExtra100 = horaNormal * 2.0;
    const decimoTerceiro = piso / 12;
    const umTercoFerias = piso / 3;
    const feriasProp = (piso / 12) + ((piso / 12) / 3);
    const insalubridade = temInsal ? (minVigente * 0.20) : 0;
    const salFamilia = 65.00;

    // Construção da Tabela na tela
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
        <tr style="background:#f9f9f9;">
            <td>ADICIONAL INSALUBRIDADE 20% (Base Mínimo: ${formatar(minVigente)})</td>
            <td style="color:${temInsal ? '#D93025' : '#000'}; font-weight:bold;">${formatar(insalubridade)}</td>
        </tr>
    `;
    document.getElementById('tabelaSalario').innerHTML = linhas;
}

// ==========================================
// MÓDULO 2: SIMULADOR DE RESCISÃO COMPLETA
// ==========================================
function verificarJustaCausa() {
    const motivo = document.getElementById('motivoSaidaRescisao').value;
    if(motivo === 'justa_causa') {
        alert("Atenção: Na Demissão por Justa Causa, o trabalhador perde o direito a Férias Proporcionais, 13º Proporcional, Aviso Prévio, Saque do FGTS e Multa de 40%.");
    }
}

function calcularRescisaoCompleta() {
    const status = document.getElementById('statusRegistro').value;
    const motivo = document.getElementById('motivoSaidaRescisao').value;
    const dataAdm = new Date(document.getElementById('dataAdmissao').value);
    const dataDem = new Date(document.getElementById('dataDemissao').value);
    
    // Tratamento rigoroso do Salario Base Rescisão
    let salBaseStr = document.getElementById('salarioBaseRescisao').value;
    if (salBaseStr.includes(',')) salBaseStr = salBaseStr.replace(/\./g, '').replace(',', '.');
    const salarioBase = parseFloat(salBaseStr);
    
    const temInsal = document.getElementById('insalubridadeRescisao').checked;
    const qtdFeriasVencidas = parseInt(document.getElementById('feriasVencidas').value);

    // Validações
    if(isNaN(dataAdm.getTime()) || isNaN(dataDem.getTime()) || isNaN(salarioBase)) {
        alert("Preencha corretamente as datas de Admissão, Demissão e o Salário Base.");
        return;
    }
    if(dataDem <= dataAdm) {
        alert("Erro: A data de demissão não pode ser menor ou igual à data de admissão.");
        return;
    }

    // Calcula Base Remuneratória (Salário + Insalubridade se houver)
    let minStr = document.getElementById('salarioMinimo').value;
    if (minStr.includes(',')) minStr = minStr.replace(/\./g, '').replace(',', '.');
    const minVigente = parseFloat(minStr) || 1621.00;
    
    const salarioCalculo = salarioBase + (temInsal ? (minVigente * 0.20) : 0);
    
    // Matemáticas de tempo
    const diasTrabalhadosTotal = Math.floor((dataDem - dataAdm) / (1000 * 60 * 60 * 24));
    const mesesTrabalhadosTotal = diasTrabalhadosTotal / 30;
    const anosCompletos = Math.floor(diasTrabalhadosTotal / 365);
    
    const mesDemissao = dataDem.getMonth() + 1; 
    const diasMesDemissao = dataDem.getDate();
    const mesesPara13 = dataDem.getMonth(); 

    let direitos = [];
    let totalLiquido = 0;

    // 1. Saldo de Salário
    let saldoSalario = (salarioCalculo / 30) * diasMesDemissao;
    direitos.push(`<li><span>Saldo de Salário (${diasMesDemissao} dias)</span> <span>${formatar(saldoSalario)}</span></li>`);
    totalLiquido += saldoSalario;

    // 2. Férias Vencidas
    if(qtdFeriasVencidas > 0) {
        let feriasVencValor = (salarioCalculo + (salarioCalculo / 3)) * qtdFeriasVencidas;
        direitos.push(`<li><span>Férias Vencidas + 1/3 (${qtdFeriasVencidas} ref.)</span> <span>${formatar(feriasVencValor)}</span></li>`);
        totalLiquido += feriasVencValor;
    }

    // 3. Proporcionais (Não entram em Justa Causa)
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

    // 4. Direitos específicos de "Sem Justa Causa"
    if(motivo === 'sem_justa_causa') {
        // Aviso Prévio (30 dias base + 3 por ano trabalhado, limitado a 90)
        let diasAviso = 30 + (anosCompletos * 3);
        if(diasAviso > 90) diasAviso = 90;
        let valorAviso = (salarioCalculo / 30) * diasAviso;
        direitos.push(`<li><span>Aviso Prévio Indenizado (${diasAviso} dias)</span> <span>${formatar(valorAviso)}</span></li>`);
        totalLiquido += valorAviso;

        // MULTA DO DISSÍDIO (Demissão em Setembro - Mês 9)
        if(mesDemissao === 9) {
            let multaDissidio = salarioCalculo;
            direitos.push(`<li style="color:#D93025; font-weight:bold;"><span>Multa Dissídio (Art 9º)</span> <span>${formatar(multaDissidio)}</span></li>`);
            totalLiquido += multaDissidio;
            document.getElementById('alertaDissidio').style.display = 'block';
        }
    }

    // 5. FGTS Estimativa
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

    // Print final na tela
    document.getElementById('listaDireitosRescisao').innerHTML = direitos.join('');
    document.getElementById('totalRescisao').innerText = formatar(totalLiquido);
    
    document.getElementById('resultadoRescisao').style.display = 'block';
    document.getElementById('btnImprimirRescisao').style.display = 'block';
}