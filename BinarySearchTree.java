package binarysearchtree;

import java.util.Random;

public class BinarySearchTree {

    // Tree Node class
    public class TreeNode {
        public int data;
        public TreeNode leftChild = null;
        public TreeNode rightChild = null;
        public TreeNode parent = null;

        public TreeNode(int d) {
            data = d;
        }

        public void setLeftChild(TreeNode n) {
            leftChild = n;
            if (n != null) {
                n.parent = this;
            }
        }

        public void setRightChild(TreeNode n) {
            rightChild = n;
            if (n != null) {
                n.parent = this;
            }
        }
    }

    private TreeNode root;

    // Insert a value into BST
    public void insert(int value) {

        if (root == null) {
            root = new TreeNode(value);
        } else {
            insertBelow(root, value);
        }
    }

    // Recursive helper for insertion
    private void insertBelow(TreeNode node, int value) {

        if (value > node.data) {

            if (node.rightChild == null) {
                node.setRightChild(new TreeNode(value));
            } else {
                insertBelow(node.rightChild, value);
            }

        } else {

            if (node.leftChild == null) {
                node.setLeftChild(new TreeNode(value));
            } else {
                insertBelow(node.leftChild, value);
            }
        }
    }

    // -------- Traversal Algorithms --------

    // (a) In-order traversal
    public void inorder() {
        inorder(root);
    }

    private void inorder(TreeNode node) {
        if (node != null) {
            inorder(node.leftChild);
            System.out.println(node.data);
            inorder(node.rightChild);
        }
    }

    // (b) Pre-order traversal
    public void preorder() {
        preorder(root);
    }

    private void preorder(TreeNode node) {
        if (node != null) {
            System.out.println(node.data);
            preorder(node.leftChild);
            preorder(node.rightChild);
        }
    }

    // (c) Post-order traversal
    public void postorder() {
        postorder(root);
    }

    private void postorder(TreeNode node) {
        if (node != null) {
            postorder(node.leftChild);
            postorder(node.rightChild);
            System.out.println(node.data);
        }
    }

    // Generate random values
    public static int[] randomValues(int howMany) {

        int[] result = new int[howMany];
        Random random = new Random();

        for (int i = 0; i < howMany; i++)
            result[i] = random.nextInt(100);

        return result;
    }

    // Insert all values from array
    public void insertAll(int[] values) {

        for (int i = 0; i < values.length; i++) {
            insert(values[i]);
        }
    }

    // -------- Main Method --------
    public static void main(String[] args) {

        BinarySearchTree tree = new BinarySearchTree();

        int[] values = {50, 30, 70, 20, 40, 60, 80};
        int[] values = {55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5 }
        int[] values = {30, 25, 20, 15, 10, 5, 35, 40, 45, 50, 55 }
        int[] values= {30, 15, 45, 10, 40, 20, 50, 5, 35, 25, 55 }

        System.out.println("Input values:");
        for (int v : values) {
            System.out.print(v + " ");
        }

        System.out.println("\n");


        tree.insertAll(values);

        System.out.println("In-order Traversal:");
        tree.inorder();

        System.out.println("\nPre-order Traversal:");
        tree.preorder();

        System.out.println("\nPost-order Traversal:");
        tree.postorder();
    }
}