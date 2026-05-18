# 🌳 Visualizador de Árvore AVL

Um projeto interativo em **Vue 3 + TypeScript** para visualização de uma **Árvore AVL (Adelson-Velsky e Landis)**, uma árvore binária de busca **autobalanceada**. Inclui animações suaves de inserção e remoção, feedback visual imediato e layout responsivo.

![Preview](/public/preview.png) <!-- Substitua por um screenshot real -->

---

## ✨ Funcionalidades

- **Inserir** valores numéricos na árvore
- **Remover** nós (suporta os três casos: folha, um filho, dois filhos)
- **Geração aleatória** de árvores com 5 a 12 nós
- **Limpeza completa** da árvore
- **Balanceamento automático** após cada operação (implementação AVL com rotações simples e duplas)
- **Animações CSS/SVG**:
  - Efeito _pop_ ao inserir nós
  - Efeito _fade out_ ao remover
  - Transição suave dos nós para novas posições
- **Layout automático** baseado em percurso em-ordem
- **Interface responsiva** e amigável

---

## 🧠 Regras de Balanceamento (AVL)

- Todo nó armazena sua **altura**
- Após cada inserção ou remoção, a árvore verifica o **fator de balanceamento** (diferença de altura entre subárvores esquerda e direita)
- Se o fator for `> 1` ou `< -1`, aplica-se uma das quatro rotações:
  - Rotação simples à direita
  - Rotação simples à esquerda
  - Rotação dupla esquerda-direita
  - Rotação dupla direita-esquerda
- Isso garante que a altura da árvore permaneça **O(log n)** e as operações sejam eficientes.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia                                    | Versão | Uso                      |
| --------------------------------------------- | ------ | ------------------------ |
| [Vue](https://vuejs.org/)                     | 3.4+   | Framework reativo        |
| [TypeScript](https://www.typescriptlang.org/) | 5.5+   | Tipagem estática         |
| [Vite](https://vitejs.dev/)                   | 5.4+   | Build e dev server       |
| SVG + CSS Animations                          | -      | Renderização e animações |

---

## 📁 Estrutura do Projeto

```
binary-tree-visualizer/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── env.d.ts
├── README.md
└── src/
    ├── main.ts
    ├── App.vue
    ├── style.css
    ├── models/
    │   ├── TreeNode.ts           # Nó com valor, filhos e altura
    │   └── AVLTree.ts            # Implementação completa da árvore AVL
    └── components/
        └── BinaryTreeVisualizer.vue  # Visualização interativa com SVG
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- Gerenciador de pacotes npm, pnpm ou yarn

### Passos

```bash
# 1. Clone o repositório (ou copie os arquivos)
git clone https://github.com/seu-usuario/binary-tree-visualizer.git
cd binary-tree-visualizer

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:5173**.

### Build para Produção

```bash
npm run build
npm run preview   # para testar localmente o build
```

---

## 🎮 Como Usar

1. Digite um número inteiro no campo de entrada.
2. Pressione **Enter** ou clique em **Inserir**.
3. Observe o novo nó aparecer com uma animação e a árvore se reorganizar (se necessário) para manter o balanceamento.
4. Para remover um valor, digite-o e clique em **Remover**. O nó desaparecerá com uma animação e a árvore será rebalanceada.
5. Use o botão **Aleatória** para gerar uma árvore com valores randômicos.
6. Clique em **Limpar** para esvaziar a árvore.

---

## 🎨 Paleta de Cores e Significados

| Cor            | Significado                            |
| -------------- | -------------------------------------- |
| 🔵 Azul        | Nó normal                              |
| 🟢 Verde       | Nó recém-inserido (durante a animação) |
| 🔴 Vermelho    | Nó sendo removido (durante a animação) |
| ⚪ Cinza claro | Arestas normais                        |
| ✨ Animações   | Escala, opacidade e translação via CSS |

---

## 🧪 Exemplo de Comportamento

Inserindo a sequência `10, 20, 30` (em uma BST comum isso geraria uma lista, mas a AVL se reorganiza):

1. Insere 10 → raiz
2. Insere 20 → filho direito de 10 (fator 0)
3. Insere 30 → causa desbalanceamento (fator -2), rotação simples à esquerda:
   - **20** vira raiz, 10 à esquerda, 30 à direita.

A visualização mostra automaticamente a nova disposição.

---

## 📚 Conceitos Abordados

- Estrutura de dados: Árvore Binária de Busca e Árvore AVL
- Algoritmos de balanceamento e rotações
- Desenvolvimento reativo com Vue Composition API
- Tipagem avançada com TypeScript
- Manipulação de SVG dinâmico
- Animações CSS sincronizadas com estado

---

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues, enviar PRs ou sugerir melhorias.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

Feito com 💚 por [Flavio Alvarenga](https://github.com/alvarengaflavio)
