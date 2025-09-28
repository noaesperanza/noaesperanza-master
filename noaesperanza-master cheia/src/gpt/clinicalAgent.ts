// src/gpt/clinicalAgent.ts

interface Etapa {
  id: string
  texto: string
  repetir?: boolean
  condicional?: 'ateNegar' // repete até o usuário negar
  variavel?: string // nome do campo para armazenar resposta
}

const etapas: Etapa[] = [
  {
    id: 'inicio',
    texto: 'Olá! Eu sou Nôa Esperanza. Por favor, apresente-se também e vamos iniciar a sua avaliação inicial para consultas com Dr. Ricardo Valença.',
    variavel: 'apresentacao',
  },
  {
    id: 'usoCanabis',
    texto: 'Você já utilizou canabis medicinal?',
    variavel: 'usoCanabis',
  },
  {
    id: 'motivo',
    texto: 'O que trouxe você à nossa avaliação hoje?',
    repetir: true,
    condicional: 'ateNegar',
    variavel: 'motivos',
  },
  {
    id: 'principal',
    texto: 'De todas essas questões, qual mais o(a) incomoda?',
    variavel: 'queixaPrincipal',
  },
  {
    id: 'onde',
    texto: 'Vamos explorar suas queixas mais detalhadamente. Onde você sente a queixa principal?',
    variavel: 'onde',
  },
  {
    id: 'quando',
    texto: 'Quando essa queixa começou?',
    variavel: 'quando',
  },
  {
    id: 'como',
    texto: 'Como é a queixa?',
    variavel: 'como',
  },
  {
    id: 'sintomasAssociados',
    texto: 'O que mais você sente quando está com a queixa?',
    variavel: 'sintomasAssociados',
  },
  {
    id: 'melhora',
    texto: 'O que parece melhorar a queixa?',
    variavel: 'melhora',
  },
  {
    id: 'piora',
    texto: 'O que parece piorar a queixa?',
    variavel: 'piora',
  },
  {
    id: 'historicoDoenca',
    texto: 'E agora, sobre sua vida até aqui, quais as questões de saúde que você já viveu? Vamos ordenar do mais antigo para o mais recente, o que veio primeiro?',
    repetir: true,
    condicional: 'ateNegar',
    variavel: 'historicoDoenca',
  },
  {
    id: 'familiaMae',
    texto: 'Começando pela parte da sua mãe, quais as questões de saúde dela e desse lado da família?',
    repetir: true,
    condicional: 'ateNegar',
    variavel: 'familiaMae',
  },
  {
    id: 'familiaPai',
    texto: 'E por parte de seu pai?',
    repetir: true,
    condicional: 'ateNegar',
    variavel: 'familiaPai',
  },
  {
    id: 'habitos',
    texto: 'Além dos hábitos de vida que já verificamos em nossa conversa, que outros hábitos você acha importante mencionar?',
    repetir: true,
    condicional: 'ateNegar',
    variavel: 'habitos',
  },
  {
    id: 'alergias',
    texto: 'Você tem alguma alergia (mudança de tempo, medicação, poeira...)?',
    variavel: 'alergias',
  },
  {
    id: 'medicacaoRegular',
    texto: 'Quais as medicações que você utiliza regularmente?',
    variavel: 'medicacaoRegular',
  },
  {
    id: 'medicacaoEsporadica',
    texto: 'Quais as medicações você utiliza esporadicamente (de vez em quando) e porque utiliza?',
    variavel: 'medicacaoEsporadica',
  },
  {
    id: 'fechamento',
    texto: 'Vamos revisar a sua história rapidamente para garantir que não perdemos nenhum detalhe importante.',
  },
  {
    id: 'validacao',
    texto: 'Você concorda com o meu entendimento? Há mais alguma coisa que gostaria de adicionar sobre a história que construímos?',
    variavel: 'validacaoUsuario',
  },
  {
    id: 'final',
    texto: 'Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença com o objetivo de aperfeiçoar o seu atendimento. Ao final, recomendo a marcação de uma consulta com o Dr. Ricardo Valença pelo site.\n\nSeu relatório resumido está pronto para download.',
  },
]

let etapaAtual = 0
let respostas: Record<string, any> = {}

export const clinicalAgent = {
  async executarFluxo(mensagem: string): Promise<string> {
    const etapa = etapas[etapaAtual]

    if (!etapa) {
      return '✅ Avaliação finalizada. Obrigado!'
    }

    if (etapa.variavel) {
      const valorAnterior = respostas[etapa.variavel]
      if (etapa.repetir && etapa.condicional === 'ateNegar') {
        if (mensagem.toLowerCase().includes('nada') || mensagem.toLowerCase().includes('não')) {
          etapaAtual += 1
        } else {
          respostas[etapa.variavel] = valorAnterior
            ? [...valorAnterior, mensagem]
            : [mensagem]
          return etapa.texto
        }
      } else {
        respostas[etapa.variavel] = mensagem
        etapaAtual += 1
      }
    } else {
      etapaAtual += 1
    }

    const proximaEtapa = etapas[etapaAtual]
    if (!proximaEtapa) {
      return '✅ Avaliação finalizada. Obrigado!'
    }

    return proximaEtapa.texto
  },

  async executarAcao(msg: string) {
    return this.executarFluxo(msg)
  },

  getRespostas() {
    return respostas
  },
}
