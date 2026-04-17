import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface FaceitPrizeRecord {
  championshipId: string;
  prizeTotal: number;
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
  entryFee: number;
}

type PrizeRow = {
  championship_id: string;
  prize_total: number;
  prize_first: number;
  prize_second: number;
  prize_third: number;
  entry_fee: number;
};

function mapRow(row: PrizeRow): FaceitPrizeRecord {
  return {
    championshipId: String(row.championship_id),
    prizeTotal: Number(row.prize_total ?? 0),
    prizeFirst: Number(row.prize_first ?? 0),
    prizeSecond: Number(row.prize_second ?? 0),
    prizeThird: Number(row.prize_third ?? 0),
    entryFee: Number(row.entry_fee ?? 0),
  };
}

export async function getFaceitPrizes(): Promise<FaceitPrizeRecord[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("faceit_prizes").select("*");
    return ((data ?? []) as PrizeRow[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function upsertFaceitPrize(prize: FaceitPrizeRecord): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("faceit_prizes").upsert(
    {
      championship_id: prize.championshipId,
      prize_total: prize.prizeTotal,
      prize_first: prize.prizeFirst,
      prize_second: prize.prizeSecond,
      prize_third: prize.prizeThird,
      entry_fee: prize.entryFee,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "championship_id" }
  );
}

// Remove prize records for championships that are no longer in the active list.
// Called automatically when the home/tournaments page loads.
export async function purgeStaleFaceitPrizes(activeIds: string[]): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("faceit_prizes")
      .select("championship_id");
    if (!data) return;

    const toDelete = (data as { championship_id: string }[])
      .map((r) => r.championship_id)
      .filter((id) => !activeIds.includes(id));

    if (toDelete.length === 0) return;

    await supabase.from("faceit_prizes").delete().in("championship_id", toDelete);
  } catch {
    // Best-effort — never throw
  }
}
