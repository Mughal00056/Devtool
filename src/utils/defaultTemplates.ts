import { ProjectTemplate } from '../types/devtools';

export const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-dashboard',
    title: 'React SaaS Analytics Dashboard',
    description: 'Modern interactive dashboard with state hooks, metric cards, revenue trends, and responsive Tailwind layout.',
    badge: 'React 19 + Tailwind',
    files: [
      {
        id: 'file-app-tsx',
        name: 'App.tsx',
        language: 'tsx',
        isEntry: true,
        content: `// React 19 Interactive Dashboard
function MetricCard({ title, value, change, isPositive, metricKey }: { title: string; value: string; change: string; isPositive: boolean; metricKey: string }) {
  return (
    <div id={\`card-\${metricKey}\`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <span className={\`text-xs font-semibold px-2 py-0.5 rounded \${isPositive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'}\`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const deployments = [
    { id: 'dep-101', project: 'api-gateway-us-east', branch: 'main', commit: '7f9a2e', time: '2m ago', status: 'deployed' },
    { id: 'dep-102', project: 'auth-service-v2', branch: 'feature/oauth', commit: '4c3d1b', time: '14m ago', status: 'building' },
    { id: 'dep-103', project: 'client-dashboard-pwa', branch: 'release-2.4', commit: '8e1f0a', time: '1h ago', status: 'deployed' },
    { id: 'dep-104', project: 'telemetry-streamer', branch: 'fix/buffer', commit: '2a9d8c', time: '3h ago', status: 'failed' },
  ];

  const filtered = deployments.filter(d => statusFilter === 'all' || d.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Platform Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global production clusters · Asia-Southeast & US-East
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={\`px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}\`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('deployments')} 
              className={\`px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${activeTab === 'deployments' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}\`}
            >
              Deployments
            </button>
          </div>
          <button 
            id="btn-sync-telemetry"
            onClick={() => setRefreshCount(c => c + 1)}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-sm"
          >
            Sync Data ({refreshCount})
          </button>
        </div>
      </header>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <MetricCard metricKey="active-services" title="ACTIVE MICROSERVICES" value="48 / 50" change="+4.2%" isPositive={true} />
        <MetricCard metricKey="request-rate" title="REQUEST RATE (RPS)" value="14,280" change="+12.8%" isPositive={true} />
        <MetricCard metricKey="avg-latency" title="MEDIAN LATENCY" value="28.4 ms" change="-3.1 ms" isPositive={true} />
        <MetricCard metricKey="error-budget" title="ERROR BUDGET REMAINING" value="99.94%" change="-0.02%" isPositive={false} />
      </section>

      {/* Main Table / Deployment Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Production Deployment Queue</h2>
            <span className="text-xs text-slate-400">Real-time status across edge clusters</span>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="deployed">Deployed</option>
              <option value="building">Building</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-medium">
              <th className="py-3 px-5">Deployment ID</th>
              <th className="py-3 px-5">Service</th>
              <th className="py-3 px-5">Branch</th>
              <th className="py-3 px-5">Commit</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(row => (
              <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-5 font-mono text-slate-300 font-medium">{row.id}</td>
                <td className="py-3.5 px-5 font-semibold text-white">{row.project}</td>
                <td className="py-3.5 px-5 text-slate-400">{row.branch}</td>
                <td className="py-3.5 px-5 font-mono text-slate-400">{row.commit}</td>
                <td className="py-3.5 px-5">
                  <span className={\`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize \${
                    row.status === 'deployed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    row.status === 'building' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
                  }\`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right text-slate-400 font-mono tabular-nums">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`
      },
      {
        id: 'file-index-html',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaaS Production Dashboard</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body class="bg-slate-950 text-slate-100 font-sans">
    <div id="root"></div>
    <script type="module" src="./script.js"></script>
  </body>
</html>`
      },
      {
        id: 'file-styles-css',
        name: 'styles.css',
        language: 'css',
        content: `/* Core DevTools Custom Styles */
:root {
  --primary-accent: #2563eb;
  --surface-dark: #0f172a;
  --border-subtle: #1e293b;
}

body {
  margin: 0;
  padding: 0;
  background-color: #020617;
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.metric-highlight {
  box-shadow: 0 0 20px -5px rgba(37, 99, 235, 0.25);
}

.table-row-hover:hover {
  background-color: rgba(30, 41, 59, 0.5);
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #090d16;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}`
      },
      {
        id: 'file-script-js',
        name: 'script.js',
        language: 'javascript',
        content: `// Dashboard Client Telemetry Engine
class TelemetryManager {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.metrics = [];
  }

  async fetchHealthStatus() {
    console.log('[Telemetry] Pinging cluster health status...');
    const simulatedStatus = {
      status: 'healthy',
      activeNodes: 12,
      latency: 24.8,
      timestamp: new Date().toISOString()
    };
    return simulatedStatus;
  }

  calculateThroughput(requests, seconds) {
    if (seconds <= 0) return 0;
    return Math.round((requests / seconds) * 100) / 100;
  }
}

const manager = new TelemetryManager('https://api.cloud.cluster');
console.log('Telemetry Manager Initialized:', manager);`
      },
      {
        id: 'file-main-py',
        name: 'main.py',
        language: 'python',
        content: `# Python Microservice Telemetry Analyzer
def calculate_system_metrics(raw_latencies):
    # Calculate median, min, max, and 95th percentile latency
    sorted_data = sorted(raw_latencies)
    n = len(sorted_data)
    
    total = sum(sorted_data)
    avg_latency = round(total / n, 2)
    min_lat = min(sorted_data)
    max_lat = max(sorted_data)
    p95_idx = int(n * 0.95)
    p95 = sorted_data[p95_idx]
    
    return {
        "count": n,
        "average_ms": avg_latency,
        "p95_ms": p95,
        "min_ms": min_lat,
        "max_ms": max_lat
    }

# Sample telemetry ping measurements in milliseconds
latencies = [24.2, 28.5, 31.0, 22.1, 19.8, 45.2, 29.1, 23.4, 88.0, 27.3, 21.9, 30.5]
results = calculate_system_metrics(latencies)

print("=== CLUSTER METRICS SUMMARY ===")
print("Analyzed Pings:", results["count"])
print("Average Latency:", results["average_ms"], "ms")
print("95th Percentile:", results["p95_ms"], "ms")
print("Min / Max:", results["min_ms"], "ms /", results["max_ms"], "ms")`
      }
    ]
  },
  {
    id: 'python-algorithms',
    title: 'Python Algorithms & Data Inspector',
    description: 'Clean algorithmic implementations with data transforms, quicksort, graph search, and variable tracking.',
    badge: 'Python Standard Suite',
    files: [
      {
        id: 'file-py-algo',
        name: 'main.py',
        language: 'python',
        isEntry: true,
        content: `# Python Advanced Algorithms & Data Inspector

def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

def fibonacci(n):
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i - 1] + sequence[i - 2])
    return sequence

# Test Quicksort
unsorted_numbers = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50, 7]
sorted_numbers = quicksort(unsorted_numbers)

# Test Fibonacci
fib_terms = fibonacci(12)

# Compute Statistics
dataset = [15, 23, 18, 42, 9, 31, 55, 67, 12, 80]
mean_val = round(sum(dataset) / len(dataset), 2)
range_val = max(dataset) - min(dataset)

print("=== ALGORITHM BENCHMARK EXECUTION ===")
print("Original Array:", unsorted_numbers)
print("Quicksorted Array:", sorted_numbers)
print("Fibonacci First 12 Terms:", fib_terms)
print("Dataset Mean:", mean_val)
print("Dataset Spread Range:", range_val)`
      },
      {
        id: 'file-py-app-tsx',
        name: 'App.tsx',
        language: 'tsx',
        content: `// React UI showing Python Results
export default function PythonVisualizer() {
  return (
    <div className="p-8 bg-slate-950 text-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-4">Python Algorithm Sandbox</h1>
      <p className="text-sm text-slate-400 mb-6">Run Python algorithms in the Python Terminal tab and inspect outputs.</p>
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Supported Features:</h3>
        <ul className="text-xs text-slate-400 space-y-1 list-disc pl-5">
          <li>Recursive functions (Quicksort, Fibonacci)</li>
          <li>List comprehensions and array slicing</li>
          <li>Variable inspection with live state table</li>
          <li>Interactive REPL terminal with stdout capture</li>
        </ul>
      </div>
    </div>
  );
}`
      }
    ]
  },
  {
    id: 'ecommerce-showcase',
    title: 'E-Commerce Interactive Product',
    description: 'Product gallery, pricing calculator, variant picker, and shopping cart drawer.',
    badge: 'React + CSS Showcase',
    files: [
      {
        id: 'file-ecom-app',
        name: 'App.tsx',
        language: 'tsx',
        isEntry: true,
        content: `// Interactive E-Commerce Product Studio
export default function ProductStudio() {
  const [selectedColor, setSelectedColor] = React.useState('Obsidian Black');
  const [quantity, setQuantity] = React.useState(1);
  const [cartCount, setCartCount] = React.useState(0);
  const [activeImage, setActiveImage] = React.useState(0);

  const price = 249;
  const colors = [
    { name: 'Obsidian Black', hex: '#0f172a' },
    { name: 'Titanium Gray', hex: '#475569' },
    { name: 'Alpine Frost', hex: '#e2e8f0' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center">
          <span className="font-bold text-lg text-white">Apex Acoustics Studio</span>
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs font-medium text-slate-300">Bag:</span>
            <span className="text-xs font-bold text-blue-400 font-mono tabular-nums">{cartCount} items</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Gallery View */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="text-center p-6">
                <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-slate-800 shadow-inner flex items-center justify-center" style={{ backgroundColor: colors.find(c => c.name === selectedColor)?.hex }}>
                  <span className="text-xs font-mono uppercase text-slate-400">Headphone</span>
                </div>
                <span className="text-xs text-slate-400">Studio Reference Monitor Mk.IV</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Flagship Audio</span>
              <h1 className="text-2xl font-bold text-white mt-1">Apex ANC Studio Wireless</h1>
              <div className="text-2xl font-bold font-mono text-white mt-3 tabular-nums">\${price * quantity}</div>

              {/* Color selector */}
              <div className="mt-6">
                <label className="text-xs text-slate-400 block mb-2">Color Finish: <strong className="text-white">{selectedColor}</strong></label>
                <div className="flex gap-3">
                  {colors.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={\`w-8 h-8 rounded-full border-2 transition-all \${selectedColor === c.name ? 'border-blue-500 scale-110 shadow-lg' : 'border-slate-700 opacity-70'}\`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6">
                <label className="text-xs text-slate-400 block mb-2">Units:</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded bg-slate-800 text-white font-bold hover:bg-slate-700">-</button>
                  <span className="font-mono text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded bg-slate-800 text-white font-bold hover:bg-slate-700">+</button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCartCount(c => c + quantity)}
              className="w-full mt-8 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-600/30"
            >
              Add to Bag (\${price * quantity})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`
      }
    ]
  }
];
