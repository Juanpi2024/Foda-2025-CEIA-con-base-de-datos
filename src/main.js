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

    // UI Transition - Loading state
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Enviando a Matriz...';
    headerPara.innerText = 'Generando Matriz de Calidad Institucional...';

    // SEND DATA TO GOOGLE SHEETS
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyi7t55HXAxBNdVortheg-9McJEU8kBXeSqrrlyRlqs3XfcrQ_GYbttNUEva4bCNoQxyw/exec';

    // Using fetch with no-cors or handling the redirect if necessary. 
    // Usually, Google Apps Script requires a simple POST.
    fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors', // Essential for Google Apps Script cross-origin
      body: new URLSearchParams(formData)
    })
      .then(() => {
        // Show success UI
        steps.forEach(s => s.classList.remove('active'));
        successStep.classList.add('active');
        navButtons.classList.add('hidden');
        progressBar.parentElement.style.display = 'none';
        headerPara.innerText = '¡Análisis 2024 Generado con Éxito!';
      })
      .catch(error => {
        console.error('Error al enviar:', error);
        alert('Hubo un error al guardar los datos. Por favor, intenta de nuevo.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      });
  });

  // Initialize
  updateSurvey();
});
