(async () => {
  try {
    const db = require('./models');
    const scheduled = require('./routes/scheduledLessons');

    // Find the textbook handler inside the router stack
    // Express routers store stack in router.stack (each layer has route and handle)
    const layer = scheduled.stack.find(l => l.route && l.route.path === '/textbook' && l.route.methods.get);
    if (!layer) {
      console.error('Could not find /textbook GET route in scheduledLessons router');
      process.exit(2);
    }

    const handler = layer.route.stack.find(s => s.method === 'get').handle;

    // Mock req/res
    const req = { query: { level: 'أولى بكالوريا' } };
    const res = {
      statusCalled: null,
      jsonBody: null,
      status(code) { this.statusCalled = code; return this; },
      json(body) { this.jsonBody = body; console.log('RESULT COUNT:', Array.isArray(body) ? body.length : 'N/A'); console.log(JSON.stringify((Array.isArray(body) ? body.slice(0,5) : body), null, 2)); }
    };

    // Call handler
    await handler(req, res);
    process.exit(0);
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
