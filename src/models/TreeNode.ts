export class TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  height: number;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1; // nó novo sempre começa com altura 1
  }
}
