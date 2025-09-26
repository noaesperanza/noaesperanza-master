// noaGPT.ts
import { codeEditorAgent } from './codeEditorAgent'
import { courseAdminAgent } from './courseAdminAgent'
import { knowledgeBaseAgent } from './knowledgeBaseAgent'
import { supabaseService } from '../services/supabaseService'
import { clinicalAgent } from './clinicalAgent'
import { symbolicAgent } from './symbolicAgent'
import { voiceControlAgent } from './voiceControlAgent'

export class NoaGPT {
  async processCommand(message: string): Promise<string> {
    const lower = message.toLowerCase().trim()

    // 🔑 ATIVAÇÃO DE VOZ
    if (
      lower.includes('ativar controle por voz') ||
      lower.includes('modo voz noa')
    ) {
      return await voiceControlAgent.ativarControle()
    }

    // 📎 ADICIONAR DOCUMENTO
    if (
      lower.includes('adicionar documento') ||
      lower.includes('enviar documento') ||
      lower.includes('inserir pdf') ||
      lower.includes('subir arquivo')
    ) {
      return '📂 Por favor, envie o documento agora para que eu possa processar.'
    }

    // 💻 COMANDOS DE CÓDIGO
    if (
      lower.includes('editar código') ||
      lower.includes('alterar código') ||
      lower.includes('editar o arquivo') ||
      lower.includes('modificar componente')
    ) {
      return await codeEditorAgent.editarArquivo(message)
    }

    // 📚 ADMINISTRAÇÃO DE CURSOS
    if (
      lower.includes('criar aula') ||
      lower.includes('editar aula') ||
      lower.includes('organizar curso') ||
      lower.includes('listar aulas') ||
      lower.includes('atualizar trilha')
    ) {
      return await courseAdminAgent.executarTarefa(message)
    }

    // 📖 BASE DE CONHECIMENTO
    if (
      lower.includes('criar conhecimento') ||
      lower.includes('editar conhecimento') ||
      lower.includes('listar conhecimentos') ||
      lower.includes('base de dados') ||
      lower.includes('adicionar à base')
    ) {
      return await knowledgeBaseAgent.executarAcao(message)
    }

    // 🩺 AVALIAÇÃO CLÍNICA (DRC, AEC, Risco)
    if (
      lower.includes('avaliação clínica') ||
      lower.includes('aplicar arte da entrevista clínica') ||
      lower.includes('análise de risco') ||
      lower.includes('simulação clínica')
    ) {
      return await clinicalAgent.executarFluxo(message)
    }

    // 🌀 EIXO SIMBÓLICO
    if (
      lower.includes('curadoria simbólica') ||
      lower.includes('ancestralidade') ||
      lower.includes('projeto cultural') ||
      lower.includes('tradição') ||
      lower.includes('diagnóstico simbólico')
    ) {
      return await symbolicAgent.iniciarCuradoria(message)
    }

    // 💾 SUPABASE: AÇÕES EM ARQUIVOS
    if (
      lower.includes('salvar arquivo') ||
      lower.includes('modificar arquivo') ||
      lower.includes('atualizar base') ||
      lower.includes('escrever no banco')
    ) {
      return await supabaseService.salvarArquivoViaTexto(message)
    }

    // ⚠️ Comando não reconhecido
    return `⚠️ Comando não reconhecido. Tente algo como:
- "editar o arquivo Header.tsx com o conteúdo <h1>Novo Título</h1>"
- "criar aula Introdução à AEC com o conteúdo ..."
- "listar conhecimentos"
- "aplicar avaliação clínica inicial"
- "ativar controle por voz do Nôa Agent"`
  }
}
