<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import {
  AVLTree,
  type NodeDepthInfo,
  type TraversalType,
} from "../models/AVLTree";

// ========== ESTADO ==========
const bst = ref(new AVLTree());
const version = ref(0); // contador para forçar reatividade
const newNodes = ref<Set<number>>(new Set()); // nós em animação de entrada
const removingNodes = ref<Set<number>>(new Set()); // nós em animação de saída
const inputValue = ref<number | null>(null);
const message = ref("");
const messageType = ref<"success" | "error" | "info">("info");

// Estado do percurso animado
const traversalType = ref<TraversalType>("inorder");
const traversalActive = ref(false);
const traversalSequence = ref<number[]>([]);
const activeTraversalNode = ref<number | null>(null); // valor do nó atualmente destacado
let traversalTimer: number | null = null;

// ========== TIPOS DE LAYOUT ==========
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

// ========== LAYOUT COMPUTADO ==========
const layout = computed(() => {
  version.value; // dependência de reatividade
  const nodesWithDepth = bst.value.getNodesWithDepth();
  const positions = new Map<number, NodePosition>();
  const edges: Edge[] = [];

  const H_SPACING = 65;
  const V_SPACING = 80;
  const MARGIN_X = 50;
  const MARGIN_Y = 50;

  nodesWithDepth.forEach((item: NodeDepthInfo, index: number) => {
    const x = MARGIN_X + index * H_SPACING;
    const y = MARGIN_Y + item.depth * V_SPACING;
    positions.set(item.node.value, {
      value: item.node.value,
      x,
      y,
      parentValue: item.parent ? item.parent.value : null,
      depth: item.depth,
    });
  });

  nodesWithDepth.forEach((item: NodeDepthInfo) => {
    if (item.parent) {
      const parentPos = positions.get(item.parent.value);
      const childPos = positions.get(item.node.value);
      if (parentPos && childPos) {
        edges.push({
          childValue: item.node.value,
          x1: parentPos.x,
          y1: parentPos.y,
          x2: childPos.x,
          y2: childPos.y,
        });
      }
    }
  });

  return { positions, edges };
});

const nodeList = computed(() => Array.from(layout.value.positions.values()));

const svgViewBox = computed(() => {
  const nodes = nodeList.value;
  if (nodes.length === 0) return "0 0 300 150";
  const minX = Math.min(...nodes.map((n) => n.x)) - 60;
  const maxX = Math.max(...nodes.map((n) => n.x)) + 60;
  const minY = Math.min(...nodes.map((n) => n.y)) - 60;
  const maxY = Math.max(...nodes.map((n) => n.y)) + 60;
  return `${minX} ${minY} ${Math.max(maxX - minX, 300)} ${Math.max(maxY - minY, 150)}`;
});

const svgHeight = computed(() => {
  const nodes = nodeList.value;
  if (nodes.length === 0) return 200;
  return Math.max(Math.max(...nodes.map((n) => n.y)) + 120, 300);
});

// ========== AÇÕES ==========
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
    showMessage("Digite um valor numérico válido.", "error");
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
    showMessage(`Valor ${val} já existe na árvore!`, "error");
  }
  inputValue.value = null;
}

function removeValue() {
  const val = inputValue.value;
  if (!isValidNumber(val)) {
    showMessage("Digite um valor numérico válido.", "error");
    return;
  }
  if (removingNodes.value.has(val)) {
    showMessage("Aguardando a remoção atual...", "info");
    return;
  }
  if (bst.value.contains(val)) {
    removingNodes.value.add(val);
    removingNodes.value = new Set(removingNodes.value);
    showMessage(`Removendo valor ${val}...`, "info");
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
  stopTraversal(); // interrompe percurso
  version.value++;
  showMessage("Árvore limpa!", "info");
}

function randomTree() {
  bst.value.clear();
  stopTraversal();
  const count = Math.floor(Math.random() * 8) + 5;
  const values = new Set<number>();
  while (values.size < count) {
    values.add(Math.floor(Math.random() * 100) + 1);
  }
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

// ========== PERCURSO ANIMADO ==========
function startTraversal() {
  if (traversalActive.value) return;
  if (bst.value.getNodeCount() === 0) {
    showMessage("Árvore vazia!", "info");
    return;
  }

  // Gera a sequência de acordo com o tipo selecionado
  let seq: number[] = [];
  switch (traversalType.value) {
    case "preorder":
      seq = bst.value.preorderTraversal();
      break;
    case "inorder":
      seq = bst.value.inorderTraversal();
      break;
    case "postorder":
      seq = bst.value.postorderTraversal();
      break;
  }
  traversalSequence.value = seq;
  traversalActive.value = true;
  activeTraversalNode.value = null;

  let index = 0;
  const highlightNext = () => {
    if (index < seq.length) {
      activeTraversalNode.value = seq[index];
      index++;
      traversalTimer = window.setTimeout(highlightNext, 800); // 800ms por nó
    } else {
      // finaliza
      activeTraversalNode.value = null;
      traversalActive.value = false;
      showMessage(`Percurso ${traversalType.value} concluído!`, "success");
    }
  };
  highlightNext();
}

function stopTraversal() {
  if (traversalTimer !== null) {
    clearTimeout(traversalTimer);
    traversalTimer = null;
  }
  traversalActive.value = false;
  activeTraversalNode.value = null;
}

onBeforeUnmount(() => {
  stopTraversal();
});

// ========== HELPERS DE CLASSE ==========
function isNodeNew(val: number) {
  return newNodes.value.has(val);
}
function isNodeRemoving(val: number) {
  return removingNodes.value.has(val);
}
function isTraversalActive(val: number) {
  return activeTraversalNode.value === val;
}

function getNodeAnimClass(val: number) {
  if (isNodeRemoving(val)) return "node-exit";
  if (isNodeNew(val)) return "node-enter";
  return "";
}

function getEdgeAnimClass(childVal: number) {
  if (removingNodes.value.has(childVal)) return "edge-exit";
  if (newNodes.value.has(childVal)) return "edge-enter";
  return "";
}

// Rótulo do tipo de percurso
const traversalLabel = computed(() => {
  switch (traversalType.value) {
    case "preorder":
      return "Pré-Ordem";
    case "inorder":
      return "Em Ordem";
    case "postorder":
      return "Pós-Ordem";
  }
});
</script>

<template>
  <div class="visualizer">
    <h2>🌳 Árvore AVL</h2>

    <!-- Controles -->
    <div class="controls">
      <div class="input-row">
        <input
          v-model.number="inputValue"
          type="number"
          placeholder="Digite um valor..."
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

      <!-- Percurso -->
      <div class="traversal-controls">
        <select
          v-model="traversalType"
          class="traversal-select"
          :disabled="traversalActive"
        >
          <option value="preorder">Pré-Ordem</option>
          <option value="inorder">Em Ordem</option>
          <option value="postorder">Pós-Ordem</option>
        </select>
        <button
          @click="startTraversal"
          class="btn btn-traverse"
          :disabled="traversalActive"
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
    </div>

    <!-- Feedback -->
    <div v-if="message" :class="['message', `msg-${messageType}`]">
      {{ message }}
    </div>

    <!-- Sequência de percurso -->
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
        >
          {{ val }}
        </span>
      </span>
    </div>

    <!-- Área da árvore -->
    <div class="tree-area">
      <div v-if="nodeList.length === 0" class="empty-tree">
        🌱 A árvore está vazia. Insira valores!
      </div>
      <svg
        v-else
        :viewBox="svgViewBox"
        :style="{ height: svgHeight + 'px' }"
        class="tree-svg"
      >
        <!-- Arestas -->
        <line
          v-for="edge in layout.edges"
          :key="'edge-' + edge.childValue"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          :class="['tree-edge', getEdgeAnimClass(edge.childValue)]"
        />

        <!-- Nós -->
        <g
          v-for="node in nodeList"
          :key="'node-' + node.value"
          :transform="`translate(${node.x}, ${node.y})`"
          class="node-position"
        >
          <g :class="['node-inner', getNodeAnimClass(node.value)]">
            <circle
              r="24"
              class="node-circle"
              :class="{
                'circle-new': isNodeNew(node.value),
                'circle-removing': isNodeRemoving(node.value),
                'circle-traversal': isTraversalActive(node.value),
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
      </svg>
    </div>

    <!-- Legenda -->
    <div class="legend">
      <span><span class="dot dot-new"></span> Novo</span>
      <span><span class="dot dot-removing"></span> Removendo</span>
      <span><span class="dot dot-traversal"></span> Percurso</span>
      <span><span class="dot dot-normal"></span> Normal</span>
    </div>
  </div>
</template>

<style scoped>
.visualizer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 16px;
}

/* Controles */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
}
.input-row,
.btn-row,
.traversal-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}
.value-input {
  width: 140px;
  padding: 10px 14px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s;
}
.value-input:focus {
  border-color: #4a90d9;
}

.traversal-select {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
}

.btn {
  padding: 10px 18px;
  font-size: 14px;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

/* Mensagem */
.message {
  text-align: center;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  animation: fadeSlide 0.3s ease;
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

/* Sequência de percurso */
.traversal-sequence {
  text-align: center;
  margin: 12px 0;
  font-size: 16px;
  color: #2c3e50;
}
.seq-label {
  font-weight: 600;
  margin-right: 8px;
}
.seq-values {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
.seq-item {
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.seq-active {
  background: #ffd700;
  color: #000;
  border-color: #f39c12;
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Área da árvore */
.tree-area {
  background: #f8f9fa;
  border-radius: 16px;
  border: 2px solid #dee2e6;
  overflow: auto;
  min-height: 300px;
  max-height: 600px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}
.tree-svg {
  width: 100%;
  display: block;
}
.empty-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: 1.2rem;
  color: #6c757d;
}

/* Arestas */
.tree-edge {
  stroke: #adb5bd;
  stroke-width: 2.5;
  stroke-linecap: round;
  transition: opacity 0.4s ease;
}
.tree-edge.edge-enter {
  animation: fadeIn 0.5s ease-out;
}
.tree-edge.edge-exit {
  animation: fadeOut 0.4s ease-in forwards;
}

/* Nós – posicionamento (transição suave ao reposicionar) */
.node-position {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Nós – animações de entrada/saída */
.node-inner {
  transform-box: fill-box;
  transform-origin: center;
}
.node-inner.node-enter {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
.node-inner.node-exit {
  animation: popOut 0.4s ease-in forwards;
  pointer-events: none;
}

/* Círculo */
.node-circle {
  fill: #4a90d9;
  stroke: #357abd;
  stroke-width: 3;
  transition:
    fill 0.4s,
    stroke 0.4s,
    stroke-dasharray 0.3s;
}
.circle-new {
  fill: #43e97b;
  stroke: #2ecc71;
}
.circle-removing {
  fill: #f5576c;
  stroke: #e74c3c;
}

/* Destaque de percurso (animação pulsante) */
.circle-traversal {
  fill: #ffd700;
  stroke: #f39c12;
  animation: pulse 0.8s infinite alternate;
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

/* Texto */
.node-text {
  fill: white;
  font-size: 15px;
  font-weight: 700;
  pointer-events: none;
  user-select: none;
}

/* Keyframes */
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

/* Legenda */
.legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 14px;
  font-size: 13px;
  color: #495057;
}
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 5px;
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
.dot-normal {
  background: #4a90d9;
  border-color: #357abd;
}

/* Scrollbar */
.tree-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.tree-area::-webkit-scrollbar-track {
  background: #f1f3f5;
  border-radius: 4px;
}
.tree-area::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}
</style>
