const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'http://localhost:3000/login?demo=student1';
const outputPath = process.argv[3] || 'screenshots/dashboard.png';
const waitMs = parseInt(process.argv[4] || '4000', 10);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const height = process.argv[5] || '1100';

async function capture() {
  console.log(`Starting Chrome for URL: ${url}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    `--window-size=1280,${height}`,
    url
  ]);

  // Wait for Chrome to be ready
  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const list = await res.json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
    } catch (e) {
      // not ready yet
    }
  }

  if (!target) {
    chromeProc.kill();
    throw new Error('Failed to find Chrome page target');
  }

  console.log(`Connected to page target. Waiting ${waitMs}ms for rendering...`);
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await new Promise((r) => setTimeout(r, waitMs));

  console.log('Capturing screenshot...');
  const msgId = 1;
  const screenshotPromise = new Promise((resolve, reject) => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === msgId) {
        if (data.result && data.result.data) {
          resolve(data.result.data);
        } else {
          reject(new Error(JSON.stringify(data.error || 'No screenshot data')));
        }
      }
    };
    ws.onerror = reject;
  });

  ws.send(JSON.stringify({
    id: msgId,
    method: 'Page.captureScreenshot',
    params: { format: 'png', captureBeyondViewport: false }
  }));

  const base64Data = await screenshotPromise;
  const buffer = Buffer.from(base64Data, 'base64');

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(path.resolve(outputPath), buffer);
  console.log(`Screenshot saved to ${outputPath} (${buffer.length} bytes)`);

  ws.close();
  chromeProc.kill();
}

capture().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
