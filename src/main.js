import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fodaForm');
  const steps = Array.from(document.querySelectorAll('.step:not(#successStep)'));
  const successStep = document.getElementById('successStep');
  const progressBar = document.getElementById('progressBar');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');
  const navButtons = document.getElementById('navButtons');
  const headerPara = document.querySelector('header p');

  let currentStep = 0;

  function updateSurvey() {
    // Update Steps visibility
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === currentStep);
    });

    // Update Progress Bar
    const progress = ((currentStep + 1) / steps.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Update Buttons
    prevBtn.classList.toggle('hidden', currentStep === 0);

    if (currentStep === steps.length - 1) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateCurrentStep() {
    const activeStep = steps[currentStep];
    const requiredInputs = activeStep.querySelectorAll('input[required]');

    let isValid = true;
    const groups = new Set();
    requiredInputs.forEach(input => groups.add(input.name));

    groups.forEach(name => {
      const checked = activeStep.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        isValid = false;
        // Subtle shake or visual hint could go here
        const question = activeStep.querySelector(`input[name="${name}"]`).closest('.question');
        question.style.borderLeft = '4px solid #ef4444';
        setTimeout(() => question.style.borderLeft = 'none', 2000);
      }
    });

    return isValid;
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

    // Collect data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('FODA Data for Analysis:', data);

    // UI Transition
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando a Matriz...';
    headerPara.innerText = 'Generando Matriz de Calidad Institucional...';

    setTimeout(() => {
      steps.forEach(s => s.classList.remove('active'));
      successStep.classList.add('active');
      navButtons.classList.add('hidden');
      progressBar.parentElement.style.display = 'none';
    }, 2000);
  });

  // Initialize
  updateSurvey();
});
