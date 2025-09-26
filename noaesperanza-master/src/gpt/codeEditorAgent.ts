import fs from 'fs'
import path from 'path'

export const codeEditorAgent = {
  async executarComando(mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase()

    if (lower.includes('listar arquivos')) {
      return this.listarArquivos()
    }

    if (lower.includes('editar')) {
      return this.editarArquivo(mensagem)
    }

    return '🛠️ Comando de edição não reconhecido. Tente: "listar arquivos" ou "editar o arquivo X com o conteúdo Y".'
  },

  listarArquivos(): string {
    const dirPath = path.join(process.cwd(), 'src') // Ajuste para a pasta que desejar

    try {
      const arquivos = fs.readdirSync(dirPath)
      return `📂 Arquivos disponíveis em /src:\n\n${arquivos.join('\n')}`
    } catch (error) {
      return `❌ Erro ao listar arquivos: ${error}`
    }
  },

  editarArquivo(mensagem: string): string {
    const regex = /editar o arquivo (.+?) com o conteúdo (.+)/i
    const match = mensagem.match(regex)

    if (!match || match.length < 3) {
      return '⚠️ Formato inválido. Use: "editar o arquivo Home.tsx com o conteúdo Novo conteúdo..."'
    }

    const nomeArquivo = match[1].trim()
    const novoConteudo = match[2].trim()
    const filePath = path.join(process.cwd(), 'src', nomeArquivo)

    try {
      if (!fs.existsSync(filePath)) {
        return `❌ Arquivo "${nomeArquivo}" não encontrado.`
      }

      // backup
      const backupPath = filePath + '.backup'
      fs.copyFileSync(filePath, backupPath)

      fs.writeFileSync(filePath, novoConteudo)
      return `✅ Arquivo "${nomeArquivo}" editado com sucesso.\nBackup salvo como "${nomeArquivo}.backup"`
    } catch (error) {
      return `❌ Erro ao editar o arquivo: ${error}`
    }
  }
}
