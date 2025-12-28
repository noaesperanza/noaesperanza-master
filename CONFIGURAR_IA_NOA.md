# 🚀 GUIA DE CONFIGURAÇÃO - IA RESIDENTE NÔA ESPERANÇA

## ❌ Problema Atual
A IA Nôa Esperança não está respondendo no chat porque falta a chave da API OpenAI.

## ✅ Solução

### Passo 1: Obter Chave da OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login com sua conta OpenAI
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-proj-...`)

### Passo 2: Configurar no Projeto

1. **Crie o arquivo `.env`** na raiz do projeto (se não existir)
2. **Adicione a chave**:

```env
VITE_SUPABASE_URL=https://itdjkfubfzmvmuxxjoae.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_supabase_aqui
VITE_OPENAI_API_KEY=sk-proj-sua_chave_openai_aqui
```

3. **Substitua** `sua_chave_openai_aqui` pela chave que você copiou

### Passo 3: Reiniciar o Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## 🔍 Como Verificar se Funcionou

1. Abra o console do navegador (F12)
2. Procure por:
   - ✅ `🤖 [NoaResidentAI] Processando mensagem:`
   - ✅ `✅ Resposta do Assistant recebida:`
3. Se aparecer `⚠️ Assistant API não disponível`, a chave está incorreta

## 📋 Checklist

- [ ] Chave OpenAI obtida
- [ ] Arquivo `.env` criado
- [ ] Chave adicionada ao `.env`
- [ ] Servidor reiniciado
- [ ] Chat testado
- [ ] IA respondendo ✅

## 🆘 Troubleshooting

### Erro: "API Key não configurada"
- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se a variável se chama exatamente `VITE_OPENAI_API_KEY`
- Reinicie o servidor

### Erro: "Invalid API Key"
- Verifique se a chave foi copiada corretamente
- Verifique se a chave não expirou
- Crie uma nova chave no painel da OpenAI

### IA ainda não responde
- Abra o console (F12) e procure por erros
- Verifique se há saldo na conta OpenAI
- Teste com uma mensagem simples: "Olá"

## 💡 Dica

Para testar sem gastar créditos da OpenAI, você pode usar o modo fallback local (mas com funcionalidade limitada). A IA tentará usar o Assistant primeiro e, se falhar, usará respostas locais pré-programadas.

---

**Após configurar, a IA Nôa Esperança estará 100% funcional!** 🎉
