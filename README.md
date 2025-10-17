# Fiscal Flash – Simulador Tributário Inteligente

Este repositório contém o simulador tributário em versão estática. O código foi reorganizado para separar HTML, CSS e JavaScript, além de documentar como executar e manter o projeto.

## Estrutura do projeto

```
public/
  index.html        # Página principal do simulador
  assets/
    styles.css      # Tema e componentes visuais
    main.js         # Lógica de simulação e gráficos

docs/
  legislacao/       # Materiais de referência (PDFs e textos)
```

## Como executar

1. Instale um servidor HTTP simples (opcional, mas recomendado para carregar fontes externas com CORS correto). Exemplos:
   - `python -m http.server --directory public 8000`
   - `npx serve public`
2. Acesse `http://localhost:8000` (ou a porta configurada) no navegador para usar o simulador.
3. Alternativamente, abra `public/index.html` diretamente no navegador, ciente de que algumas funcionalidades (como importação de fontes) podem depender de conexão com a internet.

## Desenvolvimento

- Toda a lógica cliente está em `public/assets/main.js`. As funções estão organizadas por blocos (formatação, cálculo de cenários, atualizações de UI e integração com gráficos Chart.js).
- O tema visual utiliza tokens definidos em `public/assets/styles.css`. Ajuste variáveis (`--accent`, `--bg`, etc.) para customizar cores ou comportamento entre temas claro/escuro.
- Recursos de dados estáticos ou materiais de apoio devem ser colocados em `docs/legislacao/` para manter o diretório `public/` limpo.

## Próximos passos sugeridos

- Configurar um bundler ou pipeline de build (Vite, Parcel ou similar) caso o projeto evolua para múltiplas páginas ou componentes reutilizáveis.
- Automatizar testes de regressão visual ou unitários da lógica de simulação, garantindo consistência ao atualizar regras fiscais.
- Criar documentação de APIs externas ou fontes de dados se forem integradas no futuro.
