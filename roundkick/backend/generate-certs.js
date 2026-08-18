//CODE ATTRIBUTION
//01
//Selfsigned - Self-Signed Certificate Generator
//Adapted from: npm. (2025). selfsigned. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/selfsigned
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Node.js File System Module
//Adapted from: Node.js Foundation. (2025). File system. [online] Node.js Documentation.
//Available at: https://nodejs.org/api/fs.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Self-Signed Certificates for Development
//Adapted from: MDN Web Docs. (2025). What is a digital certificate?. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Glossary/Digital_certificate
//Date Accessed: 10 October 2025

import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating self-signed SSL certificates...');

// Define certificate attributes
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'US' },
  { name: 'stateOrProvinceName', value: 'State' },
  { name: 'localityName', value: 'City' },
  { name: 'organizationName', value: 'Development' }
];

// Certificate options
const options = {
  keySize: 2048, // RSA key size
  days: 365, // Valid for 1 year
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' }
      ]
    }
  ]
};

// Generate the certificate
const pems = selfsigned.generate(attrs, options);

const certDir = path.join(__dirname, 'cert');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

// Write the certificate files
fs.writeFileSync(path.join(certDir, 'localhost.pem'), pems.cert);
fs.writeFileSync(path.join(certDir, 'localhost-key.pem'), pems.private);

console.log('SSL certificates generated successfully!');
console.log('Certificate:', path.join(certDir, 'localhost.pem'));
console.log('Private Key:', path.join(certDir, 'localhost-key.pem'));
console.log('\n⚠️  WARNING: These are self-signed certificates for development only.');
console.log('For production, obtain proper certificates from a Certificate Authority.');
