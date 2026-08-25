# 🌿 Git Flow — Guia Rápido

Este guia reúne os comandos mais importantes para trabalhar em equipe com Git, seguindo um fluxo baseado em **branch `main` + branches de feature**.

> 💡 Regra de ouro: **não desenvolva diretamente na `main`**. Crie uma branch para cada tarefa/feature.

---

## 📌 1. Antes de começar qualquer tarefa

Primeiro, garanta que sua `main` local está atualizada:

```bash
git checkout main
git pull origin main
```

### O que acontece?

* `git checkout main` → entra na branch `main`.
* `git pull origin main` → baixa as alterações mais recentes do repositório remoto.

💡 **TIP:** Sempre faça isso antes de criar uma nova branch. Assim você começa seu trabalho a partir da versão mais atual do projeto.

---

# 🌱 2. Criar uma nova branch

Depois de atualizar a `main`:

```bash
git checkout -b <nome-da-nova-branch>
```

Exemplo:

```bash
git checkout -b feature/tela-login
```

Isso:

1. Cria a branch.
2. Já muda você para ela.

Para verificar em qual branch você está:

```bash
git branch
```

A branch atual aparecerá com `*`.

### 💡 Sugestão de nomenclatura

```text
Feature: utilizada sempre que necessário criar algo novo para o projeto, como um módulo, tela etc. 
Exemplo: feature/-menu-mobile

Bugfix: utilizada quando alguma feature precisar de ajustes ou qualquer tipo de correção é necessária no projeto. 
Exemplo: bugfix/collapse-menu-mobile

Hotfix: quando necessário uma correção crítica ou temporária, deve ser utilizado o hotfix, é dado o merge direto em produção, e na branch development depois. 
Exemplo: hotfix/removendo-service-de-alerta

```

Uma nomenclatura consistente ajuda bastante quando o projeto começa a crescer.

---

# 💾 3. Salvar suas alterações

Depois de desenvolver sua tarefa:

### 1. Adicionar arquivos ao stage

```bash
git add .
```

Ou, para adicionar apenas um arquivo:

```bash
git add nome-do-arquivo
```

### 2. Criar o commit

```bash
git commit -m "feat: adiciona tela de login"
```

💡 **TIP:** O commit deve explicar **o que foi feito**, e não simplesmente dizer "alterações" ou "mudanças".

Exemplos:

```text
feat: indica uma nova melhoria/funcionalidade.
fix: indica uma correção (bugfix).
docs: indica mudanças da documentação do projeto.
style: indica mudanças que não afetam o funcionamento do código, como ajustes de ortografia, remoção de espaços, indentação etc.
refactor: indica a refatoração do código e somente isso, não deve ser usado para indicar melhorias ou correções.
```

---

# ☁️ 4. Enviar sua branch para o GitHub

Na primeira vez que enviar uma branch nova:

```bash
git push -u origin <nome-da-branch>
```

Exemplo:

```bash
git push -u origin feature/tela-login
```

Depois disso, nas próximas alterações, normalmente basta:

```bash
git push
```

### 💡 TIP

O `-u` cria uma associação entre sua branch local e a branch remota.

Por isso, depois do primeiro `push`, você pode simplesmente usar:

```bash
git push
```

---

# 🔄 5. Fluxo básico completo

No dia a dia, o fluxo será aproximadamente:

```text
main
   │
   ├── criar branch
   │
   ▼
feature/minha-tarefa
   │
   ├── desenvolver
   ├── git add .
   ├── git commit
   ├── git push
   │
   ▼
Pull Request
   │
   ▼
Code Review
   │
   ▼
Merge na main
```

Ou seja:

```bash
git checkout main
git pull origin main

git checkout -b feature/minha-tarefa

# desenvolve...

git add .
git commit -m "feat: minha alteração"
git push -u origin feature/minha-tarefa
```

Depois disso, você abre um **Pull Request (PR)** no GitHub.

---

# 🔀 6. Criar um Pull Request

Depois de fazer o `push`, a branch estará disponível no GitHub.

No GitHub:

```text
feature/minha-tarefa
        ↓
    Pull Request
        ↓
      main
```

O PR serve para que outra pessoa do time possa:

* revisar seu código;
* sugerir alterações;
* identificar possíveis problemas;
* discutir a implementação;
* aprovar o código;
* fazer o merge na `main`.

💡 **TIP:** Evitem fazer `push` direto na `main` quando o projeto estiver sendo desenvolvido em equipe. O PR cria uma etapa de revisão antes de integrar o código.

---

# 🔄 7. Atualizar sua branch com alterações da main

Imagine que você começou sua tarefa e, enquanto estava trabalhando, outra pessoa fez alterações na `main`.

Sua branch ficou desatualizada.

Nesse caso, você pode atualizar sua branch utilizando **rebase**.

Primeiro, salve seu trabalho com um commit:

```bash
git add .
git commit -m "feat: implementa minha tarefa"
```

Depois:

### 1. Ir para a main

```bash
git checkout main
```

### 2. Atualizar a main

```bash
git pull origin main
```

### 3. Voltar para sua branch

```bash
git checkout <nome-da-branch>
```

### 4. Fazer o rebase

```bash
git rebase main
```

Agora o Git vai colocar seus commits "por cima" da versão mais atual da `main`.

---

## ⚠️ Se aparecer conflito durante o rebase

O Git vai informar quais arquivos possuem conflito.

Abra os arquivos e procure por algo parecido com:

```text
<<<<<<< HEAD

código da main

=======

seu código

>>>>>>> sua-branch
```

Resolva manualmente qual código deve permanecer.

Depois:

```bash
git add <arquivo>
```

E continue o rebase:

```bash
git rebase --continue
```

Se houver mais conflitos, repita o processo.

### Se quiser cancelar o rebase

```bash
git rebase --abort
```

Isso retorna a branch para o estado anterior ao rebase.

---

# 🚨 8. Push depois de um rebase

Depois de um `rebase`, seus commits tiveram seus identificadores alterados.

Por isso, o `git push` normal pode ser rejeitado.

Use:

```bash
git push origin <nome-da-branch> --force-with-lease
```

### ⚠️ Por que `--force-with-lease`?

Ele é mais seguro que:

```bash
git push --force
```

O `--force` pode sobrescrever alterações remotas sem verificar se outra pessoa trabalhou naquela branch.

Já o `--force-with-lease` verifica se o remoto ainda está no estado esperado antes de sobrescrever.

💡 **REGRA:** Evite usar `--force` puro em branches compartilhadas.

---

# ✏️ 9. Alterar o último commit

Se você acabou de fazer um commit e percebeu que:

* escreveu a mensagem errada;
* esqueceu de adicionar um arquivo;
* precisa corrigir alguma coisa pequena;

pode usar:

```bash
git commit --amend -m "nova mensagem do commit"
```

Exemplo:

```bash
git commit --amend -m "feat: adiciona tela de login"
```

### Se esqueceu um arquivo

```bash
git add arquivo-esquecido
git commit --amend --no-edit
```

O `--no-edit` mantém a mensagem do commit anterior.

⚠️ Se esse commit já foi enviado para o remoto, o `amend` altera o histórico. Nesse caso, provavelmente será necessário:

```bash
git push --force-with-lease
```

---

# 🧹 10. Deletar uma branch

Depois que sua branch foi integrada e não é mais necessária:

### Deletar branch local

```bash
git branch -d <nome-da-branch>
```

Exemplo:

```bash
git branch -d feature/tela-login
```

Se o Git impedir porque existem commits não integrados e você tiver certeza de que quer apagar:

```bash
git branch -D <nome-da-branch>
```

⚠️ `-D` força a exclusão. Use com cuidado.

### Deletar branch remota

```bash
git push origin --delete <nome-da-branch>
```

---

# ✏️ 11. Renomear uma branch

### Se você está na branch que deseja renomear:

```bash
git branch -m <novo-nome>
```

Exemplo:

```bash
git branch -m feature/login
```

### Se está em outra branch:

```bash
git branch -m <nome-antigo> <novo-nome>
```

---

# 📦 12. Stash — guardar alterações temporariamente

O `stash` é útil quando você está trabalhando em alguma coisa, mas precisa trocar de branch **sem querer fazer um commit ainda**.

### Guardar alterações

```bash
git stash push -m "implementação da tela de login"
```

💡 Não é obrigatório fazer `git add .` antes. O `git stash` pode guardar alterações não commitadas diretamente.

Se quiser incluir arquivos novos ainda não rastreados:

```bash
git stash -u
```

---

### Ver os stashes existentes

```bash
git stash list
```

Exemplo:

```text
stash@{0}: On feature/login: implementação da tela
stash@{1}: On develop: ajuste temporário
```

---

### Recuperar o último stash

```bash
git stash pop
```

Ele recupera as alterações e remove o stash da lista.

---

### Recuperar um stash específico

Primeiro:

```bash
git stash list
```

Depois:

```bash
git stash pop stash@{0}
```

---

### Recuperar sem remover da lista

Se quiser aplicar o stash mas mantê-lo guardado:

```bash
git stash apply stash@{0}
```

---

### Apagar um stash

```bash
git stash drop stash@{0}
```

---

# 🔍 13. Comandos úteis para consultar o estado do projeto

### Ver em qual branch estou

```bash
git branch
```

### Ver alterações não commitadas

```bash
git status
```

### Ver histórico de commits

```bash
git log
```

Uma versão mais resumida:

```bash
git log --oneline
```

### Ver branches remotas

```bash
git branch -r
```

### Ver todas as branches

```bash
git branch -a
```

---

# 🚨 14. Regra importante para trabalho em equipe

Antes de começar uma tarefa:

```bash
git checkout main
git pull origin main
git checkout -b feature/minha-tarefa
```

Durante o desenvolvimento:

```bash
git add .
git commit -m "feat: descrição da alteração"
git push
```

Quando terminar:

```text
GitHub
   ↓
Pull Request
   ↓
main
   ↓
Code Review
   ↓
Merge
```

Se a `main` mudou enquanto você trabalhava:

```bash
git checkout main
git pull origin main
git checkout minha-branch
git rebase main
git push --force-with-lease
```

---

# 🧠 RESUMÃO

### Começar uma tarefa

```bash
git checkout main
git pull origin main
git checkout -b feature/minha-tarefa
```

### Salvar trabalho

```bash
git add .
git commit -m "feat: descrição"
git push -u origin feature/minha-tarefa
```

### Atualizar sua branch

```bash
git checkout main
git pull origin main
git checkout feature/minha-tarefa
git rebase main
git push --force-with-lease
```

### Criar PR

```text
feature/minha-tarefa → main
```

### Guardar trabalho temporariamente

```bash
git stash push -m "descrição"
```

### Recuperar

```bash
git stash pop
```

### Ver situação atual

```bash
git status
```

### Ver branches

```bash
git branch
```

### Ver commits

```bash
git log --oneline
```

---

## ⭐ Fluxo que vocês devem decorar

```text
1. Atualiza main
        ↓
2. Cria sua feature branch
        ↓
3. Desenvolve
        ↓
4. Commit
        ↓
5. Push
        ↓
6. Abre PR
        ↓
7. Code Review
        ↓
8. Merge na main
```

**E principalmente:**

> `main` = versão estável/produção
> `feature/*` = onde você desenvolve sua tarefa
> `PR` = porta de entrada para integrar seu código ao projeto
