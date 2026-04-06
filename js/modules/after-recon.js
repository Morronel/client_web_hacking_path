/* ============================================
   Module: Web Reconnaissance & Bug Bounty
   ============================================ */

window.afterRecon = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-recon', {
      questions: [
        {
          type: 'mc',
          text: 'Which Google dork operator restricts results to a specific domain?',
          options: [
            'inurl:',
            'filetype:',
            'site:',
            'intitle:'
          ],
          answer: 2
        },
        {
          type: 'mc',
          text: 'What is subdomain enumeration used for in reconnaissance?',
          options: [
            'To find email addresses of employees',
            'To discover additional attack surface by finding hidden subdomains',
            'To bypass firewalls',
            'To decrypt HTTPS traffic'
          ],
          answer: 1
        },
        {
          type: 'tf',
          text: 'Passive reconnaissance involves directly interacting with the target system (e.g., port scanning).',
          answer: false
        },
        {
          type: 'mc',
          text: 'Which tool is commonly used for DNS enumeration and subdomain brute-forcing?',
          options: [
            'Burp Suite',
            'Metasploit',
            'Amass',
            'Wireshark'
          ],
          answer: 2
        },
        {
          type: 'mc',
          text: 'What does the Google dork "filetype:sql" search for?',
          options: [
            'SQL injection vulnerabilities',
            'Files with the .sql extension indexed by Google',
            'Database servers on the internet',
            'SQL tutorials'
          ],
          answer: 1
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-recon');
  }

  return { init, cleanup };
})();
