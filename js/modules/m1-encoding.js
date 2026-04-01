/* ============================================
   Module 1 — Encoding & Cryptography
   ============================================ */

window.m1Encoding = (() => {
  const { $, $$, escapeHtml,
          base64Encode, base64Decode,
          urlEncode, urlDecode,
          hexEncode, hexDecode,
          htmlEntityEncode, htmlEntityDecode,
          rot13, xorEncrypt, xorDecrypt,
          sha256, md5, sha1,
          highlightJson } = Utils;

  // Store references for cleanup
  let listeners = [];
  let container = null;
  let hashDebounceTimer = null;

  // Helper: add an event listener and track it for cleanup
  function listen(el, event, handler) {
    if (!el) return;
    el.addEventListener(event, handler);
    listeners.push({ el, event, handler });
  }

  // Helper: show the success banner for a lab
  function showBanner(labNum) {
    const banner = $(`#lab${labNum}-banner`, container);
    if (banner) banner.classList.add('visible');
  }

  // Helper: update lab status badge from storage
  function syncLabStatus(labNum) {
    const statusEl = $(`#lab${labNum}-status`, container);
    if (statusEl && Storage.isLabCompleted('m1', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Lab 1: Encoder / Decoder Workbench ----

  function initLab1() {
    const toggles = $$(`.encoder-toggle#lab1-toggles .btn`, container);
    let activeEncoding = 'base64';

    // Toggle buttons
    toggles.forEach(btn => {
      listen(btn, 'click', () => {
        toggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeEncoding = btn.dataset.enc;
      });
    });

    const inputEl = $('#lab1-input', container);
    const outputEl = $('#lab1-output', container);
    const encodeBtn = $('#lab1-encode', container);
    const decodeBtn = $('#lab1-decode', container);

    function completeLab1() {
      if (!Storage.isLabCompleted('m1', 'lab1')) {
        Router.markLabComplete('m1', 'lab1');
        showBanner(1);
        syncLabStatus(1);
      }
    }

    listen(encodeBtn, 'click', () => {
      const input = inputEl.value;
      if (!input) return;
      let result = '';
      switch (activeEncoding) {
        case 'base64': result = base64Encode(input); break;
        case 'url':    result = urlEncode(input); break;
        case 'hex':    result = hexEncode(input); break;
        case 'html':   result = htmlEntityEncode(input); break;
        case 'rot13':  result = rot13(input); break;
      }
      outputEl.value = result;
      completeLab1();
    });

    listen(decodeBtn, 'click', () => {
      const input = inputEl.value;
      if (!input) return;
      let result = '';
      switch (activeEncoding) {
        case 'base64': result = base64Decode(input); break;
        case 'url':    result = urlDecode(input); break;
        case 'hex':    result = hexDecode(input); break;
        case 'html':   result = htmlEntityDecode(input); break;
        case 'rot13':  result = rot13(input); break; // ROT13 is its own inverse
      }
      outputEl.value = result;
      completeLab1();
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('m1', 'lab1')) showBanner(1);
  }

  // ---- Lab 2: XOR Workbench ----

  function initLab2() {
    const modeToggles = $$('#lab2-mode-toggle .btn', container);
    let mode = 'encrypt';

    const inputEl = $('#lab2-input', container);
    const keyEl = $('#lab2-key', container);
    const outputEl = $('#lab2-output', container);
    const runBtn = $('#lab2-run', container);
    const inputLabel = $('#lab2-input-label', container);
    const outputLabel = $('#lab2-output-label', container);

    modeToggles.forEach(btn => {
      listen(btn, 'click', () => {
        modeToggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;

        // Update labels based on mode
        if (inputLabel) inputLabel.textContent = mode === 'encrypt' ? 'Plaintext' : 'Hex Ciphertext';
        if (outputLabel) outputLabel.textContent = mode === 'encrypt' ? 'Hex Output' : 'Plaintext Output';
        inputEl.placeholder = mode === 'encrypt' ? 'Enter plaintext...' : 'Enter hex ciphertext (e.g. 0322)...';
        outputEl.value = '';
        inputEl.value = '';
      });
    });

    listen(runBtn, 'click', () => {
      const input = inputEl.value;
      const key = keyEl.value;
      if (!input || !key) return;

      let result = '';
      if (mode === 'encrypt') {
        result = xorEncrypt(input, key);
      } else {
        result = xorDecrypt(input, key);
      }
      outputEl.value = result;

      if (!Storage.isLabCompleted('m1', 'lab2')) {
        Router.markLabComplete('m1', 'lab2');
        showBanner(2);
        syncLabStatus(2);
      }
    });

    syncLabStatus(2);
    if (Storage.isLabCompleted('m1', 'lab2')) showBanner(2);
  }

  // ---- Lab 3: Hash Explorer ----

  function initLab3() {
    const inputEl = $('#lab3-input', container);
    const sha256El = $('#lab3-sha256', container);
    const md5El = $('#lab3-md5', container);
    const sha1El = $('#lab3-sha1', container);

    async function computeHashes() {
      const text = inputEl.value;
      if (!text) {
        sha256El.value = '';
        md5El.value = '';
        sha1El.value = '';
        return;
      }

      // SHA-256 is async, MD5 and SHA-1 are sync
      const [sha256Hash] = await Promise.all([sha256(text)]);
      const md5Hash = md5(text);
      const sha1Hash = sha1(text);

      sha256El.value = sha256Hash;
      md5El.value = md5Hash;
      sha1El.value = sha1Hash;

      if (!Storage.isLabCompleted('m1', 'lab3')) {
        Router.markLabComplete('m1', 'lab3');
        showBanner(3);
        syncLabStatus(3);
      }
    }

    // Debounce the hash computation slightly for rapid typing
    function onInput() {
      clearTimeout(hashDebounceTimer);
      hashDebounceTimer = setTimeout(computeHashes, 150);
    }

    listen(inputEl, 'input', onInput);

    syncLabStatus(3);
    if (Storage.isLabCompleted('m1', 'lab3')) showBanner(3);
  }

  // ---- Lab 4: JWT Decoder ----

  function initLab4() {
    const inputEl = $('#lab4-input', container);
    const headerEl = $('#lab4-header', container);
    const payloadEl = $('#lab4-payload', container);
    const signatureEl = $('#lab4-signature', container);
    const decodeBtn = $('#lab4-decode', container);
    const exampleBtn = $('#lab4-example', container);
    const algNoneBtn = $('#lab4-alg-none', container);
    const algWarning = $('#lab4-alg-warning', container);

    const EXAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    // alg:none example: header {"alg":"none","typ":"JWT"}, payload {"sub":"1","role":"admin","iat":1516239022}
    const ALG_NONE_JWT = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.' +
      'eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.';

    // Base64url decode helper
    function b64urlDecode(str) {
      // Replace URL-safe chars and add padding
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) base64 += '='.repeat(4 - pad);
      try {
        return decodeURIComponent(
          atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join('')
        );
      } catch {
        return null;
      }
    }

    function decodeJwt(token) {
      if (!token || !token.trim()) {
        headerEl.textContent = 'Decoded header will appear here...';
        payloadEl.textContent = 'Decoded payload will appear here...';
        signatureEl.textContent = 'Signature will appear here...';
        if (algWarning) algWarning.style.display = 'none';
        return;
      }

      const parts = token.trim().split('.');
      if (parts.length < 2 || parts.length > 3) {
        headerEl.innerHTML = '<span class="text-red">Invalid JWT format. Expected header.payload.signature</span>';
        payloadEl.textContent = '';
        signatureEl.textContent = '';
        if (algWarning) algWarning.style.display = 'none';
        return;
      }

      // Decode header
      const headerJson = b64urlDecode(parts[0]);
      let headerObj = null;
      if (headerJson) {
        try {
          headerObj = JSON.parse(headerJson);
          const formatted = JSON.stringify(headerObj, null, 2);
          headerEl.innerHTML = '<pre>' + highlightJson(formatted) + '</pre>';
        } catch {
          headerEl.innerHTML = '<span class="text-red">Failed to parse header JSON</span>';
        }
      } else {
        headerEl.innerHTML = '<span class="text-red">Failed to decode header</span>';
      }

      // Decode payload
      const payloadJson = b64urlDecode(parts[1]);
      if (payloadJson) {
        try {
          const payloadObj = JSON.parse(payloadJson);
          const formatted = JSON.stringify(payloadObj, null, 2);
          payloadEl.innerHTML = '<pre>' + highlightJson(formatted) + '</pre>';
        } catch {
          payloadEl.innerHTML = '<span class="text-red">Failed to parse payload JSON</span>';
        }
      } else {
        payloadEl.innerHTML = '<span class="text-red">Failed to decode payload</span>';
      }

      // Show signature
      const sig = parts.length === 3 ? parts[2] : '';
      if (sig) {
        signatureEl.textContent = sig;
      } else {
        signatureEl.innerHTML = '<span class="text-red">(empty — no signature)</span>';
      }

      // Check for alg:none
      if (algWarning && headerObj) {
        const alg = (headerObj.alg || '').toLowerCase();
        if (alg === 'none') {
          algWarning.style.display = '';
        } else {
          algWarning.style.display = 'none';
        }
      }

      // Mark complete
      if (!Storage.isLabCompleted('m1', 'lab4')) {
        Router.markLabComplete('m1', 'lab4');
        showBanner(4);
        syncLabStatus(4);
      }
    }

    listen(decodeBtn, 'click', () => {
      decodeJwt(inputEl.value);
    });

    listen(exampleBtn, 'click', () => {
      inputEl.value = EXAMPLE_JWT;
      decodeJwt(EXAMPLE_JWT);
    });

    listen(algNoneBtn, 'click', () => {
      inputEl.value = ALG_NONE_JWT;
      decodeJwt(ALG_NONE_JWT);
    });

    syncLabStatus(4);
    if (Storage.isLabCompleted('m1', 'lab4')) showBanner(4);
  }

  // ---- Public interface ----

  function init(cont) {
    container = cont;
    initLab1();
    initLab2();
    initLab3();
    initLab4();
  }

  function cleanup() {
    // Remove all tracked event listeners
    for (const { el, event, handler } of listeners) {
      el.removeEventListener(event, handler);
    }
    listeners = [];

    // Clear any pending timers
    clearTimeout(hashDebounceTimer);
    hashDebounceTimer = null;

    container = null;
  }

  return { init, cleanup };
})();
