const express = require('express');
const client = require('prom-client');
const port = 3002
const app = express();
app.use(express.json());

// Create Prometheus metrics
const bufferLevelGauge = new client.Gauge({
    name: 'dashjs_buffer_level',
    help: 'Current buffer level in seconds',
    labelNames: ['client_id']
});

const bitrateGauge = new client.Gauge({
    name: 'dashjs_bitrate',
    help: 'Current bitrate in kbps',
    labelNames: ['client_id']
});

const rebufferingCounter = new client.Counter({
    name: 'dashjs_rebuffering_events',
    help: 'Count of rebuffering events',
    labelNames: ['client_id']
});

const GeoGauge = new client.Gauge({
    name: 'dashjs_geo_region',
    help: 'Geographic region of the client',
    labelNames: ['client_id', 'region']
});

const BufferStarvationGauge = new client.Gauge({
    name: 'dashjs_buffer_starvation',
    help: 'Buffer starvation',
    labelNames: ['client_id']
});

const MeasuredThroughputGauge = new client.Gauge({
    name: 'dashjs_measured_throughput',
    help: 'Measured throughput',
    labelNames: ['client_id']
});


// Metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Content Steering Endpoint
app.get('/steering', async (req, res) => {
    res.set('Content-Type', 'application/json');

    res.json({
        "VERSION": 1,
        "TTL": 10,
        "RELOAD-URI": "https://cloudfront.content-steering.com/dash.dcsm?steering_params=eyJtaW5CaXRyYXRlIjo5MTQ4NzgsImNkbk9yZGVyIjpbImNkbi1iIiwiY2RuLWEiLCJjZG4tYyJdLCJwYXRod2F5cyI6W3siaWQiOiJjZG4tYiIsInRocm91Z2hwdXQiOjgwMDAwMDB9LHsiaWQiOiJjZG4tYSIsInRocm91Z2hwdXQiOjkwMDAwMDB9LHsiaWQiOiJjZG4tYyIsInRocm91Z2hwdXQiOjEwMDAwMDAwfV0sInRpbWVzdGFtcCI6MTc1MTQwNzczMTQwMn0=",
        "PATHWAY-PRIORITY": [
            "cdn-b",
            "cdn-a",
            "cdn-c"
        ]
    });
});



// Endpoint to receive metrics from DASH.js
app.post('/metrics', (req, res) => {
    console.log('Req:', req.body)
    const { bufferLevel, bitrate, rebuffering, clientId = 'default' } = req.body;
    const { clientInfo } = req.body; // clientInfo data i added (ip/region)
    const { cmcd } = req.body;  // cmcd data structure as per spec
    
    // Only set buffer level if it's a valid number
    if (typeof bufferLevel === 'number' && !isNaN(bufferLevel)) {
        bufferLevelGauge.set({ client_id: clientId }, bufferLevel);
    }
    
    // Only set bitrate if it's a valid number
    if (typeof bitrate === 'number' && !isNaN(bitrate)) {
        bitrateGauge.set({ client_id: clientId }, bitrate);
    }
    
    if (rebuffering) {
        rebufferingCounter.inc({ client_id: clientId });
    }

    if (clientInfo?.region) {
        GeoGauge.set({ client_id: clientId, region: clientInfo.region }, 1);
    }

    if (cmcd?.bs) {
        BufferStarvationGauge.set({ client_id: clientId }, cmcd?.bs);
    }

    if (cmcd?.mtp) {
        MeasuredThroughputGauge.set({ client_id: clientId }, cmcd?.mtp);
    }
    
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Player Metrics server running on port ${port}`);
    console.log(`Metrics Endpoint: http://localhost/${port}/metrics`)
});

