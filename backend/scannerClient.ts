/**
 * ClamAV malware scanner client (platform-agnostic).
 *
 * Connects to a ClamAV daemon (clamd) over TCP.
 * Works with:
 *  - Containerized ClamAV  (clamav/clamav Docker image)
 *  - Any clamd-compatible endpoint
 *
 * In production, this supplements (not replaces) cloud-native scanning:
 *  - Azure: Microsoft Defender for Storage
 *  - AWS:   GuardDuty / Macie
 *  - GCP:   Security Command Center
 *
 * Those are infrastructure-level — enabled via IaC, no app-code change.
 */

import net from 'net';

const CLAMAV_HOST = process.env.CLAMAV_HOST ?? 'clamav';
const CLAMAV_PORT = Number(process.env.CLAMAV_PORT ?? 3310);
const SCAN_TIMEOUT_MS = 30_000;

export interface ScanResult {
  clean: boolean;
  detail: string;
}

/**
 * Scan a buffer for malware using the ClamAV INSTREAM protocol.
 *
 * Protocol:
 *  1. Send "zINSTREAM\0"
 *  2. Send chunks: 4-byte big-endian length + data
 *  3. Send 4-byte zero to signal end
 *  4. Read response — "stream: OK" means clean
 */
export const scanBuffer = (fileBuffer: Buffer): Promise<ScanResult> => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let response = '';

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('ClamAV scan timed out'));
    }, SCAN_TIMEOUT_MS);

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // 1. Send INSTREAM command
      socket.write('zINSTREAM\0');

      // 2. Send file data in chunks (max 2 MB per chunk)
      const CHUNK_SIZE = 2 * 1024 * 1024;
      for (let offset = 0; offset < fileBuffer.length; offset += CHUNK_SIZE) {
        const chunk = fileBuffer.subarray(offset, offset + CHUNK_SIZE);
        const sizeHeader = Buffer.alloc(4);
        sizeHeader.writeUInt32BE(chunk.length, 0);
        socket.write(sizeHeader);
        socket.write(chunk);
      }

      // 3. Signal end of stream
      const endMarker = Buffer.alloc(4, 0);
      socket.write(endMarker);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      clearTimeout(timer);
      const trimmed = response.replace(/\0/g, '').trim();
      const clean = trimmed.endsWith('OK');
      resolve({ clean, detail: trimmed });
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`ClamAV connection error: ${err.message}`));
    });
  });
};

/**
 * Check if ClamAV is reachable (health check).
 * Sends PING, expects PONG.
 */
export const pingClamAV = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 5_000);

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      socket.write('zPING\0');
    });

    socket.on('data', (data) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(data.toString().replace(/\0/g, '').trim() === 'PONG');
    });

    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
};
