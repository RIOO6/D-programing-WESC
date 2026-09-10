const SUPABASE_URL = 'https://jopkvmozlubszpddkobj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoImpvcGt2bW96bHVic3pwZGRrb2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTU2MzIsImV4cCI6MjEwMzM3MTYzMn0.mzDjqkTRzDS0jwT5v-IR6Okt4PsHc33Ua4xu-grgTVU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector('.detail-form');
const status = document.querySelector('.form-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const applicant = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim().toLowerCase(),
    phone: formData.get('phone').trim(),
    course: formData.get('course').trim()
  };

  if (applicant.name.length < 2 || applicant.phone.length < 7) {
    status.textContent = 'Please enter a valid name and phone number.';
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
      console.error('Application submission failed:', error);
      status.textContent = error.code === 'PGRST205'
        ? 'The applications table is not set up yet. Run database.sql in Supabase SQL Editor.'
        : `Application failed: ${error.message}`;
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