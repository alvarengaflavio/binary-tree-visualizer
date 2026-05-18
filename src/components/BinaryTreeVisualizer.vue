<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch } from "vue";
import {
  AVLTree,
  type NodeDepthInfo,
  type TraversalType,
} from "../models/AVLTree";

// ========== ESTADO DA ÁRVORE ==========
const bst = ref(new AVLTree());
const version = ref(0);
const newNodes = ref<Set<number>>(new Set());
const removingNodes = ref<Set<number>>(new Set());
const inputValue = ref<number | null>(null);
const message = ref("");
const messageType = ref<"success" | "error" | "info">("info");

// Percurso
const traversalType = ref<TraversalType>("inorder");
const traversalActive = ref(false);
const traversalSequence = ref<number[]>([]);
const activeTraversalNode = ref<number | null>(null);
let traversalTimer: number | null = null;

// Busca
const searchValue = ref<number | null>(null);
const searchActive = ref(false);
const searchPath = ref<number[]>([]);
const searchIndex = ref(-1);
const searchFound = ref<boolean | null>(null);
const highlightedSearchNodes = ref<Set<number>>(new Set());
const highlightedSearchEdges = ref<Set<number>>(new Set());
let searchTimer: number | null = null;

// ========== ZOOM & PAN ==========
const zoomLevel = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const svgContainer = ref<HTMLElement | null>(null);

const minZoom = 0.2;
const maxZoom = 5.0;

// ========== LAYOUT ==========
interface NodePosition {
  value: number;
  x: number;
  y: number;
  parentValue: number | null;
  depth: number;
}
interface Edge {
  childValue: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const layout = computed(() => {
  version.value;
  const nodesWithDepth = bst.value.getNodesWithDepth();
  const positions = new Map<number, NodePosition>();
  const edges: Edge[] = [];

  const H_SPACING = 65;
  const V_SPACING = 80;
  const MARGIN_X = 60;
  const MARGIN_Y = 60;

  nodesWithDepth.forEach((item, index) => {
    const x = MARGIN_X + index * H_SPACING;
    const y = MARGIN_Y + item.depth * V_SPACING;
    positions.set(item.node.value, {
      value: item.node.value,
      x,
      y,
      parentValue: item.parent?.value ?? null,
      depth: item.depth,
    });
  });

  nodesWithDepth.forEach((item) => {
    if (item.parent) {
      const pPos = positions.get(item.parent.value);
      const cPos = positions.get(item.node.value);
      if (pPos && cPos)
        edges.push({
          childValue: item.node.value,
          x1: pPos.x,
          y1: pPos.y,
          x2: cPos.x,
          y2: cPos.y,
        });
    }
  });
  return { positions, edges };
});

const nodeList = computed(() => Array.from(layout.value.positions.values()));

const svgViewBox = computed(() => {
  const nodes = nodeList.value;
  if (nodes.length === 0) return "0 0 300 200";
  const minX = Math.min(...nodes.map((n) => n.x)) - 80;
  const maxX = Math.max(...nodes.map((n) => n.x)) + 80;
  const minY = Math.min(...nodes.map((n) => n.y)) - 80;
  const maxY = Math.max(...nodes.map((n) => n.y)) + 80;
  return `${minX} ${minY} ${Math.max(maxX - minX, 300)} ${Math.max(maxY - minY, 200)}`;
});

// Container do SVG deve ter altura definida (usaremos 500px fixos com possibilidade de redimensionamento, mas responsivo)
const svgContainerHeight = computed(() =>
  Math.max(400, Math.max(...nodeList.value.map((n) => n.y), 100) + 150),
);

// ========== AÇÕES DA ÁRVORE ==========
function showMessage(msg: string, type: "success" | "error" | "info" = "info") {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 3000);
}
function isValidNumber(val: any): val is number {
  return (
    val !== null && val !== undefined && !isNaN(val) && Number.isFinite(val)
  );
}

function insertValue() {
  const val = inputValue.value;
  if (!isValidNumber(val)) {
    showMessage("Digite um valor válido.", "error");
    return;
  }
  if (!bst.value.contains(val)) {
    bst.value.insert(val);
    newNodes.value.add(val);
    version.value++;
    showMessage(`Valor ${val} inserido!`, "success");
    setTimeout(() => {
      newNodes.value.delete(val);
      newNodes.value = new Set(newNodes.value);
    }, 600);
  } else {
    showMessage(`Valor ${val} já existe!`, "error");
  }
  inputValue.value = null;
}

function removeValue() {
  const val = inputValue.value;
  if (!isValidNumber(val)) {
    showMessage("Digite um valor válido.", "error");
    return;
  }
  if (removingNodes.value.has(val)) {
    showMessage("Aguardando...", "info");
    return;
  }
  if (bst.value.contains(val)) {
    removingNodes.value.add(val);
    removingNodes.value = new Set(removingNodes.value);
    showMessage(`Removendo ${val}...`, "info");
    setTimeout(() => {
      bst.value.remove(val);
      removingNodes.value.delete(val);
      removingNodes.value = new Set(removingNodes.value);
      version.value++;
      showMessage(`Valor ${val} removido.`, "success");
    }, 500);
  } else {
    showMessage(`Valor ${val} não encontrado!`, "error");
  }
  inputValue.value = null;
}

function clearTree() {
  bst.value.clear();
  newNodes.value = new Set();
  removingNodes.value = new Set();
  stopAllAnimations();
  version.value++;
  showMessage("Árvore limpa!", "info");
}

function randomTree() {
  bst.value.clear();
  stopAllAnimations();
  const count = Math.floor(Math.random() * 22) + 10;
  const values = new Set<number>();
  while (values.size < count) values.add(Math.floor(Math.random() * 127) + 1);
  values.forEach((v) => bst.value.insert(v));
  newNodes.value = new Set(values);
  version.value++;
  showMessage(`Árvore aleatória com ${count} nós gerada!`, "success");
  setTimeout(() => {
    newNodes.value = new Set();
  }, 600);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") insertValue();
}

function stopAllAnimations() {
  stopTraversal();
  stopSearch();
}

// Percurso
function startTraversal() {
  if (traversalActive.value || searchActive.value) return;
  if (bst.value.getNodeCount() === 0) {
    showMessage("Árvore vazia!", "info");
    return;
  }
  let seq: number[] = [];
  if (traversalType.value === "preorder") seq = bst.value.preorderTraversal();
  else if (traversalType.value === "inorder")
    seq = bst.value.inorderTraversal();
  else seq = bst.value.postorderTraversal();
  traversalSequence.value = seq;
  traversalActive.value = true;
  activeTraversalNode.value = null;
  let index = 0;
  const highlight = () => {
    if (index < seq.length) {
      activeTraversalNode.value = seq[index];
      index++;
      traversalTimer = window.setTimeout(highlight, 800);
    } else {
      activeTraversalNode.value = null;
      traversalActive.value = false;
      showMessage(`Percurso ${traversalType.value} concluído!`, "success");
    }
  };
  highlight();
}
function stopTraversal() {
  if (traversalTimer !== null) {
    clearTimeout(traversalTimer);
    traversalTimer = null;
  }
  traversalActive.value = false;
  activeTraversalNode.value = null;
}

// Busca
function startSearch() {
  const val = searchValue.value;
  if (!isValidNumber(val)) {
    showMessage("Digite um valor para buscar.", "error");
    return;
  }
  if (searchActive.value || traversalActive.value) {
    showMessage("Aguarde...", "info");
    return;
  }
  if (bst.value.getNodeCount() === 0) {
    showMessage("Árvore vazia!", "info");
    return;
  }
  const { path, found } = bst.value.searchPath(val);
  searchPath.value = path;
  searchFound.value = found;
  searchActive.value = true;
  searchIndex.value = -1;
  highlightedSearchNodes.value = new Set();
  highlightedSearchEdges.value = new Set();
  let index = 0;
  const step = () => {
    if (index < path.length) {
      const cur = path[index];
      const ns = new Set(highlightedSearchNodes.value);
      ns.add(cur);
      const es = new Set(highlightedSearchEdges.value);
      if (index > 0) es.add(cur);
      highlightedSearchNodes.value = ns;
      highlightedSearchEdges.value = es;
      searchIndex.value = index;
      index++;
      searchTimer = window.setTimeout(step, 700);
    } else {
      searchActive.value = false;
      const msg = found
        ? `Valor ${val} encontrado! (${path.length} iterações)`
        : `Valor ${val} NÃO encontrado. (${path.length} iterações)`;
      showMessage(msg, found ? "success" : "info");
      setTimeout(() => {
        highlightedSearchNodes.value = new Set();
        highlightedSearchEdges.value = new Set();
        searchIndex.value = -1;
      }, 1500);
    }
  };
  step();
}
function stopSearch() {
  if (searchTimer !== null) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchActive.value = false;
  highlightedSearchNodes.value = new Set();
  highlightedSearchEdges.value = new Set();
  searchIndex.value = -1;
}

// ========== ZOOM & PAN handlers ==========
function zoomIn() {
  zoomLevel.value = Math.min(maxZoom, zoomLevel.value * 1.3);
}
function zoomOut() {
  zoomLevel.value = Math.max(minZoom, zoomLevel.value / 1.3);
}
function resetZoom() {
  zoomLevel.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const container = svgContainer.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.min(maxZoom, Math.max(minZoom, zoomLevel.value * delta));
  const zoomRatio = newZoom / zoomLevel.value;

  // Ajusta pan para manter o ponto do mouse fixo
  panX.value = mouseX - zoomRatio * (mouseX - panX.value);
  panY.value = mouseY - zoomRatio * (mouseY - panY.value);
  zoomLevel.value = newZoom;
}

function onMouseDown(e: MouseEvent) {
  // Inicia pan se clicar no fundo do SVG (não em um nó)
  if ((e.target as HTMLElement).closest(".node-position, .tree-edge")) return;
  isPanning.value = true;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (!isPanning.value) return;
  const dx = e.clientX - lastMouseX.value;
  const dy = e.clientY - lastMouseY.value;
  panX.value += dx;
  panY.value += dy;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
}

function onMouseUp() {
  isPanning.value = false;
}

onMounted(() => {
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
});
onBeforeUnmount(() => {
  window.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("mousemove", onMouseMove);
  stopTraversal();
  stopSearch();
});

// ========== HELPERS DE CLASSE ==========
const isNodeNew = (v: number) => newNodes.value.has(v);
const isNodeRemoving = (v: number) => removingNodes.value.has(v);
const isTraversalActiveNode = (v: number) => activeTraversalNode.value === v;
const isSearchHighlightedNode = (v: number) =>
  highlightedSearchNodes.value.has(v);
const isSearchEdge = (v: number) => highlightedSearchEdges.value.has(v);

function nodeAnimClass(v: number) {
  if (isNodeRemoving(v)) return "node-exit";
  if (isNodeNew(v)) return "node-enter";
  return "";
}
function edgeAnimClass(v: number) {
  if (removingNodes.value.has(v)) return "edge-exit";
  if (newNodes.value.has(v)) return "edge-enter";
  return "";
}

const traversalLabel = computed(
  () =>
    ({ preorder: "Pré-Ordem", inorder: "Em Ordem", postorder: "Pós-Ordem" })[
      traversalType.value
    ],
);
</script>

<template>
  <div class="visualizer">
    <h2>🌳 Árvore AVL</h2>

    <div class="controls">
      <div class="input-row">
        <input
          v-model.number="inputValue"
          type="number"
          placeholder="Valor..."
          @keydown="handleKeydown"
          class="value-input"
        />
        <button @click="insertValue" class="btn btn-insert">➕ Inserir</button>
        <button @click="removeValue" class="btn btn-remove">➖ Remover</button>
      </div>
      <div class="btn-row">
        <button @click="randomTree" class="btn btn-random">🎲 Aleatória</button>
        <button @click="clearTree" class="btn btn-clear">🗑️ Limpar</button>
      </div>
      <div class="search-row">
        <input
          v-model.number="searchValue"
          type="number"
          placeholder="Buscar..."
          class="value-input"
          :disabled="searchActive"
        />
        <button
          @click="startSearch"
          class="btn btn-search"
          :disabled="searchActive || traversalActive"
        >
          🔍 Buscar
        </button>
        <button v-if="searchActive" @click="stopSearch" class="btn btn-stop">
          ⏹️ Parar
        </button>
      </div>
      <div class="traversal-controls">
        <select
          v-model="traversalType"
          class="traversal-select"
          :disabled="traversalActive || searchActive"
        >
          <option value="preorder">Pré-Ordem</option>
          <option value="inorder">Em Ordem</option>
          <option value="postorder">Pós-Ordem</option>
        </select>
        <button
          @click="startTraversal"
          class="btn btn-traverse"
          :disabled="traversalActive || searchActive"
        >
          ▶️ Percorrer
        </button>
        <button
          v-if="traversalActive"
          @click="stopTraversal"
          class="btn btn-stop"
        >
          ⏹️ Parar
        </button>
      </div>
      <!-- Zoom controls -->
      <div class="zoom-controls">
        <button @click="zoomOut" class="btn btn-zoom" title="Zoom out">
          🔍➖
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomIn" class="btn btn-zoom" title="Zoom in">
          🔍➕
        </button>
        <button @click="resetZoom" class="btn btn-zoom" title="Reset zoom">
          ↺
        </button>
      </div>
    </div>

    <div v-if="message" :class="['message', `msg-${messageType}`]">
      {{ message }}
    </div>

    <div
      v-if="
        traversalActive || (traversalSequence.length > 0 && !traversalActive)
      "
      class="traversal-sequence"
    >
      <span class="seq-label">{{ traversalLabel }}:</span>
      <span class="seq-values">
        <span
          v-for="(val, idx) in traversalSequence"
          :key="idx"
          class="seq-item"
          :class="{ 'seq-active': val === activeTraversalNode }"
          >{{ val }}</span
        >
      </span>
    </div>

    <div
      ref="svgContainer"
      class="tree-area"
      @wheel="onWheel"
      @mousedown="onMouseDown"
      :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
    >
      <div v-if="nodeList.length === 0" class="empty-tree">
        🌱 Árvore vazia. Insira valores!
      </div>
      <svg
        v-else
        :viewBox="svgViewBox"
        class="tree-svg"
        :style="{ height: svgContainerHeight + 'px' }"
      >
        <g :transform="`translate(${panX}, ${panY}) scale(${zoomLevel})`">
          <!-- Arestas -->
          <line
            v-for="edge in layout.edges"
            :key="'e-' + edge.childValue"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            :class="[
              'tree-edge',
              edgeAnimClass(edge.childValue),
              { 'edge-search': isSearchEdge(edge.childValue) },
            ]"
          />
          <!-- Nós -->
          <g
            v-for="node in nodeList"
            :key="'n-' + node.value"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node-position"
          >
            <g :class="['node-inner', nodeAnimClass(node.value)]">
              <circle
                r="24"
                class="node-circle"
                :class="{
                  'circle-new': isNodeNew(node.value),
                  'circle-removing': isNodeRemoving(node.value),
                  'circle-traversal': isTraversalActiveNode(node.value),
                  'circle-search': isSearchHighlightedNode(node.value),
                }"
              />
              <text
                class="node-text"
                text-anchor="middle"
                dominant-baseline="central"
              >
                {{ node.value }}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <div class="legend">
      <span><span class="dot dot-new"></span> Novo</span>
      <span><span class="dot dot-removing"></span> Removendo</span>
      <span><span class="dot dot-traversal"></span> Percurso</span>
      <span><span class="dot dot-search"></span> Busca</span>
      <span><span class="dot dot-normal"></span> Normal</span>
    </div>
  </div>
</template>

<style scoped>
.visualizer {
  max-width: 1300px;
  margin: 0 auto;
  padding: 16px 20px;
}
h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 12px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 10px;
}
.input-row,
.btn-row,
.traversal-controls,
.search-row,
.zoom-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}
.value-input {
  width: 120px;
  padding: 8px 12px;
  font-size: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
}
.value-input:focus {
  border-color: #4a90d9;
}
.traversal-select {
  padding: 8px 12px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
}

.btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}
.btn:active:not(:disabled) {
  transform: translateY(0);
}
.btn-insert {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  color: #1a5c3a;
}
.btn-remove {
  background: linear-gradient(135deg, #f5576c, #ff6b6b);
}
.btn-random {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.btn-clear {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.btn-traverse {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: #1a3c4a;
}
.btn-stop {
  background: linear-gradient(135deg, #f5576c, #f093fb);
}
.btn-search {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #4a2c2c;
}
.btn-zoom {
  background: #6c757d;
  color: white;
  padding: 6px 10px;
  font-size: 14px;
}

.zoom-level {
  font-size: 13px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  color: #2c3e50;
}

.message {
  text-align: center;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-weight: 500;
  animation: fadeSlide 0.3s;
}
.msg-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.msg-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.msg-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.traversal-sequence {
  text-align: center;
  margin: 8px 0;
  font-size: 15px;
  color: #2c3e50;
}
.seq-label {
  font-weight: 600;
  margin-right: 6px;
}
.seq-values {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
.seq-item {
  background: #e9ecef;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.seq-active {
  background: #ffd700;
  border-color: #f39c12;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tree-area {
  background: #f8f9fa;
  border-radius: 16px;
  border: 2px solid #dee2e6;
  overflow: hidden;
  position: relative;
  height: 500px;
  max-height: 70vh;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}
.tree-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.empty-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.2rem;
  color: #6c757d;
}

.tree-edge {
  stroke: #adb5bd;
  stroke-width: 2.5;
  stroke-linecap: round;
  transition:
    opacity 0.4s ease,
    stroke 0.3s;
}
.tree-edge.edge-enter {
  animation: fadeIn 0.5s;
}
.tree-edge.edge-exit {
  animation: fadeOut 0.4s forwards;
}
.tree-edge.edge-search {
  stroke: #f39c12;
  stroke-width: 3.5;
  filter: drop-shadow(0 0 4px rgba(243, 156, 18, 0.6));
}

.node-position {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.node-inner {
  transform-box: fill-box;
  transform-origin: center;
}
.node-inner.node-enter {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.node-inner.node-exit {
  animation: popOut 0.4s forwards;
  pointer-events: none;
}

.node-circle {
  fill: #4a90d9;
  stroke: #357abd;
  stroke-width: 3;
  transition:
    fill 0.4s,
    stroke 0.4s;
}
.circle-new {
  fill: #43e97b;
  stroke: #2ecc71;
}
.circle-removing {
  fill: #f5576c;
  stroke: #e74c3c;
}
.circle-traversal {
  fill: #ffd700;
  stroke: #f39c12;
  animation: pulse 0.8s infinite alternate;
}
.circle-search {
  fill: #fda085;
  stroke: #e67e22;
  filter: drop-shadow(0 0 6px rgba(230, 126, 34, 0.7));
}

@keyframes pulse {
  from {
    stroke-width: 3;
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
  }
  to {
    stroke-width: 6;
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.9));
  }
}
@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes popOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.node-text {
  fill: white;
  font-size: 15px;
  font-weight: 700;
  pointer-events: none;
  user-select: none;
}

.legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
  font-size: 13px;
  color: #495057;
}
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
  border: 2px solid;
}
.dot-new {
  background: #43e97b;
  border-color: #2ecc71;
}
.dot-removing {
  background: #f5576c;
  border-color: #e74c3c;
}
.dot-traversal {
  background: #ffd700;
  border-color: #f39c12;
}
.dot-search {
  background: #fda085;
  border-color: #e67e22;
}
.dot-normal {
  background: #4a90d9;
  border-color: #357abd;
}
</style>
