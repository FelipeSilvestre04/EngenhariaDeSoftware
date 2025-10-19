import { useState } from 'react';

export function LlmTest() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = () => {
    // Por enquanto, vamos apenas simular a resposta
    console.log('Nome enviado:', name);
    setResponse(`Ainda não conectamos ao backend, mas o nome "${name}" foi capturado!`);
  };

  return (
    <div>
      <h1>Teste de Comunicação com a LLM</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite um nome"
      />
      <button onClick={handleSubmit}>Enviar</button>

      {response && (
        <div>
          <hr />
          <h2>Resposta:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}