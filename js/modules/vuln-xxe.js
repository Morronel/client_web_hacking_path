/* ============================================
   Module: XML External Entities (XXE)
   ============================================ */

window.vulnXxe = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-xxe', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What XML feature is exploited in XXE attacks?',
          options: [
            { value: 'a', label: 'XML namespaces' },
            { value: 'b', label: 'External entity declarations in the DTD' },
            { value: 'c', label: 'XML attributes' },
            { value: 'd', label: 'CDATA sections' }
          ],
          answer: 'b',
          hint: 'The Document Type Definition allows declaring entities that reference external files or URLs.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'How is blind XXE data exfiltrated when entity values aren\'t displayed?',
          options: [
            { value: 'a', label: 'Using parameter entities that trigger HTTP requests to an attacker-controlled server carrying the data' },
            { value: 'b', label: 'Using JavaScript inside XML comments' },
            { value: 'c', label: 'Embedding the data in XML attributes' },
            { value: 'd', label: 'Sending the data via email' }
          ],
          answer: 'a',
          hint: 'Parameter entities can make out-of-band HTTP requests with stolen data in the URL.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'What is the best way to prevent XXE in Python?',
          options: [
            { value: 'a', label: 'Filtering the string "ENTITY" from input' },
            { value: 'b', label: 'Limiting XML file size' },
            { value: 'c', label: 'Using <code>defusedxml</code> or disabling DTD loading and entity resolution' },
            { value: 'd', label: 'Encoding XML in base64 before parsing' }
          ],
          answer: 'c',
          hint: 'A library that disables dangerous XML features by default is the most reliable approach.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'SVG image files can be used as an XXE attack vector because SVG is an XML-based format that may be parsed with entity resolution enabled.',
          answer: true,
          hint: 'SVG, DOCX, XLSX, and other XML-based file formats can all carry XXE payloads.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What Python library is a drop-in replacement for standard XML parsers that blocks all dangerous XML features by default? (one word, lowercase)',
          placeholder: 'Type the library name...',
          // SHA-256 of "defusedxml"
          answerHash: '8018460bcbbfee4b69f0e3a3cf6d1b89e0fb9429d45231eddc41b73b649c3efa',
          hint: 'The name suggests it makes XML parsing safe — "defused."'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Entity Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Blind OOB XXE',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — SVG-Based XXE',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-xxe');
  }

  return { init, cleanup };
})();
