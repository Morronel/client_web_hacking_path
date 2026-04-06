/* ============================================
   Module: Web Reconnaissance & Bug Bounty
   ============================================ */

window.afterRecon = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-recon', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which Google dork operator restricts results to a specific domain?',
          options: [
            { value: 'a', label: 'inurl:' },
            { value: 'b', label: 'filetype:' },
            { value: 'c', label: 'site:' },
            { value: 'd', label: 'intitle:' }
          ],
          answer: 'c',
          hint: 'This operator limits results to pages hosted on a particular domain.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is subdomain enumeration used for in reconnaissance?',
          options: [
            { value: 'a', label: 'To find email addresses of employees' },
            { value: 'b', label: 'To discover additional attack surface by finding hidden subdomains' },
            { value: 'c', label: 'To bypass firewalls' },
            { value: 'd', label: 'To decrypt HTTPS traffic' }
          ],
          answer: 'b',
          hint: 'Forgotten or internal subdomains often have weaker security.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Passive reconnaissance involves directly interacting with the target system (e.g., port scanning).',
          answer: false,
          hint: 'Passive recon gathers information without touching the target directly.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which tool is commonly used for DNS enumeration and subdomain brute-forcing?',
          options: [
            { value: 'a', label: 'Burp Suite' },
            { value: 'b', label: 'Metasploit' },
            { value: 'c', label: 'Amass' },
            { value: 'd', label: 'Wireshark' }
          ],
          answer: 'c',
          hint: 'This OWASP project specializes in network mapping and external asset discovery.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What does the Google dork "filetype:sql" search for?',
          options: [
            { value: 'a', label: 'SQL injection vulnerabilities' },
            { value: 'b', label: 'Files with the .sql extension indexed by Google' },
            { value: 'c', label: 'Database servers on the internet' },
            { value: 'd', label: 'SQL tutorials' }
          ],
          answer: 'b',
          hint: 'The filetype operator filters results by file extension, not by content type.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-recon');
  }

  return { init, cleanup };
})();
