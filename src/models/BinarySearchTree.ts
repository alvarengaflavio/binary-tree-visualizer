import { TreeNode } from "./TreeNode";

export interface NodeDepthInfo {
  node: TreeNode;
  depth: number;
  parent: TreeNode | null;
}

export class BinarySearchTree {
  root: TreeNode | null;

  constructor() {
    this.root = null;
  }

  /** Insere um valor na árvore. Retorna `true` se inserido, `false` se já existir. */
  insert(value: number): boolean {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return true;
    }

    let current = this.root;
    while (true) {
      if (value === current.value) return false;
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          return true;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          return true;
        }
        current = current.right;
      }
    }
  }

  /** Verifica se um valor existe na árvore. */
  contains(value: number): boolean {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;
      current = value < current.value ? current.left : current.right;
    }
    return false;
  }

  /** Remove um valor da árvore. Retorna `true` se removido, `false` se não encontrado. */
  remove(value: number): boolean {
    if (!this.contains(value)) return false;
    this.root = this._removeNode(this.root, value);
    return true;
  }

  private _removeNode(node: TreeNode | null, value: number): TreeNode | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this._removeNode(node.left, value);
      return node;
    } else if (value > node.value) {
      node.right = this._removeNode(node.right, value);
      return node;
    } else {
      // Nó encontrado
      if (!node.left && !node.right) return null; // Caso 1: folha
      if (!node.left) return node.right; // Caso 2: um filho (direito)
      if (!node.right) return node.left; // Caso 2: um filho (esquerdo)

      // Caso 3: dois filhos → substituir pelo menor da subárvore direita
      const minRight = this._findMin(node.right);
      node.value = minRight.value;
      node.right = this._removeNode(node.right, minRight.value);
      return node;
    }
  }

  private _findMin(node: TreeNode): TreeNode {
    while (node.left) node = node.left;
    return node;
  }

  /** Retorna todos os nós com profundidade e referência ao pai (percurso em ordem). */
  getNodesWithDepth(): NodeDepthInfo[] {
    const result: NodeDepthInfo[] = [];
    this._inorderTraversal(this.root, 0, null, result);
    return result;
  }

  private _inorderTraversal(
    node: TreeNode | null,
    depth: number,
    parent: TreeNode | null,
    result: NodeDepthInfo[],
  ): void {
    if (!node) return;
    this._inorderTraversal(node.left, depth + 1, node, result);
    result.push({ node, depth, parent });
    this._inorderTraversal(node.right, depth + 1, node, result);
  }

  /** Remove todos os nós. */
  clear(): void {
    this.root = null;
  }

  /** Retorna a quantidade total de nós. */
  getNodeCount(): number {
    return this.getNodesWithDepth().length;
  }
}
