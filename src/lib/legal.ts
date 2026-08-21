// Conteúdo jurídico da plataforma.
//
// Mantido como dado estruturado (e não JSX solto) para que Termos e Política
// compartilhem o mesmo layout, o índice lateral seja gerado automaticamente e
// qualquer atualização de texto não exija mexer em componente.
//
// ⚠️  Os campos de BLUESTRIKE_ENTITY precisam ser preenchidos com os dados reais
//     da empresa antes de publicar. Não invente CNPJ nem endereço.

export interface LegalEntity {
  legalName: string;
  tradeName: string;
  cnpj: string;
  address: string;
  supportEmail: string;
  privacyEmail: string;
  dpoName: string;
  jurisdiction: string;
}

export const BLUESTRIKE_ENTITY: LegalEntity = {
  legalName: "[Razão social — preencher]",
  tradeName: "BlueStrike E-Sports",
  cnpj: "[CNPJ — preencher]",
  address: "[Endereço completo — preencher]",
  supportEmail: "contato@bluestrike.com.br",
  privacyEmail: "privacidade@bluestrike.com.br",
  dpoName: "[Nome do Encarregado — preencher]",
  jurisdiction: "[Comarca — preencher]",
};

export interface LegalBlock {
  kind: "paragraph" | "list" | "note" | "table";
  text?: string;
  items?: string[];
  /** Usado quando kind = "table" */
  columns?: string[];
  rows?: string[][];
}

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: "terms" | "privacy";
  eyebrow: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  summary: string[];
  sections: LegalSection[];
}

const E = BLUESTRIKE_ENTITY;

// ─────────────────────────────────────────────────────────────────────────────
// TERMOS DE USO
// ─────────────────────────────────────────────────────────────────────────────

export const TERMS_DOCUMENT: LegalDocument = {
  slug: "terms",
  eyebrow: "Documentos oficiais",
  title: "Termos de Uso",
  subtitle:
    "As regras do jogo fora do servidor: o que a BlueStrike entrega, o que esperamos de você e como tratamos inscrição, premiação e punição.",
  effectiveDate: "21 de agosto de 2026",
  lastUpdated: "21 de agosto de 2026",
  summary: [
    "Você precisa de conta Steam própria e ter 18 anos ou mais para competir.",
    "A inscrição é feita pelo capitão, por time, e só vale depois do pagamento aprovado.",
    "A premiação é paga em PIX para o capitão do time vencedor, na chave que ele cadastrar.",
    "Trapaça, conta emprestada ou smurf resultam em desclassificação sem reembolso.",
  ],
  sections: [
    {
      id: "quem-somos",
      number: "1",
      title: "Quem somos",
      blocks: [
        {
          kind: "paragraph",
          text: `A BlueStrike é uma plataforma brasileira de campeonatos de Counter-Strike 2, operada por ${E.legalName}, inscrita no CNPJ ${E.cnpj}, com sede em ${E.address} (aqui chamada simplesmente de "BlueStrike", "nós" ou "plataforma").`,
        },
        {
          kind: "paragraph",
          text: "Organizamos campeonatos, provisionamos servidores dedicados, calculamos ranking e ELO, e pagamos premiação em dinheiro. Não somos afiliados, patrocinados nem endossados pela Valve Corporation, pela FACEIT ou por qualquer outra empresa citada nestes Termos.",
        },
        {
          kind: "paragraph",
          text: "Estes Termos valem para todo o site, para as partidas hospedadas por nós e para qualquer serviço que a gente ofereça a partir deles.",
        },
      ],
    },
    {
      id: "aceitacao",
      number: "2",
      title: "Aceitação e capacidade",
      blocks: [
        {
          kind: "paragraph",
          text: "Ao criar sua conta, se inscrever em um campeonato ou simplesmente usar a plataforma, você declara que leu, entendeu e concorda com estes Termos e com a nossa Política de Privacidade. Se você não concorda com algum ponto, não use a plataforma.",
        },
        {
          kind: "paragraph",
          text: "Counter-Strike 2 é classificado como não recomendado para menores de 18 anos no Brasil, e nossos campeonatos envolvem pagamento e premiação em dinheiro. Por isso, para competir você precisa ter 18 anos completos e plena capacidade civil.",
        },
        {
          kind: "note",
          text: "Se identificarmos que uma conta pertence a menor de 18 anos, ela será suspensa, a inscrição cancelada e o valor pago devolvido ao pagador original.",
        },
      ],
    },
    {
      id: "conta",
      number: "3",
      title: "Sua conta e o vínculo com a Steam",
      blocks: [
        {
          kind: "paragraph",
          text: "O acesso à BlueStrike acontece exclusivamente por login com a Steam. Você se autentica no domínio da Valve e nós recebemos apenas a confirmação da sua identidade e os dados públicos do seu perfil. A BlueStrike nunca vê, pede nem armazena sua senha da Steam.",
        },
        { kind: "paragraph", text: "Ao manter uma conta aqui, você se compromete a:" },
        {
          kind: "list",
          items: [
            "Usar uma conta Steam de sua titularidade, com CS2 na biblioteca e em situação regular junto à Valve.",
            "Manter uma única conta na plataforma. Contas secundárias, alternativas ou criadas para burlar punição serão removidas.",
            "Informar dados verdadeiros, completos e atualizados no cadastro.",
            "Não emprestar, vender, alugar ou compartilhar sua conta — nem a da Steam, nem a da BlueStrike.",
            "Zelar pela segurança do seu acesso e nos avisar imediatamente se suspeitar de uso indevido.",
          ],
        },
        {
          kind: "paragraph",
          text: "Você é responsável por tudo que acontece na sua conta. Partidas jogadas por terceiros com o seu acesso contam como se fossem suas, inclusive para efeito de punição.",
        },
      ],
    },
    {
      id: "cadastro",
      number: "4",
      title: "Cadastro competitivo",
      blocks: [
        {
          kind: "paragraph",
          text: "Além do login da Steam, para competir você precisa completar o cadastro com nome completo, CPF, celular, data de nascimento e e-mail. Esses dados existem por três motivos concretos: confirmar que você é maior de idade, evitar contas duplicadas e viabilizar o pagamento da premiação.",
        },
        {
          kind: "paragraph",
          text: "Para receber prêmio, o capitão também cadastra uma chave PIX. Ela pode ser o próprio CPF, o celular, o e-mail que você já informou, ou uma chave aleatória do seu banco.",
        },
        {
          kind: "note",
          text: "CPF, celular, data de nascimento, e-mail e chave PIX nunca aparecem no seu perfil público nem em nenhuma listagem aberta. Como tratamos esses dados está detalhado na Política de Privacidade.",
        },
      ],
    },
    {
      id: "times",
      number: "5",
      title: "Times, capitães e modalidades",
      blocks: [
        {
          kind: "paragraph",
          text: "A competição na BlueStrike é por time. Cada time pertence a uma modalidade — 1x1, 2x2, 3x3, 4x4 ou 5x5 — e só disputa campeonatos daquela modalidade. Um mesmo jogador pode ter times diferentes em modalidades diferentes.",
        },
        {
          kind: "paragraph",
          text: "Quem cria o time vira capitão. O capitão é o representante do time perante a BlueStrike e é quem:",
        },
        {
          kind: "list",
          items: [
            "Convida e remove jogadores do elenco.",
            "Inscreve o time nos campeonatos e efetua o pagamento da taxa.",
            "Escolhe os jogadores que entram na escalação da competição.",
            "Cadastra a chave PIX que vai receber a premiação do time.",
            "Conduz o veto de mapas e responde pelo time na arbitragem.",
          ],
        },
        {
          kind: "note",
          text: "A BlueStrike paga a premiação integralmente ao capitão e não participa da divisão entre os jogadores. Combine isso com a sua line antes de competir.",
        },
      ],
    },
    {
      id: "inscricao",
      number: "6",
      title: "Inscrição, vagas e pagamento",
      blocks: [
        {
          kind: "paragraph",
          text: "Cada campeonato tem número de vagas, valor de inscrição, modalidade e janela de inscrição definidos na própria página do campeonato. Vale sempre o que estiver publicado lá.",
        },
        {
          kind: "paragraph",
          text: "Nos campeonatos pagos, a inscrição funciona assim:",
        },
        {
          kind: "list",
          items: [
            "O capitão escolhe o time e a escalação e gera uma cobrança PIX.",
            "A vaga fica reservada por 15 minutos enquanto o pagamento está pendente.",
            "Se o PIX não for confirmado nesse prazo, a reserva expira e a vaga volta a ficar disponível para outros times.",
            "A inscrição só é confirmada quando o pagamento é aprovado pelo provedor. Antes disso, o time não está inscrito.",
          ],
        },
        {
          kind: "paragraph",
          text: "Os pagamentos são processados pelo Mercado Pago. A BlueStrike não armazena dados de cartão nem credenciais bancárias — apenas o status e a referência da transação, para conseguir vincular o pagamento à inscrição.",
        },
      ],
    },
    {
      id: "premiacao",
      number: "7",
      title: "Premiação",
      blocks: [
        {
          kind: "paragraph",
          text: "A premiação de cada campeonato é a que estiver publicada na página do campeonato, com a distribuição por colocação informada antes do início da competição.",
        },
        {
          kind: "list",
          items: [
            "O pagamento é feito via PIX, na chave cadastrada pelo capitão do time premiado.",
            "O prazo é de até 7 (sete) dias úteis contados da confirmação oficial do resultado.",
            "Se a chave PIX estiver ausente, incorreta ou pertencer a terceiro não identificado, o prazo passa a contar da regularização.",
            "O pagamento só é liberado após o encerramento de eventuais denúncias ou revisões de arbitragem envolvendo aquela partida.",
          ],
        },
        {
          kind: "paragraph",
          text: "Cada jogador é responsável pelos tributos incidentes sobre valores que receber. A BlueStrike efetua as retenções que a legislação exigir e fornece o comprovante do pagamento quando solicitado.",
        },
      ],
    },
    {
      id: "fair-play",
      number: "8",
      title: "Fair play e conduta",
      blocks: [
        {
          kind: "paragraph",
          text: "Campeonato só tem graça se a disputa for honesta. Por isso, é proibido:",
        },
        {
          kind: "list",
          items: [
            "Usar cheat, script, macro, exploit, bug conhecido ou qualquer software que altere o comportamento do jogo.",
            "Jogar com conta de outra pessoa, escalar jogador não inscrito ou usar smurf para burlar faixa de ELO.",
            "Combinar resultado, entregar partida de propósito ou manipular placar por qualquer motivo.",
            "Praticar racismo, homofobia, xenofobia, assédio, ameaça ou qualquer forma de discriminação — dentro ou fora do servidor.",
            "Atrapalhar deliberadamente a partida com desconexões, AFK, team damage intencional ou abuso de pausa.",
            "Tentar burlar, sobrecarregar ou obter acesso indevido a qualquer parte da plataforma.",
          ],
        },
        {
          kind: "paragraph",
          text: "Times precisam estar presentes no horário. O não comparecimento dentro da janela de check-in configura W.O. e o adversário avança.",
        },
      ],
    },
    {
      id: "servidores",
      number: "9",
      title: "Servidores, mapas e skins",
      blocks: [
        {
          kind: "paragraph",
          text: "As partidas rodam em servidores dedicados provisionados pela BlueStrike para cada confronto. O mapa vem do veto entre os capitães, dentro da mapa pool da modalidade — competitiva no 3x3, 4x4 e 5x5; wingman no 2x2; mapas de aim no 1x1.",
        },
        {
          kind: "paragraph",
          text: "A plataforma oferece personalização cosmética de skins nos nossos servidores. Isso é um recurso de servidor, restrito às partidas da BlueStrike: não altera, não transfere e não gera qualquer direito sobre o seu inventário real da Steam.",
        },
        {
          kind: "paragraph",
          text: "Servidores, demos e estatísticas podem ficar indisponíveis por manutenção, falha de terceiros ou instabilidade do próprio jogo. Fazemos o possível para reagendar ou reprocessar quando isso acontece.",
        },
      ],
    },
    {
      id: "cancelamento",
      number: "10",
      title: "Cancelamento, adiamento e reembolso",
      blocks: [
        {
          kind: "paragraph",
          text: "Se a BlueStrike cancelar um campeonato antes do início, todas as inscrições pagas são devolvidas integralmente, pelo mesmo meio de pagamento.",
        },
        {
          kind: "list",
          items: [
            "Adiamento: a inscrição continua válida para a nova data. Se o time não puder participar, o capitão pode pedir reembolso até 24 horas antes do novo horário.",
            "Desistência do time: reembolso integral se solicitado com mais de 24 horas de antecedência do início; depois disso, a vaga já está comprometida e não há devolução.",
            "Desclassificação por infração: não gera reembolso.",
            "Não comparecimento (W.O.): não gera reembolso.",
          ],
        },
        {
          kind: "paragraph",
          text: "Pedidos de reembolso devem ser feitos pelo capitão, a partir do e-mail cadastrado, para " + E.supportEmail + ". Respondemos em até 5 dias úteis.",
        },
      ],
    },
    {
      id: "penalidades",
      number: "11",
      title: "Penalidades",
      blocks: [
        {
          kind: "paragraph",
          text: "Conforme a gravidade e a reincidência, podemos aplicar: advertência, perda de rounds, derrota administrativa, desclassificação do campeonato, retenção da premiação, suspensão temporária ou banimento permanente da plataforma.",
        },
        {
          kind: "paragraph",
          text: "Decisões de arbitragem são comunicadas ao capitão e podem ser contestadas em até 48 horas, por e-mail, com as evidências que o time tiver. A decisão sobre a contestação é final.",
        },
        {
          kind: "note",
          text: "Em caso de trapaça comprovada, a premiação é retida, o resultado é revisto e o valor redistribuído aos demais colocados.",
        },
      ],
    },
    {
      id: "propriedade",
      number: "12",
      title: "Propriedade intelectual",
      blocks: [
        {
          kind: "paragraph",
          text: "A marca BlueStrike, o site, o design, os textos e o código são nossos ou licenciados para nós. Você não pode copiar, redistribuir ou criar obra derivada sem autorização por escrito.",
        },
        {
          kind: "paragraph",
          text: "Counter-Strike 2 e a Steam são marcas da Valve Corporation. FACEIT e Mercado Pago são marcas dos seus respectivos titulares. Citamos essas marcas apenas para identificar os serviços que integramos.",
        },
        {
          kind: "paragraph",
          text: "O conteúdo que você publica (nome do time, logo, descrição, bio) continua sendo seu. Ao publicá-lo, você nos autoriza a exibi-lo na plataforma e em divulgações dos nossos campeonatos, e garante que tem os direitos necessários para isso.",
        },
      ],
    },
    {
      id: "responsabilidade",
      number: "13",
      title: "Limitação de responsabilidade",
      blocks: [
        {
          kind: "paragraph",
          text: "A plataforma é oferecida no estado em que se encontra. Trabalhamos para manter tudo disponível e correto, mas não garantimos operação ininterrupta nem ausência total de falhas.",
        },
        {
          kind: "paragraph",
          text: "Não respondemos por indisponibilidade dos serviços da Valve, FACEIT, Mercado Pago ou dos provedores de servidor, por falhas na conexão do próprio jogador, nem por acordos particulares entre membros de um time.",
        },
        {
          kind: "paragraph",
          text: "Nada nesta cláusula afasta os direitos que o Código de Defesa do Consumidor garante a você.",
        },
      ],
    },
    {
      id: "alteracoes",
      number: "14",
      title: "Alterações destes Termos",
      blocks: [
        {
          kind: "paragraph",
          text: "Podemos atualizar estes Termos para refletir mudanças na plataforma ou na legislação. A data de última atualização fica sempre no topo desta página.",
        },
        {
          kind: "paragraph",
          text: "Quando a mudança for relevante — especialmente sobre pagamento, premiação ou punição — avisamos por e-mail ou por notificação na plataforma com pelo menos 15 dias de antecedência. Continuar usando a BlueStrike depois disso significa aceitar a nova versão.",
        },
      ],
    },
    {
      id: "foro",
      number: "15",
      title: "Lei aplicável e foro",
      blocks: [
        {
          kind: "paragraph",
          text: `Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de ${E.jurisdiction} para dirimir controvérsias, ressalvado o direito do consumidor de acionar o foro do seu domicílio.`,
        },
        {
          kind: "paragraph",
          text: `Dúvidas, reclamações e pedidos: ${E.supportEmail}.`,
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICA DE PRIVACIDADE
// ─────────────────────────────────────────────────────────────────────────────

export const PRIVACY_DOCUMENT: LegalDocument = {
  slug: "privacy",
  eyebrow: "Documentos oficiais",
  title: "Política de Privacidade",
  subtitle:
    "O que coletamos, por que coletamos, com quem compartilhamos e como você controla os seus dados. Escrito para ser entendido, não para se esconder atrás de juridiquês.",
  effectiveDate: "21 de agosto de 2026",
  lastUpdated: "21 de agosto de 2026",
  summary: [
    "CPF, celular, data de nascimento, e-mail e chave PIX nunca aparecem no seu perfil público.",
    "Não vendemos os seus dados e não usamos cookie de publicidade ou rastreamento de terceiros.",
    "Coletamos CPF para confirmar maioridade, evitar conta duplicada e pagar premiação — nada além disso.",
    "Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.",
  ],
  sections: [
    {
      id: "controlador",
      number: "1",
      title: "Quem é o controlador dos seus dados",
      blocks: [
        {
          kind: "paragraph",
          text: `O controlador é ${E.legalName}, CNPJ ${E.cnpj}, com sede em ${E.address}, que opera a plataforma BlueStrike.`,
        },
        {
          kind: "paragraph",
          text: `Encarregado pelo Tratamento de Dados Pessoais (DPO): ${E.dpoName} — ${E.privacyEmail}.`,
        },
        {
          kind: "paragraph",
          text: "Esta Política segue a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).",
        },
      ],
    },
    {
      id: "dados",
      number: "2",
      title: "Quais dados coletamos",
      blocks: [
        {
          kind: "paragraph",
          text: "Coletamos só o que a plataforma precisa para funcionar. Nada de formulário longo por precaução.",
        },
        {
          kind: "table",
          columns: ["Categoria", "Dados", "Origem"],
          rows: [
            [
              "Identificação Steam",
              "SteamID, nome de perfil, avatar, URL do perfil e nível Steam",
              "Login com a Steam",
            ],
            [
              "Cadastro competitivo",
              "Nome completo, CPF, celular, data de nascimento e e-mail",
              "Informado por você",
            ],
            [
              "Pagamento e premiação",
              "Chave PIX e tipo de chave, status e referência das transações",
              "Informado por você e pelo provedor de pagamento",
            ],
            [
              "Perfil público",
              "Bio, função em jogo, times, ELO e histórico de ELO",
              "Informado por você e gerado pela plataforma",
            ],
            [
              "Competição",
              "Inscrições, escalações, vetos de mapa, resultados e estatísticas de partida (abates, mortes, dano, HS)",
              "Gerado nas partidas",
            ],
            [
              "FACEIT (opcional)",
              "ID, nickname, avatar, nível, ELO e estatísticas públicas",
              "Só se você conectar a conta",
            ],
            [
              "Técnicos",
              "Cookie de sessão e registros de acesso e de operação dos servidores",
              "Gerado automaticamente",
            ],
          ],
        },
        {
          kind: "note",
          text: "Não coletamos dado sensível na acepção do art. 5º, II da LGPD, e não pedimos número de cartão, senha bancária ou documento com foto.",
        },
      ],
    },
    {
      id: "finalidade",
      number: "3",
      title: "Por que usamos cada dado e com qual base legal",
      blocks: [
        {
          kind: "table",
          columns: ["Uso", "Base legal (LGPD)"],
          rows: [
            [
              "Criar e manter sua conta e sua sessão",
              "Execução de contrato — art. 7º, V",
            ],
            [
              "Confirmar que você tem 18 anos ou mais",
              "Cumprimento de obrigação legal e proteção do titular — art. 7º, II e VII",
            ],
            [
              "Processar inscrição e cobrança do campeonato",
              "Execução de contrato — art. 7º, V",
            ],
            [
              "Pagar a premiação via PIX",
              "Execução de contrato — art. 7º, V",
            ],
            [
              "Evitar conta duplicada, smurf e fraude na premiação",
              "Legítimo interesse — art. 7º, IX",
            ],
            [
              "Calcular ELO, ranking e exibir seu perfil competitivo",
              "Execução de contrato — art. 7º, V",
            ],
            [
              "Enviar notificações de partida e check-in",
              "Execução de contrato — art. 7º, V",
            ],
            [
              "Integrar sua conta FACEIT",
              "Consentimento — art. 7º, I (revogável a qualquer momento)",
            ],
            [
              "Guardar registros de acesso da aplicação",
              "Cumprimento de obrigação legal — art. 7º, II c/c Marco Civil, art. 15",
            ],
          ],
        },
        {
          kind: "note",
          text: "Não fazemos decisão automatizada que gere efeito jurídico sobre você. Punições por trapaça ou conduta passam sempre por revisão humana da arbitragem.",
        },
      ],
    },
    {
      id: "publico",
      number: "4",
      title: "O que é público e o que nunca é",
      blocks: [
        {
          kind: "paragraph",
          text: "A BlueStrike é uma plataforma competitiva, então parte do seu perfil é pública por natureza — é isso que permite ranking, catálogo de times e histórico de partidas.",
        },
        {
          kind: "paragraph",
          text: "Fica visível para qualquer visitante: nome de perfil da Steam, avatar, ELO, função em jogo, bio, times, e resultados e estatísticas das suas partidas.",
        },
        {
          kind: "note",
          text: "Nunca fica visível para outros usuários: CPF, celular, data de nascimento, e-mail, chave PIX e nome completo. Esses campos são removidos no servidor antes de a página ser montada, e não aparecem nem no código-fonte da página.",
        },
        {
          kind: "paragraph",
          text: "Administradores da BlueStrike acessam a chave PIX e o nome do capitão apenas no momento de pagar a premiação de um campeonato encerrado, e esse acesso é registrado.",
        },
      ],
    },
    {
      id: "compartilhamento",
      number: "5",
      title: "Com quem compartilhamos",
      blocks: [
        {
          kind: "paragraph",
          text: "Não vendemos, alugamos nem cedemos seus dados. Compartilhamos apenas com quem é necessário para a plataforma operar:",
        },
        {
          kind: "table",
          columns: ["Parceiro", "O que recebe", "Para quê"],
          rows: [
            ["Valve (Steam)", "A autenticação em si; recebemos de volta os dados públicos do perfil", "Login e identificação"],
            ["Mercado Pago", "Nome e e-mail do pagador, valor e referência", "Processar a cobrança PIX"],
            ["Dathost", "SteamID e nickname dos jogadores da partida", "Configurar o servidor da partida"],
            ["FACEIT", "Sua identificação FACEIT, se você conectar", "Exibir nível e estatísticas"],
            ["Supabase", "Dados da plataforma, hospedados como operador", "Banco de dados"],
            ["Vercel", "Requisições e registros de acesso", "Hospedagem da aplicação"],
          ],
        },
        {
          kind: "paragraph",
          text: "Também podemos compartilhar dados quando houver ordem judicial, requisição de autoridade competente ou necessidade de defender nossos direitos em processo.",
        },
      ],
    },
    {
      id: "internacional",
      number: "6",
      title: "Transferência internacional",
      blocks: [
        {
          kind: "paragraph",
          text: "Alguns dos parceiros acima operam servidores fora do Brasil. Nesses casos a transferência é feita com base no art. 33 da LGPD, por ser necessária à execução do contrato com você, e exigimos dos operadores garantias contratuais de proteção equivalentes às desta Política.",
        },
      ],
    },
    {
      id: "cookies",
      number: "7",
      title: "Cookies",
      blocks: [
        {
          kind: "paragraph",
          text: "Usamos um único cookie, e ele é estritamente necessário:",
        },
        {
          kind: "table",
          columns: ["Cookie", "Função", "Duração"],
          rows: [
            [
              "bluestrike_session",
              "Mantém você autenticado. É httpOnly, ou seja, inacessível a scripts da página",
              "30 dias",
            ],
          ],
        },
        {
          kind: "note",
          text: "Não usamos cookie de publicidade, pixel de rede social nem ferramenta de rastreamento de terceiros. Por isso também não exibimos banner de consentimento de cookies — não há nada opcional para consentir.",
        },
      ],
    },
    {
      id: "retencao",
      number: "8",
      title: "Por quanto tempo guardamos",
      blocks: [
        {
          kind: "table",
          columns: ["Dado", "Prazo"],
          rows: [
            ["Conta e perfil", "Enquanto a conta existir"],
            ["Registros de acesso da aplicação", "6 meses (Marco Civil da Internet, art. 15)"],
            ["Dados fiscais e de pagamento", "5 anos, contados do fim do exercício"],
            ["Estatísticas e resultados de partida", "Mantidos como histórico competitivo, desvinculados do seu cadastro após a exclusão da conta"],
            ["Chave PIX", "Excluída junto com a conta, respeitado o prazo fiscal dos pagamentos já feitos"],
          ],
        },
        {
          kind: "paragraph",
          text: "Encerrado o prazo, os dados são eliminados ou anonimizados de forma irreversível.",
        },
      ],
    },
    {
      id: "direitos",
      number: "9",
      title: "Seus direitos",
      blocks: [
        {
          kind: "paragraph",
          text: "O art. 18 da LGPD garante a você, a qualquer momento e sem custo:",
        },
        {
          kind: "list",
          items: [
            "Confirmar se tratamos dados seus e acessar esses dados.",
            "Corrigir dados incompletos, inexatos ou desatualizados.",
            "Pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.",
            "Solicitar a portabilidade dos seus dados a outro fornecedor.",
            "Revogar o consentimento — por exemplo, desconectando a integração FACEIT.",
            "Saber com quais entidades compartilhamos seus dados.",
            "Se opor a tratamento fundado em legítimo interesse.",
          ],
        },
        {
          kind: "paragraph",
          text: `Para exercer qualquer um deles, escreva para ${E.privacyEmail} a partir do e-mail cadastrado na sua conta. Respondemos em até 15 dias.`,
        },
        {
          kind: "note",
          text: "Alguns dados podem ser mantidos mesmo após o pedido de exclusão, quando houver obrigação legal ou necessidade de defesa em processo. Se isso acontecer, explicamos exatamente o quê e por quê.",
        },
      ],
    },
    {
      id: "seguranca",
      number: "10",
      title: "Segurança",
      blocks: [
        {
          kind: "list",
          items: [
            "Todo o tráfego do site é criptografado em trânsito (HTTPS).",
            "A sessão usa token assinado em cookie httpOnly, inacessível a scripts.",
            "Dados pessoais são removidos no servidor antes de qualquer página pública ser montada.",
            "O acesso administrativo a dados de pagamento é restrito e registrado.",
            "Senhas da Steam nunca passam pela BlueStrike — a autenticação acontece no domínio da Valve.",
          ],
        },
        {
          kind: "paragraph",
          text: "Se ocorrer incidente de segurança com risco relevante aos seus direitos, comunicamos você e a ANPD nos prazos previstos em lei.",
        },
      ],
    },
    {
      id: "menores",
      number: "11",
      title: "Dados de menores de idade",
      blocks: [
        {
          kind: "paragraph",
          text: "A plataforma é destinada exclusivamente a maiores de 18 anos e não coletamos dados de menores intencionalmente. Identificado o cadastro de menor, a conta é suspensa, os dados são eliminados e qualquer valor pago é devolvido.",
        },
        {
          kind: "paragraph",
          text: `Se você é responsável e acredita que um menor sob sua guarda criou conta aqui, escreva para ${E.privacyEmail} que tratamos com prioridade.`,
        },
      ],
    },
    {
      id: "mudancas",
      number: "12",
      title: "Mudanças nesta Política",
      blocks: [
        {
          kind: "paragraph",
          text: "Se mudarmos a forma como tratamos seus dados, atualizamos esta página e a data de última atualização no topo. Mudanças relevantes são comunicadas por e-mail ou notificação na plataforma com pelo menos 15 dias de antecedência.",
        },
        {
          kind: "paragraph",
          text: `Dúvidas sobre privacidade: ${E.privacyEmail}. Você também pode registrar reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD).`,
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocument["slug"], LegalDocument> = {
  terms: TERMS_DOCUMENT,
  privacy: PRIVACY_DOCUMENT,
};
