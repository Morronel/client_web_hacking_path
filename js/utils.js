/* ============================================
   Shared Utilities
   ============================================ */

const Utils = (() => {
  // DOM helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function el(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') elem.className = v;
      else if (k === 'textContent') elem.textContent = v;
      else if (k === 'innerHTML') elem.innerHTML = v;
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
      else elem.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
      else if (child) elem.appendChild(child);
    }
    return elem;
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  // SHA-256 via SubtleCrypto
  async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function validateFlag(input, expectedHash) {
    const hash = await sha256(input.trim());
    return hash === expectedHash;
  }

  // MD5 — pure JS implementation (for educational hash explorer)
  function md5(string) {
    function md5cycle(x, k) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }

    const n = string.length;
    let state = [1732584193, -271733879, -1732584194, 271733878];
    let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i, s;
    for (i = 64; i <= n; i += 64) {
      let tmp = [];
      for (s = i - 64; s < i; s += 4)
        tmp.push(string.charCodeAt(s) + (string.charCodeAt(s+1) << 8) + (string.charCodeAt(s+2) << 16) + (string.charCodeAt(s+3) << 24));
      md5cycle(state, tmp);
    }
    for (s = 0; s < tail.length; s++) tail[s] = 0;
    for (s = i - 64; s < n; s++)
      tail[s >> 2] |= string.charCodeAt(s) << ((s % 4) << 3);
    tail[s >> 2] |= 0x80 << ((s % 4) << 3);
    if (s > 55) { md5cycle(state, tail); for (s = 0; s < 16; s++) tail[s] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);

    const hex = '0123456789abcdef';
    let result = '';
    for (i = 0; i < 4; i++)
      for (s = 0; s < 32; s += 8)
        result += hex.charAt((state[i] >> (s + 4)) & 0x0f) + hex.charAt((state[i] >> s) & 0x0f);
    return result;
  }

  // SHA-1 — pure JS implementation
  function sha1(str) {
    function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
    function toHex(n) { let s = ''; for (let i = 7; i >= 0; i--) s += ((n >> (i * 4)) & 0xf).toString(16); return s; }

    const msg = unescape(encodeURIComponent(str));
    const len = msg.length;
    const words = [];
    for (let i = 0; i < len; i++) words[i >> 2] |= msg.charCodeAt(i) << (24 - (i % 4) * 8);
    words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    words[((len + 8) >> 6) * 16 + 15] = len * 8;

    let H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;

    for (let i = 0; i < words.length; i += 16) {
      let a = H0, b = H1, c = H2, d = H3, e = H4;
      const W = [];
      for (let t = 0; t < 80; t++) {
        W[t] = t < 16 ? (words[i + t] || 0) : rotl(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);
        let f, k;
        if (t < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const temp = (rotl(a, 5) + f + e + k + W[t]) & 0xFFFFFFFF;
        e = d; d = c; c = rotl(b, 30); b = a; a = temp;
      }
      H0 = (H0 + a) & 0xFFFFFFFF; H1 = (H1 + b) & 0xFFFFFFFF;
      H2 = (H2 + c) & 0xFFFFFFFF; H3 = (H3 + d) & 0xFFFFFFFF;
      H4 = (H4 + e) & 0xFFFFFFFF;
    }
    return toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4);
  }

  // Encoding functions
  function base64Encode(str) {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch { return btoa(str); }
  }

  function base64Decode(str) {
    try { return decodeURIComponent(escape(atob(str))); }
    catch { try { return atob(str); } catch { return '[Invalid Base64]'; } }
  }

  function urlEncode(str) { return encodeURIComponent(str); }
  function urlDecode(str) { try { return decodeURIComponent(str); } catch { return '[Invalid URL encoding]'; } }

  function hexEncode(str) {
    return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  }

  function hexDecode(str) {
    try {
      const cleaned = str.replace(/\s+/g, '');
      let result = '';
      for (let i = 0; i < cleaned.length; i += 2)
        result += String.fromCharCode(parseInt(cleaned.substr(i, 2), 16));
      return result;
    } catch { return '[Invalid Hex]'; }
  }

  function htmlEntityEncode(str) {
    return str.replace(/./g, c => {
      const code = c.charCodeAt(0);
      if (code > 127 || c === '&' || c === '<' || c === '>' || c === '"' || c === "'")
        return '&#' + code + ';';
      return c;
    });
  }

  function htmlEntityDecode(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  function xorEncrypt(text, key) {
    if (!key) return '';
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const xored = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += xored.toString(16).padStart(2, '0');
    }
    return result;
  }

  function xorDecrypt(hexStr, key) {
    if (!key) return '';
    try {
      const cleaned = hexStr.replace(/\s+/g, '');
      let result = '';
      for (let i = 0; i < cleaned.length; i += 2) {
        const byte = parseInt(cleaned.substr(i, 2), 16);
        result += String.fromCharCode(byte ^ key.charCodeAt((i / 2) % key.length));
      }
      return result;
    } catch { return '[Invalid input]'; }
  }

  // SQL error formatter
  function formatSqlError(err) {
    const msg = err.message || String(err);
    return msg.replace(/^Error:\s*/, '');
  }

  // JSON syntax highlighter
  function highlightJson(obj, indent = 2) {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, indent);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${escapeHtml(match)}</span>`;
      }
    );
  }

  return {
    $, $$, el, escapeHtml,
    sha256, validateFlag, md5, sha1,
    base64Encode, base64Decode,
    urlEncode, urlDecode,
    hexEncode, hexDecode,
    htmlEntityEncode, htmlEntityDecode,
    rot13, xorEncrypt, xorDecrypt,
    formatSqlError, highlightJson
  };
})();
