// =============================================================================
// DIAGNÓSTICO - IA NÔA ESPERANÇA
// =============================================================================
// Execute: node diagnostico-ia-noa.js
// =============================================================================

console.log('🔍 DIAGNÓSTICO - IA NÔA ESPERANÇA\n')
console.log('='.repeat(60))

// 1. Verificar arquivo .env
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')
const envExists = fs.existsSync(envPath)

console.log('\n📁 ARQUIVO .ENV')
console.log('-'.repeat(60))
if (envExists) {
    console.log('✅ Arquivo .env encontrado')

    const envContent = fs.readFileSync(envPath, 'utf-8')
    const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL')
    const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY')
    const hasOpenAIKey = envContent.includes('VITE_OPENAI_API_KEY')

    console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} VITE_SUPABASE_URL`)
    console.log(`   ${hasSupabaseKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY`)
    console.log(`   ${hasOpenAIKey ? '✅' : '❌'} VITE_OPENAI_API_KEY`)

    if (!hasOpenAIKey) {
        console.log('\n⚠️  PROBLEMA ENCONTRADO:')
        console.log('   A chave VITE_OPENAI_API_KEY não está configurada!')
        console.log('   A IA Nôa Esperança NÃO FUNCIONARÁ sem ela.')
        console.log('\n💡 SOLUÇÃO:')
        console.log('   1. Obtenha uma chave em: https://platform.openai.com/api-keys')
        console.log('   2. Adicione ao arquivo .env:')
        console.log('      VITE_OPENAI_API_KEY=sk-proj-sua_chave_aqui')
        console.log('   3. Reinicie o servidor: npm run dev')
    }
} else {
    console.log('❌ Arquivo .env NÃO encontrado')
    console.log('\n💡 SOLUÇÃO:')
    console.log('   1. Copie o arquivo .env.example para .env')
    console.log('   2. Preencha com suas credenciais')
    console.log('   3. Reinicie o servidor')
}

// 2. Verificar arquivos da IA
console.log('\n🤖 ARQUIVOS DA IA')
console.log('-'.repeat(60))

const aiFiles = [
    'src/lib/noaResidentAI.ts',
    'src/lib/noaAssistantIntegration.ts',
    'src/lib/noaEsperancaCore.ts',
    'src/components/NoaConversationalInterface.tsx',
    'src/components/ClinicalAssessmentChat.tsx'
]

aiFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    const exists = fs.existsSync(filePath)
    console.log(`   ${exists ? '✅' : '❌'} ${file}`)
})

// 3. Verificar package.json
console.log('\n📦 DEPENDÊNCIAS')
console.log('-'.repeat(60))

const packageJsonPath = path.join(__dirname, 'package.json')
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const requiredDeps = {
        '@supabase/supabase-js': 'Supabase Client',
        'react': 'React',
        'react-router-dom': 'React Router'
    }

    Object.entries(requiredDeps).forEach(([dep, name]) => {
        const installed = !!deps[dep]
        console.log(`   ${installed ? '✅' : '❌'} ${name} (${dep})`)
    })
}

// 4. Resumo
console.log('\n' + '='.repeat(60))
console.log('📊 RESUMO')
console.log('='.repeat(60))

if (!envExists) {
    console.log('❌ CRÍTICO: Arquivo .env não encontrado')
    console.log('   → Crie o arquivo .env baseado no .env.example')
} else if (!fs.readFileSync(envPath, 'utf-8').includes('VITE_OPENAI_API_KEY')) {
    console.log('❌ CRÍTICO: Chave OpenAI não configurada')
    console.log('   → Adicione VITE_OPENAI_API_KEY ao arquivo .env')
} else {
    console.log('✅ Configuração básica OK')
    console.log('   → Reinicie o servidor se ainda não funcionar')
}

console.log('\n📖 Para mais detalhes, leia: CONFIGURAR_IA_NOA.md')
console.log('='.repeat(60) + '\n')
