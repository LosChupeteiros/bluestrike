// Endpoint de teste para validar o fluxo matchzy_loadmatch_url.
// Usado para confirmar que o servidor CS2 consegue buscar o JSON de configuração.
// Remove após validação.

export async function GET() {
  const config = {
    team1: {
      name: "team_chupex",
      players: {
        "76561198842144251": "chupetao",
      },
    },
    team2: {
      name: "team_sputnik",
      players: {
        "76561198313075481": "higorguilherme",
      },
    },
    num_maps: 1,
    maplist: ["de_nuke"],
  };

  return Response.json(config, {
    headers: { "Cache-Control": "no-store" },
  });
}
