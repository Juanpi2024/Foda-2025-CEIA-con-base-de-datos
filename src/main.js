// import './style.css'
// import Chart from 'chart.js/auto'
// Chart.js is now loaded via CDN in index.html for compatibility without build step

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('fodaForm');
  const steps = Array.from(document.querySelectorAll('.step:not(#successStep)'));
  const successStep = document.getElementById('successStep');
  const progressBar = document.getElementById('progressBar');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');
  const navButtons = document.getElementById('navButtons');
  const headerPara = document.getElementById('headerDescription');

  // View Elements
  const viewSurveyBtn = document.getElementById('viewSurveyBtn');
  const viewDashboardBtn = document.getElementById('viewDashboardBtn');
  const surveyView = document.getElementById('surveyView');
  const dashboardView = document.getElementById('dashboardView');
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');

  // Dashboard Elements
  const totalResponsesEl = document.getElementById('totalResponses');
  const fortalezasList = document.getElementById('fortalezasList');
  const debilidadesList = document.getElementById('debilidadesList');
  const participantesList = document.getElementById('participantesList');
  const aiReportContent = document.getElementById('aiReportContent');

  // Charts
  let sacRadarChart = null;
  let questionsBarChart = null;

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyi7t55HXAxBNdVortheg-9McJEU8kBXeSqrrlyRlqs3XfcrQ_GYbttNUEva4bCNoQxyw/exec';

  let currentStep = 0;

  // --- NAVIGATION LOGIC ---
  viewSurveyBtn.addEventListener('click', () => {
    switchView('survey');
  });

  viewDashboardBtn.addEventListener('click', () => {
    switchView('dashboard');
    loadDashboardData();
  });

  function switchView(view) {
    if (view === 'survey') {
      surveyView.classList.add('active');
      dashboardView.classList.remove('active');
      viewSurveyBtn.classList.add('active');
      viewDashboardBtn.classList.remove('active');
    } else {
      surveyView.classList.remove('active');
      dashboardView.classList.add('active');
      viewSurveyBtn.classList.remove('active');
      viewDashboardBtn.classList.add('active');
    }
  }

  // --- SURVEY LOGIC ---
  function updateSurvey() {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === currentStep);
    });

    const progress = ((currentStep + 1) / steps.length) * 100;
    progressBar.style.width = `${progress}%`;
    prevBtn.classList.toggle('hidden', currentStep === 0);

    if (currentStep === steps.length - 1) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateCurrentStep() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    const validatedNames = new Set();

    inputs.forEach(input => {
      if (validatedNames.has(input.name)) return;

      if (input.type === 'radio') {
        const checked = activeStep.querySelector(`input[name="${input.name}"]:checked`);
        if (!checked) {
          isValid = false;
          showError(input);
        }
      } else {
        if (!input.value.trim()) {
          isValid = false;
          showError(input);
        }
      }
      validatedNames.add(input.name);
    });

    return isValid;
  }

  function showError(input) {
    const question = input.closest('.question');
    question.style.borderLeft = '4px solid #ef4444';
    question.style.paddingLeft = '1rem';
    setTimeout(() => {
      question.style.borderLeft = 'none';
      question.style.paddingLeft = '0';
    }, 3000);
  }

  nextBtn.addEventListener('click', () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        currentStep++;
        updateSurvey();
      }
    } else {
      alert('Por favor, califica los puntos clave antes de continuar.');
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateSurvey();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const formData = new FormData(form);
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando a Matriz...';
    headerPara.innerText = 'Guardando datos en tiempo real...';

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(formData)
    })
      .then(() => {
        steps.forEach(s => s.classList.remove('active'));
        successStep.classList.add('active');
        navButtons.classList.add('hidden');
        progressBar.parentElement.style.display = 'none';
        headerPara.innerText = '¡Análisis 2025 Generado con Éxito!';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar. Tu conexión podría estar lenta.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Reintentar';
      });
  });

  // --- DASHBOARD LOGIC ---
  refreshStatsBtn.addEventListener('click', loadDashboardData);

  async function loadDashboardData() {
    refreshStatsBtn.disabled = true;
    refreshStatsBtn.innerHTML = '⌛ Cargando...';

    try {
      // GAS doGet returns the JSON data
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();

      if (!data || data.length === 0) {
        alert('Aún no hay respuestas suficientes para el análisis.');
        return;
      }

      totalResponsesEl.innerText = data.length;
      processStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      alert('Asegúrate de haber habilitado doGet() en tu Apps Script.');
    } finally {
      refreshStatsBtn.disabled = false;
      refreshStatsBtn.innerHTML = '🔄 Actualizar Datos';
    }
  }

  function processStats(data) {
    // 1. Average for each question (q1-q22)
    const questionAverages = {};
    for (let i = 1; i <= 22; i++) {
      const key = `q${i}`;
      const sum = data.reduce((acc, row) => acc + (parseFloat(row[key.toUpperCase()] || row[key]) || 0), 0);
      questionAverages[key] = sum / data.length;
    }

    // 2. Group by SAC Areas
    const areas = {
      'Liderazgo': (questionAverages.q1 + questionAverages.q2 + questionAverages.q3 + questionAverages.q4) / 4,
      'Curricular': (questionAverages.q5 + questionAverages.q6 + questionAverages.q7 + questionAverages.q8 + questionAverages.q9) / 5,
      'Convivencia': (questionAverages.q10 + questionAverages.q11 + questionAverages.q12 + questionAverages.q13 + questionAverages.q14) / 5,
      'Recursos': (questionAverages.q15 + questionAverages.q16 + questionAverages.q17 + questionAverages.q18) / 4,
      'Resultados': (questionAverages.q19 + questionAverages.q20 + questionAverages.q21 + questionAverages.q22) / 4
    };

    renderRadarChart(Object.keys(areas), Object.values(areas));
    renderBarChart(questionAverages);
    renderBulletPoints(questionAverages);
    renderParticipants(data);
    generateStrategicAnalysis(questionAverages, areas);
  }

  function generateStrategicAnalysis(averages, areas) {
    const lowArea = Object.entries(areas).sort((a, b) => a[1] - b[1])[0];
    const highArea = Object.entries(areas).sort((a, b) => b[1] - a[1])[0];
    const criticalQuestions = Object.entries(averages).filter(([q, v]) => v < 3);

    let reportHtml = `
      <div class="ai-section">
        <h4>🔍 Diagnóstico de Cumplimiento SAC</h4>
        <p>El área de <strong>${highArea[0]}</strong> presenta el mejor desempeño institucional con un promedio de ${highArea[1].toFixed(1)}. Sin embargo, se observa un desafío crítico en el área de <strong>${lowArea[0]}</strong> (${lowArea[1].toFixed(1)}), lo que impacta directamente en la percepción de calidad educativa.</p>
      </div>

      <div class="ai-section">
        <h4>📉 Implicancias para el Colegio</h4>
        <ul>
          ${criticalQuestions.length > 0 ?
        criticalQuestions.map(([q, v]) => `<li>La baja calificación en <strong>P${q.slice(1)}</strong> indica una brecha en la gestión de procesos que podría aumentar la deserción o el descontento de la comunidad.</li>`).join('') :
        '<li>No se detectan puntajes críticos individuales (menores a 3.0), lo que sugiere una base operativa sólida.</li>'
      }
          <li>La discrepancia entre los resultados TP y la formación general sugiere una necesidad de mayor integración andragógica.</li>
        </ul>
      </div>

      <div class="ai-section">
        <h4>🚀 Acciones de Mejora Sugeridas</h4>
        <ul>
          ${lowArea[0] === 'Liderazgo' ? '<li>Fortalecer los canales de comunicación mediante boletines de cumplimiento del Convenio ADP.</li>' : ''}
          ${lowArea[0] === 'Curricular' ? '<li>Implementar talleres de actualización tecnológica específicos para las especialidades de Electricidad y Párvulos.</li>' : ''}
          ${lowArea[0] === 'Convivencia' ? '<li>Activar protocolos de red de apoyo comunal para mitigar los riesgos del entorno (transporte/seguridad).</li>' : ''}
          ${lowArea[0] === 'Recursos' ? '<li>Realizar auditoría participativa de infraestructura para priorizar mejoras visibles con fondos Decreto 240.</li>' : ''}
          ${lowArea[0] === 'Resultados' ? '<li>Establecer un sistema de seguimiento de egresados para validar la inserción laboral efectiva en Parral.</li>' : ''}
          <li><span class="ai-action-item">Meta 2025: Cerrar la brecha en ${lowArea[0]} mediante un Plan de Acción Normativo focalizado.</span></li>
        </ul>
      </div>
    `;

    aiReportContent.innerHTML = reportHtml;
  }

  function renderParticipants(data) {
    // Get last 5 names
    const recent = [...data].reverse().slice(0, 5);
    participantesList.innerHTML = recent.map(row => {
      // Handle both "Nombre" and "nombre" keys
      const name = row.rol || row.Rol || row.nombre || row.Nombre || 'Anónimo';
      const date = new Date(row.fecha || row.Fecha).toLocaleDateString('es-CL');
      return `
        <li>
          <span>${name}</span>
          <span class="score score-mid" style="font-size: 0.7rem;">${date}</span>
        </li>
      `;
    }).join('');
  }

  function renderRadarChart(labels, values) {
    const ctx = document.getElementById('sacRadarChart');
    if (sacRadarChart) sacRadarChart.destroy();

    sacRadarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumplimiento SAC',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#6366f1',
          borderWidth: 3
        }]
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: { stepSize: 1, color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            angleLines: { color: 'rgba(255,255,255,0.1)' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  function renderBarChart(averages) {
    const ctx = document.getElementById('questionsBarChart');
    if (questionsBarChart) questionsBarChart.destroy();

    questionsBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(averages).map(k => `P${k.slice(1)}`),
        datasets: [{
          label: 'Puntaje Promedio',
          data: Object.values(averages),
          backgroundColor: Object.values(averages).map(v =>
            v > 4 ? '#22c55e' : v < 3 ? '#ef4444' : '#6366f1'
          ),
          borderRadius: 6
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 5, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  function renderBulletPoints(averages) {
    const sorted = Object.entries(averages).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);
    const bottom = [...sorted].reverse().slice(0, 5);

    fortalezasList.innerHTML = top.map(([q, score]) => `
      <li>
        <span>Pregunta ${q.slice(1)}</span>
        <span class="score score-high">${score.toFixed(1)}</span>
      </li>
    `).join('');

    debilidadesList.innerHTML = bottom.map(([q, score]) => `
      <li>
        <span>Pregunta ${q.slice(1)}</span>
        <span class="score ${score < 3 ? 'score-low' : 'score-mid'}">${score.toFixed(1)}</span>
      </li>
    `).join('');
  }

  // Initialize
  updateSurvey();
});
