import { useState, useEffect } from "react";
import api from "./services/api";

export default function App() {
  const [nav, setNav] = useState("missao"); // "missao" | "avistamento" | "listagem"
  const [missoes, setMissoes] = useState([]);
  const [especies, setEspecies] = useState([]);

  // Carrega dados globais
  useEffect(() => {
    api.get("/missoes").then(res => setMissoes(res.data));
    api.get("/especies").then(res => setEspecies(res.data));
  }, []);

  /** ---------------- Criar Missão ---------------- */
  const CriarMissao = ({ onMissaoCriada }) => {
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");
    const [duracao, setDuracao] = useState("");
    const [tipoMissaoId, setTipoMissaoId] = useState("");
    const [responsavelId, setResponsavelId] = useState("");
    const [condicaoMeteorologicaId, setCondicaoMeteorologicaId] = useState("");
    const [baseId, setBaseId] = useState("");

    const criar = async () => {
      try {
        const res = await api.post("/missoes", {
          data, hora, duracao,
          tipoMissaoId, responsavelId, condicaoMeteorologicaId, baseId
        });
        const novaMissao = res.data;
        setMissoes([...missoes, novaMissao]);
        onMissaoCriada(novaMissao.id);
        alert("Missão criada com sucesso!");
      } catch (err) {
        console.error(err);
        alert("Erro ao criar missão");
      }
    };

    return (
      <div>
        <h2>Criar Missão</h2>
        <input type="date" value={data} onChange={e => setData(e.target.value)} />
        <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
        <input type="number" placeholder="Duração (min)" value={duracao} onChange={e => setDuracao(e.target.value)} />
        <input type="number" placeholder="Tipo de Missão ID" value={tipoMissaoId} onChange={e => setTipoMissaoId(e.target.value)} />
        <input type="number" placeholder="Responsável ID" value={responsavelId} onChange={e => setResponsavelId(e.target.value)} />
        <input type="number" placeholder="Condição Meteorológica ID" value={condicaoMeteorologicaId} onChange={e => setCondicaoMeteorologicaId(e.target.value)} />
        <input type="number" placeholder="Base de Operações ID" value={baseId} onChange={e => setBaseId(e.target.value)} />
        <button onClick={criar}>Criar Missão</button>
      </div>
    );
  };

  /** ---------------- Criar Avistamento ---------------- */
  const CriarAvistamento = () => {
    const [missaoId, setMissaoId] = useState("");
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");
    const [localizacao, setLocalizacao] = useState("");
    const [descricao, setDescricao] = useState("");
    const [numeroOrcas, setNumeroOrcas] = useState(0);
    const [testemunhas, setTestemunhas] = useState([]);
    const [especiesSelecionadas, setEspeciesSelecionadas] = useState([]);

    const adicionarTestemunha = () => {
      setTestemunhas([...testemunhas, { nome: "", dataNascimento: "", codigoPostal: "" }]);
    };

    const removerTestemunha = (index) => {
      const copy = [...testemunhas];
      copy.splice(index, 1);
      setTestemunhas(copy);
    };

    const criar = async () => {
      if (!missaoId) return alert("Selecione uma missão!");
      try {
        await api.post("/avistamentos", {
          avistamento: { missaoId, data, hora, localizacao, descricao, numeroOrcas },
          testemunhas,
          especies: especiesSelecionadas
        });
        alert("Avistamento criado com sucesso!");
        // reset
        setMissaoId("");
        setData("");
        setHora("");
        setLocalizacao("");
        setDescricao("");
        setNumeroOrcas(0);
        setTestemunhas([]);
        setEspeciesSelecionadas([]);
      } catch (err) {
        console.error(err);
        alert("Erro ao criar avistamento");
      }
    };

    return (
      <div>
        <h2>Criar Avistamento</h2>

        <select value={missaoId} onChange={e => setMissaoId(Number(e.target.value))}>
          <option value="">Selecionar Missão</option>
          {missoes.map(m => (
            <option key={m.id} value={m.id}>Missão {m.id}</option>
          ))}
        </select>

        <input type="date" value={data} onChange={e => setData(e.target.value)} />
        <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
        <input placeholder="Localização" value={localizacao} onChange={e => setLocalizacao(e.target.value)} />
        <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
        <input type="number" placeholder="Número de Orcas" value={numeroOrcas} onChange={e => setNumeroOrcas(Number(e.target.value))} />

        <h4>Espécies Observadas</h4>
        <select multiple value={especiesSelecionadas} onChange={e => setEspeciesSelecionadas(Array.from(e.target.selectedOptions, o => Number(o.value)))}>
          {especies.map(e => (
            <option key={e.id} value={e.id}>{e.nomeComum}</option>
          ))}
        </select>

        <h4>Testemunhas</h4>
        {testemunhas.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
            <input placeholder="Nome" value={t.nome} onChange={e => {
              const copy = [...testemunhas]; copy[i].nome = e.target.value; setTestemunhas(copy);
            }} />
            <input type="date" placeholder="Data Nascimento" value={t.dataNascimento} onChange={e => {
              const copy = [...testemunhas]; copy[i].dataNascimento = e.target.value; setTestemunhas(copy);
            }} />
            <input placeholder="Código Postal" value={t.codigoPostal} onChange={e => {
              const copy = [...testemunhas]; copy[i].codigoPostal = e.target.value; setTestemunhas(copy);
            }} />
            <button type="button" onClick={() => removerTestemunha(i)}>Remover</button>
          </div>
        ))}
        <button type="button" onClick={adicionarTestemunha}>Adicionar Testemunha</button>

        <br />
        <button onClick={criar}>Criar Avistamento</button>
      </div>
    );
  };

  /** ---------------- Listagem ---------------- */
  const Listagem = () => {
    const [avistamentos, setAvistamentos] = useState([]);

    useEffect(() => {
      carregarAvistamentos();
    }, []);

    const carregarAvistamentos = async () => {
      const res = await api.get("/avistamentos");
      setAvistamentos(res.data);
    };

    const removerAvistamento = async (id) => {
      if (!window.confirm("Tem certeza que deseja remover este avistamento?")) return;
      try {
        await api.delete(`/avistamentos/${id}`);
        setAvistamentos(avistamentos.filter(a => a.id !== id));
        alert("Avistamento removido!");
      } catch (err) {
        console.error(err);
        alert("Erro ao remover avistamento");
      }
    };

    return (
      <div>
        <h2>Listagem de Avistamentos</h2>
        <ul>
          {avistamentos.map(a => (
            <li key={a.id}>
              Missão {a.missaoId} - {a.localizacao} - {a.numeroOrcas} Orcas
              <button style={{ marginLeft: "8px" }} onClick={() => removerAvistamento(a.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  /** ---------------- Render principal ---------------- */
  return (
    <div>
      <h1>🛠 Sistema Orcas</h1>
      <nav style={{ marginBottom: "16px" }}>
        <button onClick={() => setNav("missao")}>Criar Missão</button>
        <button onClick={() => setNav("avistamento")}>Criar Avistamento</button>
        <button onClick={() => setNav("listagem")}>Listagem</button>
      </nav>

      {nav === "missao" && <CriarMissao onMissaoCriada={() => setNav("avistamento")} />}
      {nav === "avistamento" && <CriarAvistamento />}
      {nav === "listagem" && <Listagem />}
    </div>
  );
}
