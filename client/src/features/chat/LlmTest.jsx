import { useState } from 'react';

export function LlmTest() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!name) {
      setError('Por favor, digite um nome.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // Graças ao proxy, podemos chamar a API diretamente
      const res = await fetch(`/llm/consulta?name=${name}`);

      if (!res.ok) {
        throw new Error(`Erro na rede: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.answer); // O backend retorna um objeto com a chave "answer"

    } catch (err) {
      setError(`Falha ao buscar resposta: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Teste de Comunicação com a LLM</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite um nome"
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar'}
      </button>

      {isLoading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && (
        <div>
          <hr />
          <h2>Resposta da IA:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}