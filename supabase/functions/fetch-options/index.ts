const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getSessionCookies(): Promise<string[]> {
  const pageRes = await fetch("https://timetable.sruniv.com/batchReport", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const cookieJar: string[] = [];
  for (const [key, val] of pageRes.headers.entries()) {
    if (key === "set-cookie") {
      cookieJar.push(val.split(";")[0]);
    }
  }
  await pageRes.text();
  return cookieJar;
}

interface BatchRecord {
  id: number;
  degree: string;
  year: string;
  batch: string;
  semester: string;
  school_dept: string;
  session: string;
  group_name: string | null;
  sub_batch: string | null;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, degree, year } = await req.json();

    if (!action || !degree) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action or degree" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cookies = await getSessionCookies();

    // The university API at /get-yearbpublic returns ALL batch records for a degree.
    // We extract unique years from this data for getYears,
    // and filter by year for getBatches.
    const url = `https://timetable.sruniv.com/get-yearbpublic?degree=${encodeURIComponent(degree)}`;
    const res = await fetch(url, {
      headers: {
        "Cookie": cookies.join("; "),
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `University API returned ${res.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = await res.text();
    console.log(`Raw data (first 500): ${raw.substring(0, 500)}`);
    const data = JSON.parse(raw);
    
    // Flatten: could be [[{...}]] or [{...}] or {key: [{...}]}
    let records: BatchRecord[] = [];
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0])) {
        records = data[0];
      } else if (data.length > 0 && typeof data[0] === "object" && data[0].batch) {
        records = data;
      }
    } else if (typeof data === "object") {
      const vals = Object.values(data);
      if (vals.length > 0 && Array.isArray(vals[0])) {
        records = vals[0] as BatchRecord[];
      }
    }
    console.log(`Parsed ${records.length} records`);

    if (action === "getYears") {
      const yearOrder: Record<string, number> = { "First": 1, "Second": 2, "Third": 3, "Fourth": 4, "Fifth": 5 };
      const uniqueYears = [...new Set(records.map(r => r.year))].sort((a, b) => (yearOrder[a] || 99) - (yearOrder[b] || 99));
      return new Response(
        JSON.stringify({ success: true, options: uniqueYears }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getBatches") {
      if (!year) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing year" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also try the dedicated batch endpoint
      const batchUrl = `https://timetable.sruniv.com/get-batchbpublic?degree=${encodeURIComponent(degree)}&year=${encodeURIComponent(year)}`;
      const batchRes = await fetch(batchUrl, {
        headers: {
          "Cookie": cookies.join("; "),
          "User-Agent": "Mozilla/5.0",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json",
        },
      });

      if (batchRes.ok) {
        const batchData = await batchRes.json();
        // Could be array of strings or array of objects
        let batches: string[] = [];
        const arr = Array.isArray(batchData) && Array.isArray(batchData[0]) ? batchData[0] : Array.isArray(batchData) ? batchData : [];
        if (arr.length > 0) {
          if (typeof arr[0] === "string") {
            batches = arr;
          } else if (typeof arr[0] === "object" && arr[0].batch) {
            batches = arr.map((r: any) => r.batch);
          }
        }

        if (batches.length > 0) {
          return new Response(
            JSON.stringify({ success: true, options: batches }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Fallback: filter from the year data
      const filteredBatches = records.filter(r => r.year === year).map(r => r.batch);
      return new Response(
        JSON.stringify({ success: true, options: filteredBatches }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
