const config = require('./config');

let httpRequests = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
let totalRequests = 0;
let activeUsers = 0;
let successfulAuth = 0;
let failedAuth = 0;
let cpuUsage = 0;
let memoryUsage = 0;
let pizzasSold = 0;
let creationFailures = 0;
let revenue = 0;
let endpointLatency = { '/createPizza': 0, '/service': 0 };

setInterval(() => {
  // CPU and Memory Usage
  cpuUsage = Math.floor(Math.random() * 100);
  memoryUsage = Math.floor(Math.random() * 100);
  sendMetricToGrafana('cpu', cpuUsage, 'gauge', '%');
  sendMetricToGrafana('memory', memoryUsage, 'gauge', '%');

  // HTTP Requests by Method
  httpRequests.GET += Math.floor(Math.random() * 10);
  httpRequests.POST += Math.floor(Math.random() * 5);
  httpRequests.PUT += Math.floor(Math.random() * 3);
  httpRequests.DELETE += Math.floor(Math.random() * 2);
  totalRequests = Object.values(httpRequests).reduce((sum, value) => sum + value, 0);

  Object.keys(httpRequests).forEach(method => {
    sendMetricToGrafana(`http_request_${method.toLowerCase()}`, httpRequests[method], 'sum', '1');
  });

  sendMetricToGrafana('http_request_total', totalRequests, 'sum', '1');


  // Active Users
  activeUsers = Math.floor(Math.random() * 50);
  sendMetricToGrafana('active_users', activeUsers, 'gauge', '1');

  // Auth Attempts
  successfulAuth += Math.floor(Math.random() * 5);
  failedAuth += Math.floor(Math.random() * 3);
  sendMetricToGrafana('auth_success', successfulAuth, 'sum', '1');
  sendMetricToGrafana('auth_failure', failedAuth, 'sum', '1');

  // Pizza Metrics
  pizzasSold += Math.floor(Math.random() * 10);
  creationFailures += Math.floor(Math.random() * 3);
  revenue += pizzasSold * 12; // Assuming $12/pizza
  sendMetricToGrafana('pizzas_sold', pizzasSold, 'sum', '1');
  sendMetricToGrafana('creation_failures', creationFailures, 'sum', '1');
  sendMetricToGrafana('revenue', revenue, 'sum', '$');

  // Latency by Endpoint
  endpointLatency['/createPizza'] = Math.floor(Math.random() * 300);
  endpointLatency['/service'] = Math.floor(Math.random() * 500);
  sendMetricToGrafana('latency_createPizza', endpointLatency['/createPizza'], 'sum', 'ms');
  sendMetricToGrafana('latency_service', endpointLatency['/service'], 'sum', 'ms');
}, 1000);

function sendMetricToGrafana(metricName, metricValue, type, unit) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: unit,
                [type]: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (type === 'sum') {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].isMonotonic = true;
  }

  const body = JSON.stringify(metric);
  fetch(`${config.metrics.url}`, {
    method: 'POST',
    body: body,
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(`Failed to push metrics data to Grafana: ${text}\n${body}`);
        });
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}
