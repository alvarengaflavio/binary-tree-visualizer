<script setup lang="ts">
import BinaryTreeVisualizer from "./components/BinaryTreeVisualizer.vue";
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Visualizador de Árvore Binária de Busca</h1>
      <p>
        Insira e remova valores para ver a estrutura da árvore em tempo real
      </p>
    </header>
    <main>
      <BinaryTreeVisualizer />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.app-header {
  text-align: center;
  padding: 28px 20px 8px;
}
.app-header h1 {
  font-size: 2rem;
  color: #2c3e50;
}
.app-header p {
  color: #5a6c7d;
  margin-top: 6px;
}
main {
  width: 100%;
  max-width: 1200px;
  flex: 1;
}
</style>
