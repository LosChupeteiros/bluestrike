function Fix($path, $pairs) {
  $content = Get-Content $path -Raw -Encoding UTF8
  foreach ($p in $pairs) { $content = $content.Replace($p[0], $p[1]) }
  Set-Content $path -Value $content -Encoding UTF8 -NoNewline
  Write-Host "Fixed: $path"
}

Fix 'src/app/admin/create-tournament-panel.tsx' @(
  ,@('Erro de conexao ao enviar imagem.', 'Erro de conexão ao enviar imagem.')
  ,@('Nao foi possivel cadastrar o campeonato.', 'Não foi possível cadastrar o campeonato.')
  ,@('Esse formulario ja grava o campeonato no Supabase com valor de inscricao pronto para o fluxo fake de PIX.', 'Esse formulário já grava o campeonato no Supabase com valor de inscrição pronto para o fluxo fake de PIX.')
  ,@('Area administrativa', 'Área administrativa')
  ,@('label className="mb-2 block text-sm font-semibold">Descricao</label>', 'label className="mb-2 block text-sm font-semibold">Descrição</label>')
  ,@('Explique proposta, publico e nivel do campeonato.', 'Explique proposta, público e nível do campeonato.')
  ,@('Premiacao total', 'Premiação total')
  ,@('Inscricao via PIX', 'Inscrição via PIX')
  ,@('Maximo de times', 'Máximo de times')
  ,@('Eliminacao simples', 'Eliminação simples')
  ,@('Eliminacao dupla', 'Eliminação dupla')
  ,@('Inscricoes abertas', 'Inscrições abertas')
  ,@('Inscricoes ate', 'Inscrições até')
)

Fix 'src/app/tournaments/[id]/tournament-registration-card.tsx' @(
  ,@('Nao foi possivel concluir a inscricao.', 'Não foi possível concluir a inscrição.')
  ,@('Inscricao concluida', 'Inscrição concluída')
  ,@('Confirmar inscricao', 'Confirmar inscrição')
  ,@('Inscricao confirmada com sucesso.', 'Inscrição confirmada com sucesso.')
  ,@('Essa etapa simula a experiencia de pagamento para o fluxo de inscricao.', 'Essa etapa simula a experiência de pagamento para o fluxo de inscrição.')
  ,@('Valor da inscricao', 'Valor da inscrição')
  ,@('Ja paguei', 'Já paguei')
)

Fix 'src/app/auth/login/page.tsx' @(
  ,@('A chave da Steam ainda nao foi configurada no ambiente.', 'A chave da Steam ainda não foi configurada no ambiente.')
  ,@('As variaveis do Supabase ainda nao foram configuradas no ambiente.', 'As variáveis do Supabase ainda não foram configuradas no ambiente.')
  ,@('Nao foi possivel validar o retorno da Steam. Tente novamente.', 'Não foi possível validar o retorno da Steam. Tente novamente.')
  ,@('A Steam autenticou, mas falhou ao buscar os dados publicos do perfil.', 'A Steam autenticou, mas falhou ao buscar os dados públicos do perfil.')
  ,@('A Steam autenticou, mas o BlueStrike nao conseguiu salvar seu perfil no Supabase. Use uma chave secreta de backend em SUPABASE_SECRET_KEY.', 'A Steam autenticou, mas o BlueStrike não conseguiu salvar seu perfil no Supabase. Use uma chave secreta de backend em SUPABASE_SECRET_KEY.')
  ,@('A Steam autenticou, mas houve uma falha ao criar sua sessao no BlueStrike.', 'A Steam autenticou, mas houve uma falha ao criar sua sessão no BlueStrike.')
  ,@('Nao foi possivel entrar com a Steam.', 'Não foi possível entrar com a Steam.')
  ,@('Ao entrar, voce concorda com nossos', 'Ao entrar, você concorda com nossos')
  ,@('Politica de Privacidade', 'Política de Privacidade')
  ,@('Cadastro obrigatorio apos login', 'Cadastro obrigatório após login')
  ,@('Sessao protegida', 'Sessão protegida')
  ,@('Voltar para o inicio', 'Voltar para o início')
)

Fix 'src/app/admin/faceit-prizes-panel.tsx' @(
  ,@('Inscricoes abertas', 'Inscrições abertas')
  ,@('Editar premiacao', 'Editar premiação')
  ,@('Cadastrar premiacao', 'Cadastrar premiação')
  ,@('Deixe 0 para nao exibir. Taxa de inscricao aparece no fluxo de inscricao BlueStrike.', 'Deixe 0 para não exibir. Taxa de inscrição aparece no fluxo de inscrição BlueStrike.')
  ,@('Salvar premiacao', 'Salvar premiação')
  ,@('Premiacoes FACEIT', 'Premiações FACEIT')
  ,@('Gerenciar premiacoes', 'Gerenciar premiações')
  ,@('o podio de cada campeonato FACEIT. Os valores aparecem nos cards e na pagina do campeonato.', 'o pódio de cada campeonato FACEIT. Os valores aparecem nos cards e na página do campeonato.')
)

Fix 'src/app/tournaments/[id]/tournament-detail-page-view.tsx' @(
  ,@('Eliminacao Simples', 'Eliminação Simples')
  ,@('Eliminacao Dupla', 'Eliminação Dupla')
  ,@('A inscricao precisa ser feita pelo capitao do time.', 'A inscrição precisa ser feita pelo capitão do time.')
  ,@('As inscricoes ainda nao estao abertas para esse campeonato.', 'As inscrições ainda não estão abertas para esse campeonato.')
  ,@('premiacao total', 'premiação total')
  ,@('Distribuicao de premios', 'Distribuição de prêmios')
  ,@('Inscricoes ate', 'Inscrições até')
  ,@('Valor da inscricao', 'Valor da inscrição')
  ,@('ELO minimo', 'ELO mínimo')
  ,@('ELO maximo', 'ELO máximo')
  ,@('O nao cumprimento das regras pode resultar em desclassificacao e bloqueio do time.', 'O não cumprimento das regras pode resultar em desclassificação e bloqueio do time.')
  ,@('Chaveamento ainda nao gerado', 'Chaveamento ainda não gerado')
  ,@('Informacoes Rapidas', 'Informações Rápidas')
  ,@('TabsTrigger value="info">Informacoes</TabsTrigger>', 'TabsTrigger value="info">Informações</TabsTrigger>')
  ,@('Vaga disponivel', 'Vaga disponível')
  ,@('>Inscricao<', '>Inscrição<')
)

Fix 'src/app/teams/teams-catalog-page.tsx' @(
  ,@('paginas', 'páginas')
  ,@('Proxima pagina', 'Próxima página')
  ,@('Pagina anterior', 'Página anterior')
  ,@('Pagina {teamList.page} de {teamList.totalPages}', 'Página {teamList.page} de {teamList.totalPages}')
  ,@('Catalogo de Times', 'Catálogo de Times')
  ,@('descricao...', 'descrição...')
  ,@('ELO medio', 'ELO médio')
)

Fix 'src/app/teams/[slug]/team-profile-page.tsx' @(
  ,@('Sem funcao', 'Sem função')
  ,@('>Capitao<', '>Capitão<')
  ,@('Informacoes', 'Informações')
  ,@('Gestao do capitao', 'Gestão do capitão')
  ,@('Se a line acabar ou voce quiser reorganizar tudo, pode arquivar o time por aqui.', 'Se a line acabar ou você quiser reorganizar tudo, pode arquivar o time por aqui.')
  ,@('Sem descricao ainda.', 'Sem descrição ainda.')
  ,@('Estatisticas', 'Estatísticas')
  ,@('ELO medio', 'ELO médio')
  ,@('Codigo de convite', 'Código de convite')
)

Fix 'src/app/teams/create/create-team-form-client.tsx' @(
  ,@('Nao foi possivel criar o time.', 'Não foi possível criar o time.')
  ,@('Escolha um nome unico. A tag aparece nas partidas e vira parte da identidade publica da line.', 'Escolha um nome único. A tag aparece nas partidas e vira parte da identidade pública da line.')
  ,@('Assim que criar, o time ja entra no catalogo e voce vira capitao automaticamente.', 'Assim que criar, o time já entra no catálogo e você vira capitão automaticamente.')
  ,@('Voce vira capitao automaticamente e ganha a pagina publica da equipe.', 'Você vira capitão automaticamente e ganha a página pública da equipe.')
  ,@('O codigo de entrada fica disponivel para voce levar a line pelo Discord ou WhatsApp.', 'O código de entrada fica disponível para você levar a line pelo Discord ou WhatsApp.')
  ,@('Na pagina do time voce pode expulsar jogadores, ajustar vagas e excluir a equipe se precisar.', 'Na página do time você pode expulsar jogadores, ajustar vagas e excluir a equipe se precisar.')
  ,@('O time ja entrou no hub, aparece no catalogo publico e estamos te levando para a aba', 'O time já entrou no hub, aparece no catálogo público e estamos te levando para a aba')
  ,@('Minimo 4 caracteres', 'Mínimo 4 caracteres')
  ,@('<span className="text-[var(--muted-foreground)]">Voce</span>', '<span className="text-[var(--muted-foreground)]">Você</span>')
  ,@('<Badge variant="gold">Capitao</Badge>', '<Badge variant="gold">Capitão</Badge>')
)

Fix 'src/app/profile/[id]/profile-edit-modal.tsx' @(
  ,@('Atualize apenas o que aparece no seu perfil publico: bio e funcao em jogo.', 'Atualize apenas o que aparece no seu perfil público: bio e função em jogo.')
  ,@('Ajuste como voce se apresenta para capitaes, lineups e organizadores.', 'Ajuste como você se apresenta para capitães, lineups e organizadores.')
  ,@('Descreva seu estilo, comunicacao, pontos fortes e o tipo de time em que voce rende melhor.', 'Descreva seu estilo, comunicação, pontos fortes e o tipo de time em que você rende melhor.')
  ,@('Bio publica', 'Bio pública')
  ,@('label className="text-sm font-semibold text-[var(--foreground)]">Funcao em jogo</label>', 'label className="text-sm font-semibold text-[var(--foreground)]">Função em jogo</label>')
  ,@('aria-label="Funcao em jogo"', 'aria-label="Função em jogo"')
  ,@('Limpar funcao', 'Limpar função')
  ,@('Nao foi possivel salvar.', 'Não foi possível salvar.')
  ,@('Salvar alteracoes', 'Salvar alterações')
)

Fix 'src/components/tournament/faceit-tournament-card.tsx' @(
  ,@('Inscricoes abertas', 'Inscrições abertas')
  ,@('Premiacao Total', 'Premiação Total')
  ,@('Premiacao a definir', 'Premiação a definir')
  ,@('Ver inscricao', 'Ver inscrição')
  ,@('>premiacao<', '>premiação<')
  ,@('alt="Nivel ', 'alt="Nível ')
)

Fix 'src/app/api/admin/faceit-prizes/route.ts' @(
  ,@('Voce precisa entrar com a Steam.', 'Você precisa entrar com a Steam.')
  ,@('Apenas administradores podem gerenciar premiacoes.', 'Apenas administradores podem gerenciar premiações.')
  ,@('championshipId e obrigatorio.', 'championshipId é obrigatório.')
  ,@('Erro ao salvar premiacao.', 'Erro ao salvar premiação.')
)

Fix 'src/app/api/tournaments/[id]/register/route.ts' @(
  ,@('Voce precisa entrar com a Steam antes de inscrever um time.', 'Você precisa entrar com a Steam antes de inscrever um time.')
  ,@('Nao foi possivel concluir a inscricao.', 'Não foi possível concluir a inscrição.')
)
