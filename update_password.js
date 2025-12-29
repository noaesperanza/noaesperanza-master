// Script para atualizar senha do rrvalenca@gmail.com para 123@456
// Execute este script no console do navegador quando estiver logado como admin

import { supabase } from './src/lib/supabase.js';

async function updatePassword() {
  try {
    // Primeiro, buscar o usuário
    const { data: user, error: fetchError } = await supabase.auth.admin.getUserByEmail('rrvalenca@gmail.com');

    if (fetchError) {
      console.error('Erro ao buscar usuário:', fetchError);
      return;
    }

    if (!user) {
      console.error('Usuário não encontrado');
      return;
    }

    // Atualizar a senha usando a API admin
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: '123@456'
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
    } else {
      console.log('✅ Senha atualizada com sucesso para rrvalenca@gmail.com');
      console.log('Nova senha: 123@456');
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Executar a função
updatePassword();