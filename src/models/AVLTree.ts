import { TreeNode } from "./TreeNode";

export interface NodeDepthInfo {
  node: TreeNode;
  depth: number;
  parent: TreeNode | null;
}

export type TraversalType = "preorder" | "inorder" | "postorder";

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

  // ---------- Travessias (retornam array de valores) ----------
  preorderTraversal(): number[] {
    const result: number[] = [];
    this._preorder(this.root, result);
    return result;
  }

  private _preorder(node: TreeNode | null, arr: number[]): void {
    if (!node) return;
    arr.push(node.value);
    this._preorder(node.left, arr);
    this._preorder(node.right, arr);
  }

  inorderTraversal(): number[] {
    const result: number[] = [];
    this._inorder(this.root, result);
    return result;
  }

  private _inorder(node: TreeNode | null, arr: number[]): void {
    if (!node) return;
    this._inorder(node.left, arr);
    arr.push(node.value);
    this._inorder(node.right, arr);
  }

  postorderTraversal(): number[] {
    const result: number[] = [];
    this._postorder(this.root, result);
    return result;
  }

  private _postorder(node: TreeNode | null, arr: number[]): void {
    if (!node) return;
    this._postorder(node.left, arr);
    this._postorder(node.right, arr);
    arr.push(node.value);
  }

  // ---------- Utilitários de visualização ----------
  getNodesWithDepth(): NodeDepthInfo[] {
    const result: NodeDepthInfo[] = [];
    this._inorderDepth(this.root, 0, null, result);
    return result;
  }

  private _inorderDepth(
    node: TreeNode | null,
    depth: number,
    parent: TreeNode | null,
    result: NodeDepthInfo[],
  ): void {
    if (!node) return;
    this._inorderDepth(node.left, depth + 1, node, result);
    result.push({ node, depth, parent });
    this._inorderDepth(node.right, depth + 1, node, result);
  }

  clear(): void {
    this.root = null;
  }

  getNodeCount(): number {
    return this.getNodesWithDepth().length;
  }

  /**
   * Retorna o caminho percorrido durante a busca e se o valor foi encontrado.
   */
  searchPath(value: number): { path: number[]; found: boolean } {
    const path: number[] = [];
    let current = this.root;
    while (current) {
      path.push(current.value);
      if (value === current.value) {
        return { path, found: true };
      } else if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    return { path, found: false };
  }
}
