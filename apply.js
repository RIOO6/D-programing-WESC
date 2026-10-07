const SUPABASE_URL = 'https://pptpbtzrqkgjulidtzch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHBidHpycWtnanVsaWR0emNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTU1MTQsImV4cCI6MjEwNjkzMTUxNH0.fWrjtQ27wwnrsZCzRnLJ55El9Rjt1GIloG2RPGw_OcI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.querySelector('.detail-form');
const status = document.querySelector('.form-status');
const honeypot = document.createElement('input');
honeypot.type = 'text';
honeypot.name = 'website';
honeypot.tabIndex = -1;
honeypot.autocomplete = 'off';
honeypot.setAttribute('aria-hidden', 'true');
honeypot.className = 'form-trap';
form.prepend(honeypot);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  if (String(formData.get('website') || '').trim()) {
    form.reset();
    return;
  }

  const applicant = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim().toLowerCase(),
    phone: String(formData.get('phone') || '').trim(),
    course: String(formData.get('course') || '').trim()
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (applicant.name.length < 2 || applicant.name.length > 120 ||
      !emailPattern.test(applicant.email) || applicant.email.length > 254 ||
      applicant.phone.length < 7 || applicant.phone.length > 40 ||
      applicant.course.length < 2 || applicant.course.length > 160) {
    status.textContent = 'Please check your name, email, phone number, and course.';
    status.className = 'form-status error';
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending application...';
  status.textContent = '';
  status.className = 'form-status';

  try {
    const { error } = await supabaseClient.from('applications').insert([applicant]);

    if (error) {
      console.error('Application submission failed:', error.code, error.message);
      status.textContent = error.code === 'PGRST205'
        ? 'Applications are temporarily unavailable. Please contact the training center.'
        : 'Application could not be submitted. Please try again later.';
      status.classList.add('error');
    } else {
      status.textContent = 'Application received. Our team will contact you soon.';
      status.classList.add('success');
      form.reset();
    }
  } catch (submissionError) {
    console.error('Application submission error:', submissionError);
    status.textContent = 'Could not reach the database. Check your connection and try again.';
    status.classList.add('error');
  }

  /* Reset the form control even when Supabase returns an error. */
  submitButton.disabled = false;
  submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit application';
});