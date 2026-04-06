/* ============================================
   Module 8: Networking & Protocols
   ============================================ */

const introNetworking = (() => {
  let listeners = [];
  let sopChecks = 0;
  let cidrCalcs = 0;

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  // ========== 8a: HTTP Request Builder ==========
  function initHttpBuilder(container) {
    const methodEl = Utils.$('#http-method', container);
    const pathEl = Utils.$('#http-path', container);
    const hostEl = Utils.$('#http-host', container);
    const headersEl = Utils.$('#http-headers', container);
    const bodyEl = Utils.$('#http-body', container);
    const buildBtn = Utils.$('#http-build-btn', container);
    const outputEl = Utils.$('#http-output', container);
    const bannerEl = Utils.$('#lab1-banner', container);
    const statusEl = Utils.$('#lab1-status', container);

    if (Storage.isLabCompleted('intro-networking', 'lab1')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    listen(buildBtn, 'click', () => {
      const method = methodEl.value;
      const path = pathEl.value || '/';
      const host = hostEl.value || 'example.com';
      const rawHeaders = headersEl.value.trim();
      const body = bodyEl.value.trim();

      let request = `<span class="http-method">${Utils.escapeHtml(method)}</span> <span class="http-url">${Utils.escapeHtml(path)}</span> HTTP/1.1\n`;
      request += `<span class="http-header-name">Host:</span> <span class="http-header-value">${Utils.escapeHtml(host)}</span>\n`;

      let hasAuth = false;
      if (rawHeaders) {
        rawHeaders.split('\n').forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const name = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            request += `<span class="http-header-name">${Utils.escapeHtml(name)}:</span> <span class="http-header-value">${Utils.escapeHtml(value)}</span>\n`;
            if (name.toLowerCase() === 'authorization') hasAuth = true;
          }
        });
      }

      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        request += `<span class="http-header-name">Content-Length:</span> <span class="http-header-value">${body.length}</span>\n`;
        request += `\n${Utils.escapeHtml(body)}`;
      }

      outputEl.innerHTML = request;

      if (hasAuth && path.includes('/api/')) {
        bannerEl.classList.add('visible');
        Router.markLabComplete('intro-networking', 'lab1');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      }
    });
  }

  // ========== 8b: TCP & TLS Handshake ==========
  function initHandshake(container) {
    const tcpBtn = Utils.$('#tcp-start-btn', container);
    const tlsBtn = Utils.$('#tls-start-btn', container);
    const messagesEl = Utils.$('#handshake-messages', container);
    const bannerEl = Utils.$('#lab2-banner', container);
    const statusEl = Utils.$('#lab2-status', container);
    let tcpDone = false;

    if (Storage.isLabCompleted('intro-networking', 'lab2')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    function animateMessages(steps, callback) {
      messagesEl.innerHTML = '';
      steps.forEach((step, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;margin-bottom:10px;opacity:0;transition:opacity 0.4s;padding:6px 0;';
        const arrow = step.dir === 'right' ? '→→→→→→→→→→→' : '←←←←←←←←←←←';
        const color = step.color || 'var(--accent-green)';
        div.innerHTML = `
          <span style="font-family:var(--font-mono);font-size:0.75rem;color:${color};min-width:100%;text-align:center;">
            <strong style="color:var(--accent-amber);">${Utils.escapeHtml(step.label)}</strong><br>
            <span style="letter-spacing:2px;">${arrow}</span><br>
            <span style="color:var(--text-muted);font-size:0.7rem;">${Utils.escapeHtml(step.desc)}</span>
          </span>`;

        messagesEl.appendChild(div);
        setTimeout(() => { div.style.opacity = '1'; }, (i + 1) * 600);
      });

      if (callback) setTimeout(callback, (steps.length + 1) * 600);
    }

    listen(tcpBtn, 'click', () => {
      tcpBtn.disabled = true;
      animateMessages([
        { label: 'SYN', dir: 'right', desc: 'seq=1000', color: 'var(--accent-blue)' },
        { label: 'SYN-ACK', dir: 'left', desc: 'seq=2000, ack=1001', color: 'var(--accent-green)' },
        { label: 'ACK', dir: 'right', desc: 'ack=2001', color: 'var(--accent-blue)' }
      ], () => {
        tcpDone = true;
        tlsBtn.disabled = false;
        tcpBtn.textContent = 'TCP ✓';
      });
    });

    listen(tlsBtn, 'click', () => {
      tlsBtn.disabled = true;
      animateMessages([
        { label: 'ClientHello', dir: 'right', desc: 'TLS 1.3, cipher suites, random', color: 'var(--accent-blue)' },
        { label: 'ServerHello', dir: 'left', desc: 'Chosen cipher, certificate, random', color: 'var(--accent-green)' },
        { label: 'Key Exchange', dir: 'right', desc: 'Client key share (ECDHE)', color: 'var(--accent-blue)' },
        { label: 'Finished', dir: 'left', desc: 'Server verify data', color: 'var(--accent-green)' },
        { label: 'Finished', dir: 'right', desc: 'Client verify data', color: 'var(--accent-blue)' },
        { label: '🔒 Encrypted', dir: 'right', desc: 'Application data flows', color: 'var(--accent-amber)' }
      ], () => {
        tlsBtn.textContent = 'TLS ✓';
        bannerEl.classList.add('visible');
        Router.markLabComplete('intro-networking', 'lab2');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      });
    });
  }

  // ========== 8c: DNS Resolution ==========
  function initDns(container) {
    const domainEl = Utils.$('#dns-domain', container);
    const resolveBtn = Utils.$('#dns-resolve-btn', container);
    const outputEl = Utils.$('#dns-output', container);
    const bannerEl = Utils.$('#lab3-banner', container);
    const statusEl = Utils.$('#lab3-status', container);

    if (Storage.isLabCompleted('intro-networking', 'lab3')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    const dnsZone = {
      'example.com': { A: '93.184.216.34', AAAA: '2606:2800:220:1::248', MX: '10 mail.example.com', NS: 'ns1.example.com', TXT: 'v=spf1 -all' },
      'www.example.com': { CNAME: 'example.com', A: '93.184.216.34' },
      'app.example.com': { A: '93.184.216.50', AAAA: '2606:2800:220:1::250' },
      'mail.example.com': { A: '93.184.216.60' },
      'api.example.com': { CNAME: 'lb.example.com', A: '93.184.216.70' },
      'google.com': { A: '142.250.80.46', MX: '10 smtp.google.com', NS: 'ns1.google.com' },
      'github.com': { A: '140.82.121.3', MX: '10 alt1.aspmx.l.google.com' }
    };

    listen(resolveBtn, 'click', () => {
      const domain = domainEl.value.trim().toLowerCase();
      if (!domain) return;

      let output = `<span class="prompt-char">$</span> resolve ${Utils.escapeHtml(domain)}\n\n`;

      // Step 1: Browser cache
      output += `<span style="color:var(--accent-amber);">[1] Browser Cache</span>\n`;
      output += `    Cache miss → forwarding to OS resolver\n\n`;

      // Step 2: OS cache
      output += `<span style="color:var(--accent-amber);">[2] OS Resolver Cache</span>\n`;
      output += `    Cache miss → querying recursive resolver (8.8.8.8)\n\n`;

      // Step 3: Root
      const tld = domain.split('.').pop();
      output += `<span style="color:var(--accent-amber);">[3] Root Nameserver (a.root-servers.net)</span>\n`;
      output += `    "I don't know ${Utils.escapeHtml(domain)}, but try the .${tld} TLD server"\n`;
      output += `    → Referral to ${tld}-servers.net\n\n`;

      // Step 4: TLD
      const parentDomain = domain.split('.').slice(-2).join('.');
      output += `<span style="color:var(--accent-amber);">[4] TLD Nameserver (${tld}-servers.net)</span>\n`;
      output += `    "Try the authoritative server for ${Utils.escapeHtml(parentDomain)}"\n`;
      output += `    → Referral to ns1.${Utils.escapeHtml(parentDomain)}\n\n`;

      // Step 5: Authoritative
      output += `<span style="color:var(--accent-amber);">[5] Authoritative Nameserver (ns1.${Utils.escapeHtml(parentDomain)})</span>\n`;

      const records = dnsZone[domain];
      if (records) {
        for (const [type, value] of Object.entries(records)) {
          output += `    <span style="color:var(--accent-green);">${type}</span>  ${Utils.escapeHtml(domain)}  →  <span style="color:var(--text-primary);">${Utils.escapeHtml(value)}</span>\n`;
        }
        output += `\n<span style="color:var(--accent-green);font-weight:bold;">✓ Resolution complete!</span>`;

        if (domain === 'app.example.com') {
          bannerEl.classList.add('visible');
          Router.markLabComplete('intro-networking', 'lab3');
          statusEl.textContent = '✓ Completed';
          statusEl.classList.add('solved');
        }
      } else {
        output += `    <span style="color:var(--accent-red);">NXDOMAIN — domain not found</span>\n`;
        output += `\n<span style="color:var(--text-muted);">Try: example.com, app.example.com, github.com, google.com</span>`;
      }

      outputEl.innerHTML = output;
    });
  }

  // ========== 8d: SOP Checker ==========
  function initSop(container) {
    const urlAEl = Utils.$('#sop-url-a', container);
    const urlBEl = Utils.$('#sop-url-b', container);
    const checkBtn = Utils.$('#sop-check-btn', container);
    const resultEl = Utils.$('#sop-result', container);
    const verdictEl = Utils.$('#sop-verdict', container);
    const breakdownEl = Utils.$('#sop-breakdown', container);
    const bannerEl = Utils.$('#lab4-banner', container);
    const statusEl = Utils.$('#lab4-status', container);

    if (Storage.isLabCompleted('intro-networking', 'lab4')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    function parseOrigin(urlStr) {
      try {
        const url = new URL(urlStr);
        let port = url.port;
        if (!port) {
          port = url.protocol === 'https:' ? '443' : '80';
        }
        return { scheme: url.protocol.replace(':', ''), host: url.hostname, port };
      } catch {
        return null;
      }
    }

    listen(checkBtn, 'click', () => {
      const a = parseOrigin(urlAEl.value.trim());
      const b = parseOrigin(urlBEl.value.trim());

      if (!a || !b) {
        verdictEl.innerHTML = '<span class="text-red">Invalid URL(s). Include the scheme (http:// or https://)</span>';
        resultEl.style.display = 'block';
        breakdownEl.innerHTML = '';
        return;
      }

      const sameScheme = a.scheme === b.scheme;
      const sameHost = a.host === b.host;
      const samePort = a.port === b.port;
      const sameOrigin = sameScheme && sameHost && samePort;

      const check = (match) => match
        ? '<span class="text-green">✓ Match</span>'
        : '<span class="text-red">✗ Different</span>';

      verdictEl.innerHTML = sameOrigin
        ? '<div class="sop-result same-origin">&#10003; Same Origin</div>'
        : '<div class="sop-result cross-origin">&#10007; Cross Origin</div>';

      breakdownEl.innerHTML = `
        <tr><td><strong>Scheme</strong></td><td><code>${a.scheme}</code></td><td><code>${b.scheme}</code></td><td>${check(sameScheme)}</td></tr>
        <tr><td><strong>Host</strong></td><td><code>${a.host}</code></td><td><code>${b.host}</code></td><td>${check(sameHost)}</td></tr>
        <tr><td><strong>Port</strong></td><td><code>${a.port}</code></td><td><code>${b.port}</code></td><td>${check(samePort)}</td></tr>`;

      resultEl.style.display = 'block';

      sopChecks++;
      if (sopChecks >= 3) {
        bannerEl.classList.add('visible');
        Router.markLabComplete('intro-networking', 'lab4');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      }
    });
  }

  // ========== 8e: CIDR Calculator ==========
  function initCidr(container) {
    const inputEl = Utils.$('#cidr-input', container);
    const calcBtn = Utils.$('#cidr-calc-btn', container);
    const resultEl = Utils.$('#cidr-result', container);
    const detailsEl = Utils.$('#cidr-details', container);
    const binaryEl = Utils.$('#cidr-binary', container);
    const bannerEl = Utils.$('#lab5-banner', container);
    const statusEl = Utils.$('#lab5-status', container);

    if (Storage.isLabCompleted('intro-networking', 'lab5')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    function ipToNum(ip) {
      const parts = ip.split('.').map(Number);
      return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }

    function numToIp(num) {
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
    }

    function numToBinary(num) {
      return num.toString(2).padStart(32, '0');
    }

    listen(calcBtn, 'click', () => {
      const input = inputEl.value.trim();
      const match = input.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);

      if (!match) {
        detailsEl.innerHTML = '<tr><td colspan="2" class="text-red">Invalid CIDR notation. Use format: 192.168.1.0/24</td></tr>';
        resultEl.style.display = 'block';
        return;
      }

      const ip = match[1];
      const prefix = parseInt(match[2]);

      if (prefix < 0 || prefix > 32) {
        detailsEl.innerHTML = '<tr><td colspan="2" class="text-red">Prefix must be 0-32</td></tr>';
        resultEl.style.display = 'block';
        return;
      }

      const ipNum = ipToNum(ip);
      const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
      const network = (ipNum & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const firstHost = prefix >= 31 ? network : network + 1;
      const lastHost = prefix >= 31 ? broadcast : broadcast - 1;
      const hostCount = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.pow(2, 32 - prefix) - 2;

      detailsEl.innerHTML = `
        <tr><td><strong>Network Address</strong></td><td><code>${numToIp(network)}</code></td></tr>
        <tr><td><strong>Broadcast Address</strong></td><td><code>${numToIp(broadcast)}</code></td></tr>
        <tr><td><strong>Subnet Mask</strong></td><td><code>${numToIp(mask)}</code></td></tr>
        <tr><td><strong>First Usable Host</strong></td><td><code>${numToIp(firstHost)}</code></td></tr>
        <tr><td><strong>Last Usable Host</strong></td><td><code>${numToIp(lastHost)}</code></td></tr>
        <tr><td><strong>Usable Hosts</strong></td><td><code>${hostCount.toLocaleString()}</code></td></tr>
        <tr><td><strong>Prefix Length</strong></td><td><code>/${prefix}</code></td></tr>`;

      // Binary breakdown
      const binary = numToBinary(ipNum);
      const networkBits = binary.substring(0, prefix);
      const hostBits = binary.substring(prefix);

      let formatted = '';
      for (let i = 0; i < 32; i++) {
        if (i > 0 && i % 8 === 0) formatted += '.';
        if (i < prefix) {
          formatted += `<span class="network-bits">${binary[i]}</span>`;
        } else {
          formatted += `<span class="host-bits">${binary[i]}</span>`;
        }
      }

      binaryEl.innerHTML = `
        <p style="font-size:0.85rem;">${Utils.escapeHtml(ip)}/${prefix}</p>
        <p style="font-size:1.1rem;letter-spacing:1px;margin:8px 0;">${formatted}</p>
        <p style="font-size:0.75rem;">
          <span class="network-bits">■</span> Network bits (${prefix})
          &nbsp;&nbsp;
          <span class="host-bits">■</span> Host bits (${32 - prefix})
        </p>`;

      resultEl.style.display = 'block';

      cidrCalcs++;
      if (cidrCalcs >= 2) {
        bannerEl.classList.add('visible');
        Router.markLabComplete('intro-networking', 'lab5');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      }
    });
  }

  function init(container) {
    sopChecks = 0;
    cidrCalcs = 0;
    initHttpBuilder(container);
    initHandshake(container);
    initDns(container);
    initSop(container);
    initCidr(container);

    QuizEngine.init(container, 'intro-networking', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which HTTP method is considered "safe" and should only retrieve data?',
          text_uk: 'Який HTTP-метод вважається "безпечним" і повинен лише отримувати дані?',
          options: [
            { value: 'a', label: 'POST', label_uk: 'POST' },
            { value: 'b', label: 'GET', label_uk: 'GET' },
            { value: 'c', label: 'PUT', label_uk: 'PUT' },
            { value: 'd', label: 'DELETE', label_uk: 'DELETE' }
          ],
          answer: 'b',
          hint: 'This method should have no side effects on the server.',
          hint_uk: 'Цей метод не повинен мати побічних ефектів на сервері.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What does HTTP status code 403 indicate?',
          text_uk: 'Що означає HTTP-код стану 403?',
          options: [
            { value: 'a', label: 'Not Found', label_uk: 'Not Found (не знайдено)' },
            { value: 'b', label: 'Internal Server Error', label_uk: 'Internal Server Error (внутрішня помилка сервера)' },
            { value: 'c', label: 'Forbidden — server understood the request but refuses to authorize it', label_uk: 'Forbidden — сервер зрозумів запит, але відмовляється його авторизувати' },
            { value: 'd', label: 'Redirect to another URL', label_uk: 'Перенаправлення на інший URL' }
          ],
          answer: 'c',
          hint: 'The server knows what you want but will not allow it.',
          hint_uk: 'Сервер знає, чого ти хочеш, але не дозволить це зробити.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'DNS resolves domain names to IP addresses.',
          text_uk: 'DNS перетворює доменні імена на IP-адреси.',
          answer: true,
          hint: 'DNS is often called the phonebook of the internet.',
          hint_uk: 'DNS часто називають телефонною книгою інтернету.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which DNS record type maps a domain name to an IPv4 address?',
          text_uk: 'Який тип DNS-запису зіставляє доменне ім\'я з IPv4-адресою?',
          options: [
            { value: 'a', label: 'CNAME', label_uk: 'CNAME' },
            { value: 'b', label: 'MX', label_uk: 'MX' },
            { value: 'c', label: 'A', label_uk: 'A' },
            { value: 'd', label: 'TXT', label_uk: 'TXT' }
          ],
          answer: 'c',
          hint: 'The simplest and most fundamental DNS record type.',
          hint_uk: 'Найпростіший і найосновніший тип DNS-запису.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What is the purpose of the TCP three-way handshake?',
          text_uk: 'Яке призначення трьохетапного TCP-рукостискання?',
          options: [
            { value: 'a', label: 'To encrypt data in transit', label_uk: 'Шифрування даних під час передачі' },
            { value: 'b', label: 'To establish a reliable connection between client and server', label_uk: 'Встановлення надійного з\'єднання між клієнтом і сервером' },
            { value: 'c', label: 'To resolve domain names', label_uk: 'Резолвінг доменних імен' },
            { value: 'd', label: 'To authenticate the server certificate', label_uk: 'Автентифікація сертифіката сервера' }
          ],
          answer: 'b',
          hint: 'SYN, SYN-ACK, ACK — what do these steps accomplish?',
          hint_uk: 'SYN, SYN-ACK, ACK — що досягають ці кроки?'
        }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('intro-networking');
  }

  return { init, cleanup };
})();

window.introNetworking = introNetworking;
