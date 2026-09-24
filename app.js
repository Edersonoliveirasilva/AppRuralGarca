// Função para Navegação de Abas
function mudarAba(abaId) {
    document.querySelectorAll('.aba').forEach(el => el.style.display = 'none');
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(abaId).style.display = 'block';
    document.getElementById('btn-' + abaId).classList.add('active');

    if(abaId === 'dashboard' && !window.graficoDesenhado) {
        desenharGrafico();
        window.graficoDesenhado = true;
    }
}

// Inicializar Gráfico
function desenharGrafico() {
    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    const anos = [2006, 2010, 2015, 2020, 2024, 2025, 2026];
    const salarios = [350, 510, 788, 1045, 1412, 1550, 1935];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'Salário Base (R$)',
                data: salarios,
                borderColor: '#8FBC8F',
                backgroundColor: 'rgba(143, 188, 143, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            color: '#fff',
            scales: {
                x: { ticks: { color: '#ccc' } },
                y: { ticks: { color: '#ccc' } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

// Calcular Aumento Acima do Piso (7,5%)
function calcularAumento() {
    let input = document.getElementById('salarioAtual').value;
    let base = parseFloat(input);
    
    if(!isNaN(base) && base > 0) {
        let novo = base * 1.075; // Aumento de 7.5%
        document.getElementById('novoSalario').innerText = novo.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    } else {
        document.getElementById('novoSalario').innerText = "R$ 0,00";
    }
}

// Simulador de Rescisão - Inteligência do Dissídio
function calcularRescisao() {
    const motivo = document.getElementById('motivoSaida').value;
    const dataDemissao = document.getElementById('dataDemissao').value;
    let salario = parseFloat(document.getElementById('salarioBaseRescisao').value);

    if(!dataDemissao || isNaN(salario)) {
        alert("Preencha a data de demissão e o salário!");
        return;
    }

    let direitos = [];
    let total = 0;
    
    // Simulação Básica: Saldo de salário (exemplo fixo de 15 dias) e Férias/13º.
    // Em um app real, calcularíamos exato pela diferença de datas.
    let saldoSalario = (salario / 30) * 15;
    direitos.push(`<li><span>Saldo Salário (15d):</span> <span>R$ ${saldoSalario.toFixed(2)}</span></li>`);
    total += saldoSalario;

    if (motivo === 'sem_justa_causa') {
        let aviso = salario + (salario/30 * 3); // Simulação de aviso
        direitos.push(`<li><span>Aviso Prévio Indenizado:</span> <span>R$ ${aviso.toFixed(2)}</span></li>`);
        total += aviso;
    }

    // A MÁGICA DA MULTA DO DISSÍDIO (Art. 9º)
    // O Dissídio rural é em Outubro (Mês 10). A demissão em Setembro (Mês 9) gera multa.
    const mesDemissao = new Date(dataDemissao).getMonth() + 1; // JS meses são de 0 a 11
    
    document.getElementById('alertaDissidio').style.display = 'none';

    if (motivo === 'sem_justa_causa' && mesDemissao === 9) { // 9 = Setembro
        direitos.push(`<li style="color:red; font-weight:bold;"><span>Multa Dissídio (Art 9º):</span> <span>R$ ${salario.toFixed(2)}</span></li>`);
        total += salario;
        document.getElementById('alertaDissidio').style.display = 'block';
    }

    document.getElementById('listaDireitos').innerHTML = direitos.join('');
    document.getElementById('totalRescisao').innerText = total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    document.getElementById('resultadoRescisao').style.display = 'block';
}

// Disparar gráfico inicial
window.onload = () => { mudarAba('dashboard'); };