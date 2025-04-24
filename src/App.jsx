import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Save, Upload, Download, 
  Settings, Info, ArrowRight, Code, Plus, Trash2, Edit, 
  Move, Check, X 
} from 'lucide-react';

const App = () => {
  // Graph state
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 250, y: 50 },
    { id: 2, label: 'C', x: 400, y: 100 },
    { id: 3, label: 'D', x: 250, y: 200 },
    { id: 4, label: 'E', x: 300, y: 300 },
    { id: 5, label: 'F', x: 150, y: 300 }
  ]);
  
  const [edges, setEdges] = useState([
    { id: 0, from: 0, to: 1, capacity: 16, flow: 0 },
    { id: 1, from: 0, to: 5, capacity: 13, flow: 0 },
    { id: 2, from: 1, to: 2, capacity: 12, flow: 0 },
    { id: 3, from: 1, to: 3, capacity: 10, flow: 0 },
    { id: 4, from: 2, to: 4, capacity: 20, flow: 0 },
    { id: 5, from: 3, to: 2, capacity: 9, flow: 0 },
    { id: 6, from: 3, to: 4, capacity: 14, flow: 0 },
    { id: 7, from: 5, to: 3, capacity: 4, flow: 0 }
  ]);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false);
  const [showAddEdgeDialog, setShowAddEdgeDialog] = useState(false);
  const [showEditNodeDialog, setShowEditNodeDialog] = useState(false);
  const [showEditEdgeDialog, setShowEditEdgeDialog] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeX, setNewNodeX] = useState(200);
  const [newNodeY, setNewNodeY] = useState(200);
  const [newEdgeFrom, setNewEdgeFrom] = useState(0);
  const [newEdgeTo, setNewEdgeTo] = useState(0);
  const [newEdgeCapacity, setNewEdgeCapacity] = useState(10);
  
  // Algorithm state
  const [algorithm, setAlgorithm] = useState('bfs');
  const [source, setSource] = useState(0);
  const [sink, setSink] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step
  const [currentStep, setCurrentStep] = useState(0);
  const [maxFlow, setMaxFlow] = useState(0);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [algorithmSteps, setAlgorithmSteps] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [showCode, setShowCode] = useState(false);
  
  const svgRef = useRef(null);
  const animationRef = useRef(null);
  
  // Edit mode functions
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isRunning) {
      setIsRunning(false);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    }
  };
  
  // Node management
  const handleAddNode = () => {
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    const newNode = {
      id: newId,
      label: newNodeLabel || String.fromCharCode(65 + newId % 26), // A, B, C, ...
      x: newNodeX,
      y: newNodeY
    };
    
    setNodes([...nodes, newNode]);
    setShowAddNodeDialog(false);
    setNewNodeLabel('');
    setNewNodeX(200);
    setNewNodeY(200);
  };
  
  const handleEditNode = () => {
    if (selectedNode !== null) {
      setNodes(nodes.map(node => 
        node.id === selectedNode.id ? 
        { ...node, label: newNodeLabel || node.label } : 
        node
      ));
      setShowEditNodeDialog(false);
      setSelectedNode(null);
      setNewNodeLabel('');
    }
  };
  
  const handleDeleteNode = (nodeId) => {
    // Delete node
    setNodes(nodes.filter(node => node.id !== nodeId));
    
    // Delete all connected edges
    setEdges(edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId));
    
    // Reset selected node if needed
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    
    // Reset source/sink if needed
    if (source === nodeId) {
      setSource(nodes[0]?.id !== nodeId ? nodes[0]?.id : nodes[1]?.id || 0);
    }
    if (sink === nodeId) {
      setSink(nodes[nodes.length - 1]?.id !== nodeId ? nodes[nodes.length - 1]?.id : nodes[nodes.length - 2]?.id || 0);
    }
  };
  
  // Edge management
  const handleAddEdge = () => {
    if (newEdgeFrom === newEdgeTo) {
      alert("Source and target nodes cannot be the same");
      return;
    }
    
    // Check if edge already exists
    if (edges.some(edge => edge.from === parseInt(newEdgeFrom) && edge.to === parseInt(newEdgeTo))) {
      alert("This edge already exists");
      return;
    }
    
    const newId = edges.length > 0 ? Math.max(...edges.map(e => e.id)) + 1 : 0;
    const newEdge = {
      id: newId,
      from: parseInt(newEdgeFrom),
      to: parseInt(newEdgeTo),
      capacity: parseInt(newEdgeCapacity),
      flow: 0
    };
    
    setEdges([...edges, newEdge]);
    setShowAddEdgeDialog(false);
    setNewEdgeCapacity(10);
  };
  
  const handleEditEdge = () => {
    if (selectedEdge !== null) {
      setEdges(edges.map(edge => 
        edge.id === selectedEdge.id ? 
        { ...edge, capacity: parseInt(newEdgeCapacity) } : 
        edge
      ));
      setShowEditEdgeDialog(false);
      setSelectedEdge(null);
      setNewEdgeCapacity(10);
    }
  };
  
  const handleDeleteEdge = (edgeId) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
    
    if (selectedEdge && selectedEdge.id === edgeId) {
      setSelectedEdge(null);
    }
  };
  
  // Select node/edge for editing
  const selectNodeForEdit = (node) => {
    if (!isEditMode) return;
    
    setSelectedNode(node);
    setNewNodeLabel(node.label);
    setShowEditNodeDialog(true);
  };
  
  const selectEdgeForEdit = (edge) => {
    if (!isEditMode) return;
    
    setSelectedEdge(edge);
    setNewEdgeCapacity(edge.capacity);
    setShowEditEdgeDialog(true);
  };
  
  // Clear algorithm state
  const resetAlgorithm = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setMaxFlow(0);
    setVisitedNodes([]);
    setCurrentPath([]);
    setAlgorithmSteps([]);
    
    // Reset flows
    setEdges(edges.map(edge => ({ ...edge, flow: 0 })));
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  };
  
  // BFS implementation
  const bfs = (graph, source, sink) => {
    const steps = [];
    const visited = new Array(nodes.length).fill(false);
    const queue = [];
    const parent = new Array(nodes.length).fill(-1);
    
    visited[source] = true;
    queue.push(source);
    steps.push({
      type: 'visit',
      node: source,
      queue: [...queue],
      visited: [...visited],
      parent: [...parent]
    });
    
    while (queue.length > 0) {
      const u = queue.shift();
      
      // Find all adjacent vertices
      const adjacentEdges = graph.filter(edge => edge.from === u && edge.capacity > edge.flow);
      
      for (const edge of adjacentEdges) {
        const v = edge.to;
        
        if (!visited[v]) {
          steps.push({
            type: 'edge',
            from: u,
            to: v
          });
          
          visited[v] = true;
          queue.push(v);
          parent[v] = u;
          
          steps.push({
            type: 'visit',
            node: v,
            queue: [...queue],
            visited: [...visited],
            parent: [...parent]
          });
          
          if (v === sink) {
            // Construct path
            const path = [];
            let current = sink;
            
            while (current !== source) {
              path.unshift(current);
              current = parent[current];
            }
            path.unshift(source);
            
            steps.push({
              type: 'path',
              path: path
            });
            
            return { path, steps, parent };
          }
        }
      }
    }
    
    return { path: [], steps, parent };
  };
  
  // DFS implementation
  const dfs = (graph, source, sink) => {
    const steps = [];
    const visited = new Array(nodes.length).fill(false);
    const parent = new Array(nodes.length).fill(-1);
    
    const dfsVisit = (u) => {
      if (u === sink) return true;
      
      visited[u] = true;
      steps.push({
        type: 'visit',
        node: u,
        visited: [...visited],
        parent: [...parent]
      });
      
      // Find all adjacent vertices
      const adjacentEdges = graph.filter(edge => edge.from === u && edge.capacity > edge.flow);
      
      for (const edge of adjacentEdges) {
        const v = edge.to;
        
        if (!visited[v]) {
          steps.push({
            type: 'edge',
            from: u,
            to: v
          });
          
          parent[v] = u;
          
          if (dfsVisit(v)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    const foundPath = dfsVisit(source);
    
    if (foundPath) {
      // Construct path
      const path = [];
      let current = sink;
      
      while (current !== source) {
        path.unshift(current);
        current = parent[current];
      }
      path.unshift(source);
      
      steps.push({
        type: 'path',
        path: path
      });
      
      return { path, steps, parent };
    }
    
    return { path: [], steps, parent };
  };
  
  // Ford-Fulkerson algorithm
  const fordFulkerson = () => {
    const steps = [];
    let maxFlow = 0;
    const residualGraph = [...edges];
    
    while (true) {
      // Find augmenting path using BFS or DFS
      const { path, steps: pathSteps, parent } = algorithm === 'bfs' || algorithm === 'edmondsKarp' ? 
        bfs(residualGraph, source, sink) : 
        dfs(residualGraph, source, sink);
      
      steps.push(...pathSteps);
      
      if (path.length === 0) {
        break;
      }
      
      // Find minimum residual capacity along the path
      let pathFlow = Infinity;
      
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = residualGraph.find(e => e.from === u && e.to === v);
        pathFlow = Math.min(pathFlow, edge.capacity - edge.flow);
      }
      
      // Update residual capacities and reverse edges
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        
        const edgeIndex = residualGraph.findIndex(e => e.from === u && e.to === v);
        residualGraph[edgeIndex].flow += pathFlow;
        
        steps.push({
          type: 'updateFlow',
          from: u,
          to: v,
          flow: residualGraph[edgeIndex].flow,
          pathFlow
        });
      }
      
      maxFlow += pathFlow;
      
      steps.push({
        type: 'maxFlow',
        value: maxFlow
      });
    }
    
    return { maxFlow, steps };
  };
  
  // Edmonds-Karp algorithm is Ford-Fulkerson with BFS
  const edmondsKarp = () => {
    // Force BFS for Edmonds-Karp
    const savedAlgorithm = algorithm;
    setAlgorithm('bfs');
    const result = fordFulkerson();
    setAlgorithm(savedAlgorithm);
    return result;
  };
  
  // Run algorithm
  const runAlgorithm = () => {
    resetAlgorithm();
    
    // Check if we have enough nodes and edges
    if (nodes.length < 2) {
      alert("Need at least two nodes to run an algorithm");
      return;
    }
    
    if (edges.length === 0) {
      alert("Need at least one edge to run an algorithm");
      return;
    }
    
    let result;
    switch (algorithm) {
      case 'bfs':
        result = bfs(edges, source, sink);
        setAlgorithmSteps(result.steps);
        break;
      case 'dfs':
        result = dfs(edges, source, sink);
        setAlgorithmSteps(result.steps);
        break;
      case 'fordFulkerson':
        result = fordFulkerson();
        setAlgorithmSteps(result.steps);
        setMaxFlow(result.maxFlow);
        break;
      case 'edmondsKarp':
        result = edmondsKarp();
        setAlgorithmSteps(result.steps);
        setMaxFlow(result.maxFlow);
        break;
      default:
        break;
    }
    
    setIsRunning(true);
  };
  
  // Step through algorithm
  useEffect(() => {
    if (isRunning && currentStep < algorithmSteps.length) {
      animationRef.current = setTimeout(() => {
        const step = algorithmSteps[currentStep];
        
        if (step.type === 'visit') {
          setVisitedNodes(prev => [...prev, step.node]);
        } else if (step.type === 'path') {
          setCurrentPath(step.path);
        } else if (step.type === 'updateFlow') {
          setEdges(edges.map(edge => {
            if (edge.from === step.from && edge.to === step.to) {
              return { ...edge, flow: step.flow };
            }
            return edge;
          }));
        } else if (step.type === 'maxFlow') {
          setMaxFlow(step.value);
        }
        
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (currentStep >= algorithmSteps.length) {
      setIsRunning(false);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isRunning, currentStep, algorithmSteps, speed, edges]);
  
  // Node dragging functionality
  const handleMouseDown = (nodeId) => {
    if (isEditMode) {
      setIsDragging(true);
      setDraggedNode(nodeId);
    }
  };
  
  const handleMouseMove = (event) => {
    if (isDragging && draggedNode !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;
      
      setNodes(nodes.map(node => 
        node.id === draggedNode ? { ...node, x, y } : node
      ));
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };
  
  // Calculate edge path with curved lines for directed graph
  const getEdgePath = (edge) => {
    const source = nodes.find(node => node.id === edge.from);
    const target = nodes.find(node => node.id === edge.to);
    
    if (!source || !target) return '';

    // Check for bi-directional edges
    const hasReverseEdge = edges.some(e => e.from === edge.to && e.to === edge.from);
    
    if (hasReverseEdge) {
      // Create a curved path
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate curve control point
      const offset = 30; // curve offset
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      // Perpendicular vector
      const nx = -dy / distance;
      const ny = dx / distance;
      
      const controlX = midX + nx * offset;
      const controlY = midY + ny * offset;
      
      return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
    } else {
      // Straight line for single direction
      return `M${source.x},${source.y} L${target.x},${target.y}`;
    }
  };
  
  // Calculate edge label position
  const getEdgeLabelPosition = (edge) => {
    const source = nodes.find(node => node.id === edge.from);
    const target = nodes.find(node => node.id === edge.to);
    
    if (!source || !target) return { x: 0, y: 0 };
    
    // Check for bi-directional edges
    const hasReverseEdge = edges.some(e => e.from === edge.to && e.to === edge.from);
    
    if (hasReverseEdge) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate label position with offset for curved path
      const offset = 15; // offset from the curve
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      // Perpendicular vector
      const nx = -dy / distance;
      const ny = dx / distance;
      
      return {
        x: midX + nx * offset,
        y: midY + ny * offset
      };
    } else {
      // Label for straight line
      return {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2 - 10
      };
    }
  };
  
  // Export graph as JSON
  const exportGraph = () => {
    const graphData = {
      nodes,
      edges
    };
    
    const dataStr = JSON.stringify(graphData);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'graph-data.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Import graph from JSON
  const importGraph = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const graphData = JSON.parse(e.target.result);
        
        if (graphData.nodes && graphData.edges) {
          setNodes(graphData.nodes);
          setEdges(graphData.edges);
          resetAlgorithm();
        }
      } catch (error) {
        console.error('Error parsing graph data:', error);
      }
    };
    reader.readAsText(file);
  };
  
  // Algorithm code snippets
  const algorithmCode = {
    bfs: `// BFS implementation
const bfs = (graph, source, sink) => {
  const visited = new Array(nodes.length).fill(false);
  const queue = [];
  const parent = new Array(nodes.length).fill(-1);
  
  visited[source] = true;
  queue.push(source);
  
  while (queue.length > 0) {
    const u = queue.shift();
    
    // Find all adjacent vertices
    const adjacentEdges = graph.filter(
      edge => edge.from === u && edge.capacity > edge.flow
    );
    
    for (const edge of adjacentEdges) {
      const v = edge.to;
      
      if (!visited[v]) {
        visited[v] = true;
        queue.push(v);
        parent[v] = u;
        
        if (v === sink) {
          // Path found
          const path = [];
          let current = sink;
          
          while (current !== source) {
            path.unshift(current);
            current = parent[current];
          }
          path.unshift(source);
          
          return { path, parent };
        }
      }
    }
  }
  
  return { path: [], parent };
};`,
    
    dfs: `// DFS implementation
const dfs = (graph, source, sink) => {
  const visited = new Array(nodes.length).fill(false);
  const parent = new Array(nodes.length).fill(-1);
  
  const dfsVisit = (u) => {
    if (u === sink) return true;
    
    visited[u] = true;
    
    // Find all adjacent vertices
    const adjacentEdges = graph.filter(
      edge => edge.from === u && edge.capacity > edge.flow
    );
    
    for (const edge of adjacentEdges) {
      const v = edge.to;
      
      if (!visited[v]) {
        parent[v] = u;
        
        if (dfsVisit(v)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const foundPath = dfsVisit(source);
  
  if (foundPath) {
    // Construct path
    const path = [];
    let current = sink;
    
    while (current !== source) {
      path.unshift(current);
      current = parent[current];
    }
    path.unshift(source);
    
    return { path, parent };
  }
  
  return { path: [], parent };
};`,
    
    fordFulkerson: `// Ford-Fulkerson algorithm
const fordFulkerson = (graph, source, sink) => {
  let maxFlow = 0;
  const residualGraph = [...graph];
  
  while (true) {
    // Find augmenting path
    const { path, parent } = findPath(residualGraph, source, sink);
    
    if (path.length === 0) {
      break;
    }
    
    // Find minimum residual capacity along the path
    let pathFlow = Infinity;
    
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const edge = residualGraph.find(e => e.from === u && e.to === v);
      pathFlow = Math.min(pathFlow, edge.capacity - edge.flow);
    }
    
    // Update residual capacities
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      
      const edgeIndex = residualGraph.findIndex(
        e => e.from === u && e.to === v
      );
      residualGraph[edgeIndex].flow += pathFlow;
    }
    
    maxFlow += pathFlow;
  }
  
  return maxFlow;
};`,
    
    edmondsKarp: `// Edmonds-Karp algorithm
// It's Ford-Fulkerson with BFS for finding augmenting paths
const edmondsKarp = (graph, source, sink) => {
  let maxFlow = 0;
  const residualGraph = [...graph];
  
  while (true) {
    // Find augmenting path using BFS
    const { path, parent } = bfs(residualGraph, source, sink);
    
    if (path.length === 0) {
      break;
    }
    
    // Find minimum residual capacity along the path
    let pathFlow = Infinity;
    
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const edge = residualGraph.find(e => e.from === u && e.to === v);
      pathFlow = Math.min(pathFlow, edge.capacity - edge.flow);
    }
    
    // Update residual capacities
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      
      const edgeIndex = residualGraph.findIndex(
        e => e.from === u && e.to === v
      );
      residualGraph[edgeIndex].flow += pathFlow;
    }
    
    maxFlow += pathFlow;
  }
  
  return maxFlow;
};`
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Graph Algorithms Visualization</h1>
            <p className="text-sm">Design and Analysis of Algorithms Project</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-2 rounded flex items-center ${
                isEditMode ? 'bg-yellow-500 text-white' : 'bg-white text-indigo-600'
              }`}
              onClick={toggleEditMode}
            >
              <Edit size={16} className="mr-1" />
              {isEditMode ? 'Exit Edit Mode' : 'Edit Graph'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Algorithm Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
            <select
              className="w-full border rounded p-2"
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value);
                resetAlgorithm();
              }}
            >
              <option value="bfs">BFS Traversal</option>
              <option value="dfs">DFS Traversal</option>
              <option value="fordFulkerson">Ford-Fulkerson</option>
              <option value="edmondsKarp">Edmonds-Karp</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Node</label>
            <select
              className="w-full border rounded p-2"
              value={source}
              onChange={(e) => setSource(parseInt(e.target.value))}
            >
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} (ID: {node.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sink Node</label>
            <select
              className="w-full border rounded p-2"
              value={sink}
              onChange={(e) => setSink(parseInt(e.target.value))}
            >
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} (ID: {node.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animation Speed: {speed}ms
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex space-x-2 mb-6">
  <button
    className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded flex items-center justify-center"
    onClick={runAlgorithm}
    disabled={isRunning}
  >
    <Play size={16} className="mr-1" />
    Run
  </button>
  
  <button
    className="flex-1 bg-red-500 text-white px-3 py-2 rounded flex items-center justify-center"
    onClick={resetAlgorithm}
  >
    <RotateCcw size={16} className="mr-1" />
    Reset
  </button>
</div>

<div className="mt-auto">
  <div className="flex space-x-2 mb-2">
    <button
      className="flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded flex items-center justify-center"
      onClick={exportGraph}
    >
      <Download size={16} className="mr-1" />
      Export
    </button>
    
    <label className="flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded flex items-center justify-center cursor-pointer">
      <Upload size={16} className="mr-1" />
      Import
      <input
        type="file"
        accept=".json"
        onChange={importGraph}
        className="hidden"
      />
    </label>
  </div>
  
  <button
    className="w-full bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded flex items-center justify-center"
    onClick={() => setShowCode(!showCode)}
  >
    <Code size={16} className="mr-1" />
    {showCode ? 'Hide Code' : 'Show Code'}
  </button>
</div>
</div>

{/* Graph Area */}
<div className="flex-1 relative overflow-auto">
  <div className="p-4">
    {/* Status bar */}
    <div className="mb-4 bg-white shadow p-3 rounded">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-semibold">Status:</span> 
          {isRunning ? 'Running' : 'Ready'}
          {algorithm === 'fordFulkerson' || algorithm === 'edmondsKarp' ? 
            ` - Max Flow: ${maxFlow}` : ''}
        </div>
        
        <div>
          <span className="font-semibold">Current Step:</span> {currentStep}/{algorithmSteps.length}
        </div>
        
        {isEditMode && (
          <div className="flex space-x-2">
            <button
              className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
              onClick={() => setShowAddNodeDialog(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Node
            </button>
            
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded flex items-center"
              onClick={() => setShowAddEdgeDialog(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Edge
            </button>
          </div>
        )}
      </div>
    </div>
    
       {/* SVG Graph */}
    <div className="border bg-white shadow-md rounded pl-60 pt-20 flex justify-center items-center">
      <svg 
        ref={svgRef}
        width="80%" 
        height="600" 
        className="rounded"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Edges */}
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.from);
          const target = nodes.find(n => n.id === edge.to);
          const labelPos = getEdgeLabelPosition(edge);
          
          const isInPath = currentPath.length > 0 && 
            currentPath.indexOf(edge.from) !== -1 && 
            currentPath.indexOf(edge.to) !== -1 &&
            currentPath.indexOf(edge.from) === currentPath.indexOf(edge.to) - 1;
          
          return (
            <g key={edge.id} onClick={() => selectEdgeForEdit(edge)}>
              <path
                d={getEdgePath(edge)}
                fill="none"
                stroke={isInPath ? '#ff9800' : '#999'}
                strokeWidth={isInPath ? 3 : 1.5}
                markerEnd="url(#arrowhead)"
                className={isEditMode ? 'cursor-pointer' : ''}
              />
              
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                className={isEditMode ? 'cursor-pointer' : ''}
              >
                {edge.flow > 0 ? `${edge.flow}/${edge.capacity}` : `${edge.capacity}`}
              </text>
            </g>
          );
        })}
        
        {/* Nodes */}
        {nodes.map(node => {
          const isSource = node.id === source;
          const isSink = node.id === sink;
          const isVisited = visitedNodes.includes(node.id);
          const isInPath = currentPath.includes(node.id);
          
          let nodeColor = '#3f51b5';
          if (isSource) nodeColor = '#4caf50';
          if (isSink) nodeColor = '#f44336';
          if (isVisited) nodeColor = '#ff9800';
          if (isInPath) nodeColor = '#e91e63';
          
          return (
            <g 
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={() => handleMouseDown(node.id)}
              onClick={() => selectNodeForEdit(node)}
              className={isEditMode ? 'cursor-move' : ''}
            >
              <circle
                r={20}
                fill={nodeColor}
                stroke="#444"
                strokeWidth={1.5}
              />
              
              <text
                textAnchor="middle"
                y="5"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {node.label}
              </text>
            </g>
          );
        })}
        
        {/* Arrow marker def */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
          </marker>
        </defs>
      </svg>
    </div>
    
    {/* Code View */}
    {showCode && (
      <div className="mt-4 bg-white shadow-md rounded p-4">
        <h3 className="text-lg font-semibold mb-2">Algorithm Code</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <code>{algorithmCode[algorithm]}</code>
        </pre>
      </div>
    )}
  </div>
</div>

{/* Dialogs */}
{showAddNodeDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-xl font-semibold mb-4">Add New Node</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={newNodeLabel}
          onChange={(e) => setNewNodeLabel(e.target.value)}
          placeholder="Node label (e.g. A, B, C...)"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={newNodeX}
          onChange={(e) => setNewNodeX(parseInt(e.target.value))}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={newNodeY}
          onChange={(e) => setNewNodeY(parseInt(e.target.value))}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowAddNodeDialog(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={handleAddNode}
        >
          Add Node
        </button>
      </div>
    </div>
  </div>
)}

{showEditNodeDialog && selectedNode && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-xl font-semibold mb-4">Edit Node</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={newNodeLabel}
          onChange={(e) => setNewNodeLabel(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowEditNodeDialog(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={handleEditNode}
        >
          Update Node
        </button>
      </div>
    </div>
  </div>
)}

{showAddEdgeDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-xl font-semibold mb-4">Add New Edge</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">From Node</label>
        <select
          className="w-full border rounded p-2"
          value={newEdgeFrom}
          onChange={(e) => setNewEdgeFrom(e.target.value)}
        >
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.label} (ID: {node.id})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">To Node</label>
        <select
          className="w-full border rounded p-2"
          value={newEdgeTo}
          onChange={(e) => setNewEdgeTo(e.target.value)}
        >
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.label} (ID: {node.id})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={newEdgeCapacity}
          onChange={(e) => setNewEdgeCapacity(e.target.value)}
          min="1"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowAddEdgeDialog(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={handleAddEdge}
        >
          Add Edge
        </button>
      </div>
    </div>
  </div>
)}

{showEditEdgeDialog && selectedEdge && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-xl font-semibold mb-4">Edit Edge</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={newEdgeCapacity}
          onChange={(e) => setNewEdgeCapacity(e.target.value)}
          min="1"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowEditEdgeDialog(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={handleEditEdge}
        >
          Update Edge
        </button>
      </div>
    </div>
  </div>
)}
</div>
</div>)}

export default App;
