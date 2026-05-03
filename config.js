// ══════════════════════════════════════════
// RANGLOOP — Configuration File
// ══════════════════════════════════════════

// STEP 1: Supabase
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

// STEP 2: Razorpay
const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE';

// STEP 3: EmailJS — TWO separate templates
const EMAILJS_SERVICE_ID    = 'service_xuis7tm';   // ← your service ID
const EMAILJS_TEMPLATE_OTP  = 'template_r5oydik';  // ← OTP template
const EMAILJS_TEMPLATE_ORDER= 'template_wbd0buw';  // ← Order confirmation template
const EMAILJS_PUBLIC_KEY    = 'YOUR_PUBLIC_KEY';    // ← paste your public key here

// STEP 4: Fast2SMS (SMS OTP - India)
const FAST2SMS_API_KEY = 'YOUR_FAST2SMS_KEY';

// Initialize EmailJS immediately
if(typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}
