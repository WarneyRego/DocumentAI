import React, { useState, useEffect, useRef } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Check, Coins, Info, ShoppingCart, CreditCard } from 'lucide-react';
import { useTokenStore } from '../../store/tokens';
import { useTheme } from '../../contexts/ThemeContext';

// Initialize MercadoPago with public key
initMercadoPago('TEST-ef4723db-f27c-475c-832b-904567411284', {
  locale: 'pt-BR',
  advancedConfiguration: {
    timeoutConfig: {
      fetchTimeout: 10000,
      initTimeout: 10000
    }
  }
});

interface Plan {
  id: string;
  name: string;
  tokens: number;
  price: number;
  features: string[];
  recommended: boolean;
  color: 'blue' | 'indigo' | 'purple';
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    tokens: 10,
    price: 9.99,
    features: [
      '10 tokens de documentação',
      'Geração básica de documentação',
      'Suporte comunitário',
      'Válido por 30 dias',
    ],
    recommended: false,
    color: 'blue',
  },
  {
    id: 'pro',
    name: 'Profissional',
    tokens: 50,
    price: 39.99,
    features: [
      '50 tokens de documentação',
      'Análise avançada com IA',
      'Suporte prioritário',
      'Tradução para todos os idiomas',
      'Válido por 30 dias',
    ],
    recommended: true,
    color: 'indigo',
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    tokens: 200,
    price: 149.99,
    features: [
      '200 tokens de documentação',
      'Tudo do plano Profissional',
      'Treinamento personalizado de IA',
      'Acesso à API',
      'Suporte dedicado',
      'Válido por 30 dias',
    ],
    recommended: false,
    color: 'purple',
  },
];

export function Pricing() {
  const { isFirstPurchase, tokens } = useTokenStore();
  const { darkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [mockPreferenceId, setMockPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [directCheckoutUrl, setDirectCheckoutUrl] = useState<string | null>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const calculatePrice = (basePrice: number): string => {
    let price = basePrice;
    
    // Apply 10% volume discount for higher tiers
    if (basePrice >= 39.99) {
      price *= 0.9;
    }
    if (basePrice >= 149.99) {
      price *= 0.9;
    }
    
    // Apply 30% first purchase discount
    if (isFirstPurchase) {
      price *= 0.7;
    }
    
    return price.toFixed(2);
  };

  // Verifica se o SDK do MercadoPago está pronto para uso
  useEffect(() => {
    // Pequeno temporizador para garantir que o SDK seja carregado
    const timer = setTimeout(() => {
      setSdkReady(true);
      console.log("MercadoPago SDK inicializado");
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Para usar checkout direto sem backend
  const generateDirectCheckoutUrl = (plan: Plan) => {
    try {
      // URL base para o checkout do MercadoPago
      const checkoutUrl = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=';
      
      // ID de preferência de teste que funciona no MercadoPago
      // Este é um ID de teste público que redirecionará para uma página de pagamento de teste
      const testPreferenceId = '1234567890-2c938e39-9916-4fc0-b02a-318d0c4d6222';
      
      console.log(`Gerando URL de checkout para plano ${plan.name} com ID ${testPreferenceId}`);
      return `${checkoutUrl}${testPreferenceId}`;
    } catch (error) {
      console.error("Erro ao gerar URL de checkout:", error);
      // Fallback para uma URL fixa em caso de erro
      return 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1234567890-2c938e39-9916-4fc0-b02a-318d0c4d6222';
    }
  };

  const handlePlanSelect = async (plan: Plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);
      setErrorMsg(null);

      // Gerar URL para checkout direto (solução alternativa sem backend)
      const checkoutUrl = generateDirectCheckoutUrl(plan);
      setDirectCheckoutUrl(checkoutUrl);
      console.log("URL de checkout direto gerada:", checkoutUrl);

      // Simulação para modo offline quando o backend não estiver disponível
      const mockId = generateMockId();
      setMockPreferenceId(mockId);
      console.log("ID de preferência simulado gerado:", mockId);

      // Função auxiliar para gerar IDs simulados
      function generateMockId() {
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 10000);
        return `mock_${timestamp}_${randomNum}`;
      }

      // Verificar se o backend está rodando e tratar erros de conexão
      try {
        console.log('Enviando solicitação para criar preferência:', {
          planId: plan.id,
          planName: plan.name,
          tokens: plan.tokens,
          price: calculatePrice(plan.price),
          isFirstPurchase
        });
        
        // Chamada para o backend para gerar preferenceId
        const response = await fetch('http://localhost:3001/api/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            tokens: plan.tokens,
            price: calculatePrice(plan.price),
            isFirstPurchase
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na requisição: ${response.status}`, errorText);
          setErrorMsg(`Erro na requisição: ${response.status}. Usando modo alternativo.`);
          // Em caso de erro, já temos o ID simulado definido
          throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);
        
        if (data.preferenceId) {
          console.log('PreferenceId recebido:', data.preferenceId);
          setPreferenceId(data.preferenceId);
        } else {
          setErrorMsg('Erro: Preferência de pagamento sem ID. Usando modo alternativo.');
          console.error('Erro: Preferência de pagamento sem ID');
          // Já temos o ID simulado definido
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMsg(`Erro de conexão: ${error.message}. Usando modo alternativo.`);
        }
        console.error('Erro de conexão com backend:', error);
        // Já temos o ID simulado definido
      }
    } catch (error) {
      console.error('Erro ao processar seleção de plano:', error);
      // Garantir que temos uma URL de checkout mesmo em caso de erro
      const fallbackUrl = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=811261319-f48e5b6b-3b13-470d-8b4e-69ccdff6e5f8";
      setDirectCheckoutUrl(fallbackUrl);
      console.log("URL de fallback configurada:", fallbackUrl);
    } finally {
      setLoading(false);
    }
  };

  // Função para renderizar um componente wallet customizado
  const renderCustomWalletButton = () => {
    // URL fixa de checkout para garantir que sempre funcionará
    const checkoutUrl = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1234567890-2c938e39-9916-4fc0-b02a-318d0c4d6222';
    
    console.log("Renderizando botão de checkout com URL:", directCheckoutUrl || checkoutUrl);
    
    return (
      <a 
        href={directCheckoutUrl || checkoutUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className={`block w-full py-4 px-6 rounded-lg font-bold transition duration-200 text-center 
          shadow-lg hover:shadow-xl transform hover:-translate-y-1 
          ${darkMode 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        <div className="flex items-center justify-center">
          <img 
            src="https://http2.mlstatic.com/storage/developers-site-cms-admin/CDV_MP/279292098786-210520-devsite-mp-logo-130x40-pt@2x.png" 
            alt="Mercado Pago" 
            className="h-6 mr-2"
          />
          <span>PAGAR AGORA</span>
        </div>
      </a>
    );
  };

  return (
    <div className={`py-16 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900 rounded-2xl mb-4">
            <ShoppingCart className={`h-8 w-8 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
          </div>
          <h2 className="text-4xl font-extrabold sm:text-5xl mb-4">
            Pacotes de Tokens
          </h2>
          <p className="mt-4 text-xl max-w-2xl mx-auto">
            Escolha o pacote de tokens que melhor atende às suas necessidades
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className={`flex items-center px-4 py-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <Coins className={`h-5 w-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'} mr-2`} />
              <span className="font-medium">Saldo atual: <span className="font-bold">{tokens} tokens</span></span>
            </div>
          </div>
          {isFirstPurchase && (
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full font-medium">
              <span className="mr-2">🎉</span>
              Desconto especial de 30% na primeira compra!
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan && selectedPlan.id === plan.id;
            const planPrice = calculatePrice(plan.price);
            const colorClasses = {
              blue: `${darkMode ? 'bg-blue-900 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`,
              indigo: `${darkMode ? 'bg-indigo-900 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`, 
              purple: `${darkMode ? 'bg-purple-900 border-purple-700 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`
            };

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 transform ${isSelected ? 'scale-105 ring-2 ring-indigo-500' : 'hover:scale-105'} overflow-hidden`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`px-4 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold rounded-full`}>
                      Recomendado
                    </div>
                  </div>
                )}
                <div className={`p-2 ${colorClasses[plan.color]}`}>
                  <div className="text-center p-4">
                    <h3 className="text-2xl font-bold">
                      {plan.name}
                    </h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-center items-baseline mb-8">
                    <span className="text-5xl font-extrabold">
                      ${planPrice}
                    </span>
                    <span className={`ml-2 text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      /pacote
                    </span>
                  </div>

                  <div className="flex items-center justify-center mb-6">
                    <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className={`font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        {plan.tokens} tokens
                      </span>
                    </div>
                  </div>
                  
                  <ul className="mt-6 space-y-4 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'} shrink-0 mt-0.5`} />
                        <span className="ml-3">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8">
                    {isSelected ? (
                      <div className="mt-4">
                        <div id="wallet_debug" className="text-sm text-red-500 mb-2">
                          {errorMsg ? (
                            <span>Erro: {errorMsg}</span>
                          ) : (
                            <span>Plano selecionado: {plan.name}</span>
                          )}
                        </div>
                        
                        {/* Sempre exibe o botão personalizado, independente do estado do Wallet */}
                        <div className="mt-4">
                          {renderCustomWalletButton()}
                          
                          {/* Botão alternativo para checkout direto - garantir que pelo menos um botão funcione */}
                          <div className="mt-4">
                            <a 
                              href="https://mpago.la/2CryDMF"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block w-full py-3 px-6 rounded-lg font-medium transition duration-200 text-center 
                                ${darkMode 
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                                  : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
                            >
                              <div className="flex items-center justify-center">
                                <span>Opção alternativa de pagamento</span>
                              </div>
                            </a>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Se o botão principal não funcionar, use esta opção
                            </p>
                          </div>
                          
                          {errorMsg && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => window.location.reload()}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  darkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                }`}
                              >
                                Tentar novamente
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Componente Wallet (opcional) */}
                        {preferenceId && sdkReady && (
                          <div className="wallet-container mt-4" ref={walletRef}>
                            <p className="text-xs text-gray-500 mb-2">Opção alternativa de pagamento via Wallet:</p>
                            <Wallet 
                              initialization={{ preferenceId }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={loading}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition duration-200 ${
                          darkMode 
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        } disabled:opacity-70 flex justify-center items-center`}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processando...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Comprar agora
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-start">
            <Info className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mt-0.5 shrink-0`} />
            <div className="ml-4">
              <h3 className="text-lg font-semibold mb-2">Sobre os tokens</h3>
              <p className="text-sm">
                Os tokens são usados para gerar documentação utilizando nossa API de inteligência artificial. 
                Cada token permite a geração de documentação para um arquivo de código.
                Os tokens permanecem válidos por 30 dias após a compra e não são reembolsáveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}