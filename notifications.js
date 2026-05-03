// ═══════════════════════════════════════════
// OTP VERIFICATION SYSTEM
// ═══════════════════════════════════════════
let otpGenerated     = '';
let otpTimerInterval = null;
let otpVerified      = false;
let otpMethod        = 'mobile';
let otpContact       = '';

function startCheckout() {
  if(cart.length === 0){ showToast('❌ Your cart is empty'); return; }
  if(otpVerified){ toggleCO(); return; }
  resetOTPModal();
  openModal('otp');
}

function resetOTPModal() {
  showOTPStep(1);
  otpMethod = 'mobile';
  const mTab = document.getElementById('otpMobileTab');
  const eTab = document.getElementById('otpEmailTab');
  const mFld = document.getElementById('otpMobileFields');
  const eFld = document.getElementById('otpEmailFields');
  if(mTab) mTab.classList.add('active');
  if(eTab) eTab.classList.remove('active');
  if(mFld) mFld.style.display = 'block';
  if(eFld) eFld.style.display = 'none';
  const ph = document.getElementById('otpPhone');
  const em = document.getElementById('otpEmailInput');
  if(ph) ph.value = '';
  if(em) em.value = '';
  clearOTPBoxes();
}

function switchOTPMethod(method) {
  otpMethod = method;
  document.getElementById('otpMobileTab').classList.toggle('active', method==='mobile');
  document.getElementById('otpEmailTab').classList.toggle('active',  method==='email');
  document.getElementById('otpMobileFields').style.display = method==='mobile'?'block':'none';
  document.getElementById('otpEmailFields').style.display  = method==='email' ?'block':'none';
}

function showOTPStep(step) {
  [1,2,3].forEach(n => {
    const el = document.getElementById('otpStep'+n);
    if(el) el.style.display = step===n ? 'block':'none';
  });
}

function otpBoxInput(el, index) {
  el.value = el.value.replace(/\D/g,'');
  el.classList.toggle('filled', el.value !== '');
  if(el.value && index < 5) document.querySelectorAll('.otp-box')[index+1].focus();
  if(getOTPBoxValue().length === 6) verifyOTP();
}

function otpBoxKey(el, index, e) {
  if(e.key==='Backspace' && !el.value && index > 0)
    document.querySelectorAll('.otp-box')[index-1].focus();
}

function getOTPBoxValue() {
  return Array.from(document.querySelectorAll('.otp-box')).map(b=>b.value).join('');
}

function clearOTPBoxes() {
  document.querySelectorAll('.otp-box').forEach(b=>{
    b.value=''; b.classList.remove('filled'); b.style.borderColor='';
  });
}

async function sendOTP() {
  otpGenerated = Math.floor(100000 + Math.random()*900000).toString();

  if(otpMethod === 'mobile') {
    const phone = document.getElementById('otpPhone').value.trim();
    const code  = document.getElementById('otpCountryCode').value;
    const errEl = document.getElementById('otpPhoneError');
    if(phone.replace(/\D/g,'').length < 10){ errEl.style.display='block'; return; }
    errEl.style.display = 'none';
    otpContact = code+' '+phone;
    showToast('Sending OTP...');
    const sent = await sendSMSOTP(code+phone.replace(/\D/g,''), otpGenerated);
    if(sent || FAST2SMS_API_KEY.includes('YOUR_FAST2SMS_KEY')) {
      if(FAST2SMS_API_KEY.includes('YOUR_FAST2SMS_KEY')) {
        console.log('🔐 TEST OTP (mobile):', otpGenerated);
        showToast('📱 Test OTP: '+otpGenerated+' — check console (F12)');
      } else {
        showToast('✓ OTP sent to '+otpContact);
      }
      document.getElementById('otpSentMsg').textContent = 'OTP sent to '+otpContact;
      goToOTPStep2();
    } else {
      showToast('❌ SMS failed. Try Email OTP instead.');
    }

  } else {
    const email = document.getElementById('otpEmailInput').value.trim();
    const errEl = document.getElementById('otpEmailError');
    if(!email || !email.includes('@')){ errEl.style.display='block'; return; }
    errEl.style.display = 'none';
    otpContact = email;
    showToast('Sending OTP to email...');
    const sent = await sendEmailOTP(email, otpGenerated);
    if(sent || EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) {
      if(EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) {
        console.log('🔐 TEST OTP (email):', otpGenerated);
        showToast('📧 Test OTP: '+otpGenerated+' — check console (F12)');
      } else {
        showToast('✓ OTP sent to '+email);
      }
      document.getElementById('otpSentMsg').textContent = 'OTP sent to '+email;
      goToOTPStep2();
    } else {
      showToast('❌ Email OTP failed. Try mobile instead.');
    }
  }
}

function goToOTPStep2() {
  showOTPStep(2);
  clearOTPBoxes();
  const errEl = document.getElementById('otpError');
  if(errEl) errEl.style.display = 'none';
  const timerEl = document.getElementById('otpTimer');
  if(timerEl) timerEl.style.color = 'var(--accent)';
  startOTPTimer(60);
  setTimeout(()=>{ const b=document.querySelectorAll('.otp-box')[0]; if(b) b.focus(); }, 100);
}

async function sendSMSOTP(fullPhone, otp) {
  if(FAST2SMS_API_KEY.includes('YOUR_FAST2SMS_KEY')) return false;
  try {
    const res = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${fullPhone.replace(/\+91/,'')}`,
      {method:'GET', headers:{'cache-control':'no-cache'}}
    );
    const data = await res.json();
    return data.return === true;
  } catch(e){ console.warn('SMS OTP error:',e); return false; }
}

// ── Email OTP — uses EMAILJS_TEMPLATE_OTP template ────────────────────────
// Your template variables: {{email}}, {{passcode}}, {{time}}
async function sendEmailOTP(email, otp) {
  if(EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) return false;
  if(typeof emailjs === 'undefined'){ console.warn('EmailJS not loaded'); return false; }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_OTP, {
      email:    email,        // {{email}} — recipient
      passcode: otp,          // {{passcode}} — the OTP code
      time:     '10 minutes', // {{time}} — validity
    });
    console.log('📧 OTP email sent to:', email);
    return true;
  } catch(e){
    console.warn('Email OTP error:', e);
    return false;
  }
}

function startOTPTimer(seconds) {
  clearInterval(otpTimerInterval);
  let rem = seconds;
  const timerEl = document.getElementById('otpTimer');
  if(!timerEl) return;
  timerEl.textContent = rem+'s';
  otpTimerInterval = setInterval(()=>{
    rem--;
    timerEl.textContent = rem+'s';
    if(rem <= 0){
      clearInterval(otpTimerInterval);
      timerEl.textContent = 'Expired';
      timerEl.style.color = '#c0392b';
    }
  }, 1000);
}

function verifyOTP() {
  const entered = getOTPBoxValue();
  if(entered.length < 6){ showToast('❌ Enter all 6 digits'); return; }
  if(entered === otpGenerated) {
    clearInterval(otpTimerInterval);
    const errEl = document.getElementById('otpError');
    if(errEl) errEl.style.display = 'none';
    showOTPStep(3);
    otpVerified = true;
    showToast('✅ Verified! Opening checkout...');
    setTimeout(()=>{ closeModal('otp'); toggleCO(); }, 1500);
  } else {
    const errEl = document.getElementById('otpError');
    if(errEl) errEl.style.display = 'block';
    document.querySelectorAll('.otp-box').forEach(b=>{
      b.style.borderColor='#c0392b';
      b.style.animation='shake .3s ease';
      setTimeout(()=>{ b.style.borderColor=''; b.style.animation=''; }, 400);
    });
    clearOTPBoxes();
    setTimeout(()=>{ const b=document.querySelectorAll('.otp-box')[0]; if(b) b.focus(); }, 100);
  }
}

async function resendOTP() {
  const timerEl = document.getElementById('otpTimer');
  if(timerEl && timerEl.textContent!=='Expired' && timerEl.textContent!=='0s'){
    showToast('⚠️ Wait for timer to expire'); return;
  }
  otpGenerated = Math.floor(100000 + Math.random()*900000).toString();
  if(otpMethod==='mobile') {
    const phone = document.getElementById('otpPhone').value.trim();
    const code  = document.getElementById('otpCountryCode').value;
    await sendSMSOTP(code+phone.replace(/\D/g,''), otpGenerated);
  } else {
    const email = document.getElementById('otpEmailInput').value.trim();
    await sendEmailOTP(email, otpGenerated);
  }
  console.log('🔐 Resent OTP:', otpGenerated);
  showToast('✓ OTP resent to '+otpContact);
  clearOTPBoxes();
  if(timerEl) timerEl.style.color='var(--accent)';
  startOTPTimer(60);
  setTimeout(()=>{ const b=document.querySelectorAll('.otp-box')[0]; if(b) b.focus(); }, 100);
}

// ═══════════════════════════════════════════
// EMAIL NOTIFICATIONS — Order Confirmation
// Uses EMAILJS_TEMPLATE_ORDER template
// ═══════════════════════════════════════════
function initEmailJS() {
  if(typeof emailjs !== 'undefined' && !EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
  }
}

async function sendOrderConfirmationEmail(orderData) {
  if(EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) {
    console.log('📧 [TEST] Order email would go to:', orderData.user_email);
    return;
  }
  if(typeof emailjs === 'undefined'){ console.warn('EmailJS not loaded'); return; }

  const itemsList = (orderData.items||[]).map(i=>
    `${i.qty}x ${i.name} (${i.size||'S'}) — ₹${(i.price*i.qty).toFixed(2)}`
  ).join('\n');

  const shipping = orderData.shipping_address || {};

  try {
    // Uses your order confirmation template variables
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ORDER, {
      to_email:       orderData.user_email,
      to_name:        shipping.name || 'Customer',
      order_id:       String(orderData.order_id || 'N/A'),
      order_items:    itemsList,
      order_total:    '₹' + Number(orderData.total||0).toFixed(2),
      payment_method: orderData.payment_method || 'N/A',
      order_status:   orderData.payment_method==='COD'
                        ? 'Confirmed — Pay on Delivery'
                        : '✅ Payment Received',
      shipping_addr:  `${shipping.address||''}, ${shipping.city||''}, ${shipping.postal||''}, ${shipping.country||''}`,
      payment_id:     orderData.payment_id || 'N/A',
      shop_name:      'RANGLOOP',
      shop_email:     'hello@rangloop.com',
    });
    console.log('📧 Order confirmation email sent to:', orderData.user_email);
  } catch(err){
    console.warn('📧 Order email failed:', err);
  }
}

// ═══════════════════════════════════════════
// ORDER CANCELLATION EMAIL
// ═══════════════════════════════════════════
async function sendCancellationEmail(orderData) {
  if(EMAILJS_PUBLIC_KEY.includes('YOUR_PUBLIC_KEY')) {
    console.log('📧 [TEST] Cancellation email would go to:', orderData.user_email);
    return;
  }
  if(typeof emailjs === 'undefined') return;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ORDER, {
      to_email:       orderData.user_email,
      to_name:        orderData.name || 'Customer',
      order_id:       String(orderData.order_id),
      order_items:    'Your order has been cancelled',
      order_total:    '₹' + Number(orderData.total||0).toFixed(2),
      payment_method: orderData.payment_method || 'N/A',
      order_status:   '❌ Order Cancelled',
      shipping_addr:  'N/A',
      payment_id:     'N/A',
      shop_name:      'RANGLOOP',
      shop_email:     'hello@rangloop.com',
    });
    console.log('📧 Cancellation email sent');
  } catch(e){ console.warn('Cancellation email failed:', e); }
}

// ═══════════════════════════════════════════
// SMS ORDER NOTIFICATION
// ═══════════════════════════════════════════
async function sendOrderSMSNotification(orderData) {
  if(FAST2SMS_API_KEY.includes('YOUR_FAST2SMS_KEY')) {
    console.log('📱 [TEST] SMS would go to:', orderData.shipping_address?.phone);
    return;
  }
  const rawPhone = (orderData.shipping_address?.phone||'').replace(/\D/g,'');
  const phone = rawPhone.slice(-10);
  if(phone.length < 10) return;
  const msg = `RANGLOOP: Hi ${orderData.shipping_address?.name||''}! Order #${orderData.order_id} of ₹${Number(orderData.total||0).toFixed(2)} via ${orderData.payment_method} confirmed. Delivery in 5-7 days. Thank you!`;
  try {
    await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&sender_id=FSTSMS&message=${encodeURIComponent(msg)}&language=english&route=p&numbers=${phone}`,
      {method:'GET', headers:{'cache-control':'no-cache'}}
    );
    console.log('📱 SMS sent to:', phone);
  } catch(e){ console.warn('SMS failed:', e); }
}
