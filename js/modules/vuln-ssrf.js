/* ============================================
   Module: Server-Side Request Forgery (SSRF)
   ============================================ */

window.vulnSsrf = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-ssrf', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which IP address is commonly used to access cloud instance metadata in AWS?',
          options: [
            { value: 'a', label: '10.0.0.1' },
            { value: 'b', label: '169.254.169.254' },
            { value: 'c', label: '192.168.1.1' },
            { value: 'd', label: '172.16.0.1' }
          ],
          answer: 'b',
          hint: 'This link-local address is the standard metadata endpoint for AWS, GCP, and Azure.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'How does DNS rebinding bypass SSRF hostname filters?',
          options: [
            { value: 'a', label: 'It encrypts the DNS request to avoid detection' },
            { value: 'b', label: 'It returns a public IP during validation but an internal IP when the actual request is made' },
            { value: 'c', label: 'It uses DNSSEC to spoof DNS records' },
            { value: 'd', label: 'It blocks the DNS response so the server times out' }
          ],
          answer: 'b',
          hint: 'The domain alternates between returning a safe IP (to pass the check) and a private IP (for the actual request).'
        },
        {
          type: 'mc', id: 'q3',
          text: 'What is the most effective server-side defense against SSRF?',
          options: [
            { value: 'a', label: 'Blocking the string "127.0.0.1" in user input' },
            { value: 'b', label: 'Using an allowlist of permitted hostnames and validating the resolved IP before making the request' },
            { value: 'c', label: 'Requiring HTTPS for all outgoing requests' },
            { value: 'd', label: 'Rate limiting outgoing requests to 10 per minute' }
          ],
          answer: 'b',
          hint: 'Allowlisting plus DNS resolution validation prevents most bypass techniques.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'AWS IMDSv2 requires a session token obtained via a PUT request, which makes metadata theft via basic SSRF much harder because most SSRF vectors only allow GET requests.',
          answer: true,
          hint: 'IMDSv2 is a token-based defense that adds an extra step attackers must replicate.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the IP address of the cloud metadata endpoint targeted in SSRF attacks? (dotted decimal notation)',
          placeholder: 'Type the IP address...',
          // SHA-256 of "169.254.169.254"
          answerHash: '34146ce1ba492ed7acf9a9925a04541645c203d9652183c6e238f55786c8b66f',
          hint: 'This link-local address is reachable from within any major cloud provider instance.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic SSRF',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Cloud Metadata Access',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — DNS Rebinding',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-ssrf');
  }

  return { init, cleanup };
})();
