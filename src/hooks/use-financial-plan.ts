import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { financialPlanQuery } from "@/directus/financial-plans";
import { refreshEvery, stuckAfterMs } from "@/model/financial-plans";

/**
 * A Financial Plan, read again while its numbers can change, and whether they've been missing long enough to say they
 * couldn't be worked out.
 */
export function useFinancialPlan(setId: string) {
  const [stuck, setStuck] = useState(false);
  const { data } = useSuspenseQuery({
    ...financialPlanQuery(setId),
    refetchInterval: (q) => (q.state.status === "error" ? false : refreshEvery(q.state.data, stuck)),
  });
  const missing = !!data && !data.results;
  useEffect(() => {
    if (!missing) {
      return;
    }
    const timer = setTimeout(() => setStuck(true), stuckAfterMs);
    return () => {
      clearTimeout(timer);
      setStuck(false);
    };
  }, [missing, setId]);
  return { data, stuck: missing && stuck };
}
