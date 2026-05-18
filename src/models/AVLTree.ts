import { TreeNode } from "./TreeNode";

export interface NodeDepthInfo {
  node: TreeNode;
  depth: number;
  parent: TreeNode | null;
}

export class AVLTree {
  root: TreeNode | null;

  constructor() {
    this.root = null;
  }

  // ---------- Funções auxiliares ----------
  private getHeight(node: TreeNode | null): number {
    return node ? node.height : 0;
  }

  private updateHeight(node: TreeNode): void {
    node.height =
      1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  private getBalance(node: TreeNode): number {
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  // ---------- Rotações ----------
  private rotateRight(y: TreeNode): TreeNode {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  private rotateLeft(x: TreeNode): TreeNode {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  // Balanceia o nó após inserção/remoção
  private balance(node: TreeNode): TreeNode {
    this.updateHeight(node);
    const bf = this.getBalance(node);

    // Esquerda-Esquerda
    if (bf > 1 && this.getBalance(node.left!) >= 0) {
      return this.rotateRight(node);
    }
    // Esquerda-Direita
    if (bf > 1 && this.getBalance(node.left!) < 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }
    // Direita-Direita
    if (bf < -1 && this.getBalance(node.right!) <= 0) {
      return this.rotateLeft(node);
    }
    // Direita-Esquerda
    if (bf < -1 && this.getBalance(node.right!) > 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  // ---------- Inserção ----------
  insert(value: number): boolean {
    if (this.contains(value)) return false;
    this.root = this._insertNode(this.root, value);
    return true;
  }

  private _insertNode(node: TreeNode | null, value: number): TreeNode {
    if (!node) return new TreeNode(value);

    if (value < node.value) {
      node.left = this._insertNode(node.left, value);
    } else {
      node.right = this._insertNode(node.right, value);
    }

    return this.balance(node);
  }

  // ---------- Busca ----------
  contains(value: number): boolean {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;
      current = value < current.value ? current.left : current.right;
    }
    return false;
  }

  // ---------- Remoção ----------
  remove(value: number): boolean {
    if (!this.contains(value)) return false;
    this.root = this._removeNode(this.root, value);
    return true;
  }

  private _removeNode(node: TreeNode | null, value: number): TreeNode | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this._removeNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._removeNode(node.right, value);
    } else {
      // Nó encontrado
      if (!node.left && !node.right) {
        return null; // folha
      } else if (!node.left) {
        return node.right; // um filho (direito)
      } else if (!node.right) {
        return node.left; // um filho (esquerdo)
      } else {
        // dois filhos: substituir pelo menor da subárvore direita
        const minRight = this._findMin(node.right);
        node.value = minRight.value;
        node.right = this._removeNode(node.right, minRight.value);
      }
    }

    return this.balance(node);
  }

  private _findMin(node: TreeNode): TreeNode {
    while (node.left) node = node.left;
    return node;
  }

  // ---------- Utilitários de visualização ----------
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

  clear(): void {
    this.root = null;
  }

  getNodeCount(): number {
    return this.getNodesWithDepth().length;
  }
}
