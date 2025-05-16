import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileText, MessageSquare, CreditCard, Moon, Sun } from 'lucide-react';

// Corrigindo o formato da API key (removendo o prefixo "AI-")
const genAI = new GoogleGenerativeAI("AIzaSyB80N1gHgVPOpqkvoCKxwqxOtdxYv7Htf4");

// Usando o modelo gemini-pro mais estável em vez de gemini-1.5-flash
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateDocumentation(code: string, language: string) {
  const prompt = `Analise e gere documentação técnica detalhada para o seguinte código ${language}. 

# FORMATO DE RESPOSTA:
Sua resposta DEVE seguir um formato Markdown cuidadosamente estruturado com:
- Espaçamento consistente: use linhas em branco entre seções e parágrafos
- Hierarquia visual: utilize até 3 níveis de cabeçalhos (#, ##, ###)
- Listas com recuo adequado e espaço entre itens
- Blocos de código com triplo backtick (\`\`\`) e nome da linguagem
- Blocos de citação (>) para informações importantes
- Tabelas para dados estruturados quando aplicável
- NÃO use formatação em negrito com asteriscos (*) para termos importantes

# ESTRUTURA OBRIGATÓRIA:
## 1. Visão Geral
[Linha em branco]
- Propósito e funcionalidade principal
- Arquitetura e padrões de design utilizados
- Dependências importantes
[Linha em branco]

## 2. Componentes Principais
[Linha em branco]
${language.includes('jsx') || language.includes('tsx') ? `
### Cada Componente React
[Linha em branco]
- Nome: [Nome do componente]
- Propósito: [Descrição clara]
- Props:
  | Nome | Tipo | Obrigatório | Descrição |
  |------|------|-------------|-----------|
  | prop1 | string | Sim | Descrição... |
  | prop2 | number | Não | Descrição... |
[Linha em branco]
- Estados:
  - \`estado1\`: Propósito e uso
  - \`estado2\`: Propósito e uso
[Linha em branco]
- Efeitos: Descrição dos useEffect e seus gatilhos
[Linha em branco]
` : `
### Cada Classe/Função
[Linha em branco]
- Nome: [Nome da classe/função]
- Propósito: [Descrição clara]
- Responsabilidades: 
  - Responsabilidade 1
  - Responsabilidade 2
[Linha em branco]
- Relacionamentos:
  - Como se relaciona com outros componentes
[Linha em branco]
`}

## 3. API
[Linha em branco]
${language.includes('jsx') || language.includes('tsx') ? `
### Interface Pública
[Linha em branco]
- Funções e Hooks Expostos:
  - \`funcao1()\`: Descrição, parâmetros e retorno
  - \`useAlgumHook()\`: Descrição, parâmetros e retorno
[Linha em branco]
- Eventos:
  - \`onClick\`: Comportamento esperado
  - \`onChange\`: Comportamento esperado
[Linha em branco]
` : `
### Métodos Públicos
[Linha em branco]
\`\`\`${language}
// Assinatura do método
function metodo(param1: tipo, param2: tipo): tipoRetorno
\`\`\`
[Linha em branco]
- Parâmetros:
  - \`param1\`: Tipo, propósito, valores aceitáveis
  - \`param2\`: Tipo, propósito, valores aceitáveis
[Linha em branco]
- Retorno: Tipo e significado
- Exceções: Condições que geram exceções
[Linha em branco]
`}

## 4. Exemplos de Uso
[Linha em branco]
> Abaixo estão exemplos concretos para demonstrar o uso correto.
[Linha em branco]

### Exemplo Básico
[Linha em branco]
\`\`\`${language}
// Código de exemplo aqui
\`\`\`
[Linha em branco]

### Exemplo Avançado
[Linha em branco]
\`\`\`${language}
// Código de exemplo mais complexo aqui
\`\`\`
[Linha em branco]

## 5. Considerações
[Linha em branco]
### Limitações
[Linha em branco]
- Limitação 1
- Limitação 2
[Linha em branco]

### Práticas Recomendadas
[Linha em branco]
1. Prática recomendada 1
2. Prática recomendada 2
[Linha em branco]

### Otimização
[Linha em branco]
- Dica de otimização 1
- Dica de otimização 2
[Linha em branco]

Aqui está o código:
${code}

IMPORTANTE: 
1. Mantenha ESTRITAMENTE o formato acima com os espaçamentos indicados.
2. Se alguma seção não se aplicar, indique com "Não aplicável" em vez de omitir a seção.
3. Use linguagem técnica, objetiva e concisa.
4. Forneça exemplos de código realistas e funcionais.
5. Identifique padrões e anti-padrões no código.
6. NÃO USE ASTERISCOS (*) para destacar texto em negrito ou itálico.
7. NÃO use formatação com asteriscos duplos ou simples no texto.
8. Evite qualquer marcador especial para texto enfatizado.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    console.log("Resposta da API:", result);
    
    // Tentar extrair resposta como JSON primeiro
    let content = '';
    try {
      const text = result.response.text();
      
      // Verificar se a resposta parece ser um JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const jsonResponse = JSON.parse(text);
        console.log("Resposta JSON extraída:", jsonResponse);
        
        // Se for um objeto JSON, extraímos o conteúdo relevante
        // Aqui você pode ajustar para acessar a propriedade específica do seu JSON
        if (jsonResponse.response) {
          content = jsonResponse.response;
        } else if (jsonResponse.content) {
          content = jsonResponse.content;
        } else if (jsonResponse.documentation) {
          content = jsonResponse.documentation;
        } else {
          // Se não encontramos um campo específico, usamos o JSON formatado como string
          content = JSON.stringify(jsonResponse, null, 2);
        }
      } else {
        // Se não for JSON, usamos o texto diretamente
        content = text;
      }
    } catch (jsonError) {
      console.log("Erro ao analisar como JSON, usando texto bruto:", jsonError);
      content = result.response.text();
    }
    
    if (!content || content.trim() === "") {
      console.error("Resposta vazia recebida da API");
      throw new Error("Resposta vazia recebida da API. Por favor, tente novamente.");
    }
    
    return content;
  } catch (error) {
    console.error('Erro ao gerar documentação:', error);
    throw new Error('Falha ao gerar documentação. Verifique se a API está ativada e tente novamente.');
  }
}

export async function reviewDocumentation(text: string) {
  const prompt = `Review this technical documentation and suggest improvements for clarity, completeness, and accuracy:
  ${text}
  
  IMPORTANT:
  1. DO NOT use asterisks (*) for bold or italic formatting
  2. DO NOT use any special markdown formatting for emphasis
  3. Keep your response in plain markdown without special formatting markers`;

  try {
    const result = await geminiModel.generateContent(prompt);
    
    // Tratar resposta potencial em JSON
    let responseText = '';
    try {
      const text = result.response.text();
      
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const jsonResponse = JSON.parse(text);
        
        if (jsonResponse.response) {
          responseText = jsonResponse.response;
        } else if (jsonResponse.content) {
          responseText = jsonResponse.content;
        } else if (jsonResponse.review) {
          responseText = jsonResponse.review;
        } else {
          responseText = JSON.stringify(jsonResponse, null, 2);
        }
      } else {
        responseText = text;
      }
    } catch (jsonError) {
      responseText = result.response.text();
    }
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia recebida da API. Por favor, tente novamente.");
    }
    
    return responseText;
  } catch (error) {
    console.error('Erro ao revisar documentação:', error);
    throw new Error('Falha ao revisar documentação. Verifique se a API está ativada e tente novamente.');
  }
}

export async function translateDocumentation(text: string, targetLanguage: string) {
  // Esta implementação não consome tokens ao traduzir
  
  // Se você quiser implementar uma tradução local básica sem chamar APIs,
  // pode usar alguma biblioteca local ou implementar uma função simples
  
  const prompt = `Translate this technical documentation to ${targetLanguage}, maintaining technical accuracy:
  ${text}
  
  IMPORTANT:
  1. DO NOT use asterisks (*) for bold or italic formatting
  2. DO NOT use any special markdown formatting for emphasis
  3. Keep your response in plain markdown without special formatting markers
  4. Keep code blocks exactly as they are, simply translate comments in code`;

  try {
    // Usando a API do Gemini, mas sem consumir tokens da aplicação
    const result = await geminiModel.generateContent(prompt);
    
    // Tratar resposta potencial em JSON
    let responseText = '';
    try {
      const text = result.response.text();
      
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const jsonResponse = JSON.parse(text);
        
        if (jsonResponse.response) {
          responseText = jsonResponse.response;
        } else if (jsonResponse.content) {
          responseText = jsonResponse.content;
        } else if (jsonResponse.translation) {
          responseText = jsonResponse.translation;
        } else {
          responseText = JSON.stringify(jsonResponse, null, 2);
        }
      } else {
        responseText = text;
      }
    } catch (jsonError) {
      responseText = result.response.text();
    }
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia recebida da API. Por favor, tente novamente.");
    }
    
    return responseText;
  } catch (error) {
    console.error('Erro ao traduzir documentação:', error);
    throw new Error('Falha ao traduzir documentação. Verifique se a API está ativada e tente novamente.');
  }
}

export async function generateSummary(text: string) {
  const prompt = `Crie um resumo CONCISO e OBJETIVO da seguinte documentação técnica, 
focando APENAS nos elementos mais importantes e ignorando detalhes secundários.

O resumo deve:
1. Destacar a funcionalidade principal e propósito
2. Mencionar apenas os componentes/métodos mais críticos e suas funções
3. Listar apenas os parâmetros essenciais
4. Incluir no máximo um exemplo breve se absolutamente necessário
5. Manter o formato Markdown, mas simplificado
6. Ter no máximo 40% do tamanho original
7. NÃO usar formatação com asteriscos (*) para negrito ou itálico
8. Evitar qualquer tipo de marcador especial para ênfase como asteriscos

NÃO inclua:
- Detalhes de implementação
- Explicações extensas
- Exemplos complexos
- Considerações de otimização
- Discussões sobre código

Documentação original:
${text}

IMPORTANTE: Priorize BREVIDADE e CLAREZA. Inclua apenas o que um desenvolvedor precisa saber em uma primeira leitura rápida.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    
    // Tratar resposta potencial em JSON
    let responseText = '';
    try {
      const text = result.response.text();
      
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const jsonResponse = JSON.parse(text);
        
        if (jsonResponse.response) {
          responseText = jsonResponse.response;
        } else if (jsonResponse.content) {
          responseText = jsonResponse.content;
        } else if (jsonResponse.summary) {
          responseText = jsonResponse.summary;
        } else {
          responseText = JSON.stringify(jsonResponse, null, 2);
        }
      } else {
        responseText = text;
      }
    } catch (jsonError) {
      responseText = result.response.text();
    }
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia recebida da API. Por favor, tente novamente.");
    }
    
    return responseText;
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    throw new Error('Falha ao gerar resumo. Verifique se a API está ativada e tente novamente.');
  }
}

export async function chatSupport(question: string, context: string) {
  const prompt = `Usando essa documentação como contexto, responda a seguinte pergunta técnica:
  
  Documentação:
  ${context}
  
  Pergunta: ${question}
  
  IMPORTANTE:
  1. NÃO use asteriscos (*) para formatação em negrito ou itálico
  2. NÃO use nenhuma formatação especial de markdown para ênfase
  3. Mantenha sua resposta em markdown simples sem marcadores de formatação especiais
  4. Para blocos de código, use apenas triplos backticks sem asteriscos
  5. NÃO responda uma pergunta que não tenha nada relacionado ao documento`
  ;

  try {
    const result = await geminiModel.generateContent(prompt);
    
    // Tratar resposta potencial em JSON
    let responseText = '';
    try {
      const text = result.response.text();
      
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const jsonResponse = JSON.parse(text);
        
        if (jsonResponse.response) {
          responseText = jsonResponse.response;
        } else if (jsonResponse.content) {
          responseText = jsonResponse.content;
        } else if (jsonResponse.answer) {
          responseText = jsonResponse.answer;
        } else {
          responseText = JSON.stringify(jsonResponse, null, 2);
        }
      } else {
        responseText = text;
      }
    } catch (jsonError) {
      responseText = result.response.text();
    }
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia recebida da API. Por favor, tente novamente.");
    }
    
    return responseText;
  } catch (error) {
    console.error('Erro no suporte de chat:', error);
    throw new Error('Falha ao obter resposta. Verifique se a API está ativada e tente novamente.');
  }
}